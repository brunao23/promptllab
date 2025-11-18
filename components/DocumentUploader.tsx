import React, { useCallback, useState } from 'react';
import { analyzeDocument } from '../services/geminiService';
import { validateFileSize, validateFileType } from '../utils/security';
import type { PromptData } from '../types';

interface DocumentUploaderProps {
    onDataExtracted: (data: Partial<PromptData>) => void;
    isLoading: boolean;
    onLoadingChange: (isLoading: boolean) => void;
}

interface FileProgress {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    error?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDataExtracted, isLoading, onLoadingChange }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [fileProgress, setFileProgress] = useState<Map<string, FileProgress>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [overallProgress, setOverallProgress] = useState({ current: 0, total: 0 });

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const validateFiles = (fileList: File[]): { valid: File[]; errors: string[] } => {
        const valid: File[] = [];
        const errors: string[] = [];

        fileList.forEach((file) => {
            // 🔒 VALIDAÇÃO DE SEGURANÇA - Tipo de arquivo
            const fileTypeValidation = validateFileType(file);
            if (!fileTypeValidation.valid) {
                errors.push(`${file.name}: ${fileTypeValidation.error || 'Tipo de arquivo não permitido.'}`);
                return;
            }

            // 🔒 VALIDAÇÃO DE SEGURANÇA - Tamanho do arquivo
            const fileSizeValidation = validateFileSize(file);
            if (!fileSizeValidation.valid) {
                errors.push(`${file.name}: ${fileSizeValidation.error || 'Arquivo muito grande.'}`);
                return;
            }

            // 🔒 VALIDAÇÃO DE SEGURANÇA - Nome do arquivo
            if (file.name.length > 255) {
                errors.push(`${file.name}: Nome muito longo (máximo 255 caracteres).`);
                return;
            }

            // Verificar tipos válidos
            const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown', 'text/html', 'text/csv'];
            const isMarkdownExt = file.name.toLowerCase().endsWith('.md');
            const isCsvExt = file.name.toLowerCase().endsWith('.csv');
            
            if (!validTypes.includes(file.type) && !isMarkdownExt && !isCsvExt) {
                errors.push(`${file.name}: Formato não suportado. Use PDF, TXT, MD, HTML ou CSV.`);
                return;
            }

            valid.push(file);
        });

        return { valid, errors };
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result?.toString().split(',')[1];
                if (base64String) {
                    resolve(base64String);
                } else {
                    reject(new Error('Falha ao ler arquivo.'));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
            reader.readAsDataURL(file);
        });
    };

    const getFileMimeType = (file: File): string => {
        const isMarkdownExt = file.name.toLowerCase().endsWith('.md');
        const isCsvExt = file.name.toLowerCase().endsWith('.csv');
        
        if (isMarkdownExt && (!file.type || file.type === '')) {
            return 'text/markdown';
        }
        
        if (isCsvExt && (!file.type || file.type === 'application/vnd.ms-excel')) {
            return 'text/csv';
        }
        
        return file.type || 'text/plain';
    };

    const processMultipleFiles = useCallback(async (fileList: File[]) => {
        setError(null);
        onLoadingChange(true);

        // Validar todos os arquivos primeiro
        const { valid, errors } = validateFiles(fileList);
        
        if (errors.length > 0) {
            setError(`Erros de validação:\n${errors.join('\n')}`);
            onLoadingChange(false);
            if (valid.length === 0) return;
        }

        if (valid.length === 0) {
            onLoadingChange(false);
            return;
        }

        // Atualizar estado dos arquivos
        setFiles(valid);
        const progressMap = new Map<string, FileProgress>();
        valid.forEach(file => {
            progressMap.set(file.name, { name: file.name, status: 'pending' });
        });
        setFileProgress(progressMap);
        setOverallProgress({ current: 0, total: valid.length });

        // Processar arquivos sequencialmente para evitar sobrecarga
        // Mas adicionar pequenos delays para não bloquear a UI
        const allExtractedData: Partial<PromptData>[] = [];
        
        for (let i = 0; i < valid.length; i++) {
            const file = valid[i];
            
            // Dar tempo ao React para atualizar a UI antes de processar o próximo arquivo
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Atualizar status para processando
            progressMap.set(file.name, { name: file.name, status: 'processing' });
            setFileProgress(new Map(progressMap));
            setOverallProgress({ current: i, total: valid.length });

            // Atualizar UI novamente
            await new Promise(resolve => setTimeout(resolve, 10));

            try {
                const base64String = await readFileAsBase64(file);
                const mimeType = getFileMimeType(file);
                
                const extractedData = await analyzeDocument(base64String, mimeType, file.name);
                allExtractedData.push(extractedData);
                
                // Marcar como completo
                progressMap.set(file.name, { name: file.name, status: 'completed' });
                setFileProgress(new Map(progressMap));
                
                // Atualizar progresso
                setOverallProgress({ current: i + 1, total: valid.length });
            } catch (err: any) {
                console.error(`Erro ao analisar ${file.name}:`, err);
                const errorMessage = err.message || 'Falha na análise do documento.';
                progressMap.set(file.name, { 
                    name: file.name, 
                    status: 'error', 
                    error: errorMessage 
                });
                setFileProgress(new Map(progressMap));
                
                // Continuar processando outros arquivos mesmo se um falhar
                setOverallProgress({ current: i + 1, total: valid.length });
            }
        }

        // Consolidar resultados de todos os arquivos
        if (allExtractedData.length > 0) {
            const consolidated = consolidateDocumentData(allExtractedData);
            onDataExtracted(consolidated);
        }

        setOverallProgress({ current: valid.length, total: valid.length });
        onLoadingChange(false);
    }, [onLoadingChange, onDataExtracted]);

    const consolidateDocumentData = (dataArray: Partial<PromptData>[]): Partial<PromptData> => {
        const consolidated: Partial<PromptData> = {
            persona: '',
            objetivo: '',
            contextoNegocio: '',
            contexto: '',
            regras: []
        };

        // Consolidar persona
        const personas = dataArray.map(d => d.persona).filter(Boolean);
        if (personas.length > 0) {
            consolidated.persona = personas.join('\n\n---\n\n');
        }

        // Consolidar objetivo
        const objetivos = dataArray.map(d => d.objetivo).filter(Boolean);
        if (objetivos.length > 0) {
            consolidated.objetivo = objetivos.join('\n\n---\n\n');
        }

        // Consolidar contextoNegocio
        const contextosNegocio = dataArray.map(d => d.contextoNegocio).filter(Boolean);
        if (contextosNegocio.length > 0) {
            consolidated.contextoNegocio = contextosNegocio.join('\n\n---\n\n');
        }

        // Consolidar contexto
        const contextos = dataArray.map(d => d.contexto).filter(Boolean);
        if (contextos.length > 0) {
            consolidated.contexto = contextos.join('\n\n---\n\n');
        }

        // Consolidar regras (união de arrays)
        const allRegras = dataArray
            .flatMap(d => d.regras || [])
            .filter((rule, index, self) => self.indexOf(rule) === index); // Remover duplicatas
        if (allRegras.length > 0) {
            consolidated.regras = allRegras;
        }

        return consolidated;
    };

    const processFile = useCallback(async (file: File) => {
        await processMultipleFiles([file]);
    }, [processMultipleFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fileArray = Array.from(e.dataTransfer.files);
            processMultipleFiles(fileArray);
        }
    }, [processMultipleFiles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const fileArray = Array.from(e.target.files);
            processMultipleFiles(fileArray);
            // Reset input para permitir selecionar os mesmos arquivos novamente
            e.target.value = '';
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Importar Conhecimento (Upload)</h3>
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    onChange={handleChange}
                    accept=".pdf,.txt,.md,.html,.csv"
                    disabled={isLoading}
                    multiple
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-8 w-8 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {overallProgress.total > 0 && (
                                <p className="text-sm text-white/80 font-medium">
                                    Processando {overallProgress.current + 1} de {overallProgress.total} arquivo(s)...
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-sm text-white/80 font-medium">
                                Arraste ou clique para upload
                            </p>
                            <p className="text-xs text-white/40">
                                Suporta múltiplos arquivos: PDF, TXT, MD, HTML, CSV
                            </p>
                        </>
                    )}
                </div>
            </div>
            {/* Lista de progresso dos arquivos */}
            {fileProgress.size > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm text-white/80 font-medium">
                        Arquivos ({Array.from(fileProgress.values()).filter(f => f.status === 'completed').length}/{fileProgress.size} concluídos)
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {Array.from(fileProgress.values()).map((file) => (
                            <div
                                key={file.name}
                                className={`p-2 rounded-lg border text-xs ${
                                    file.status === 'completed'
                                        ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-300'
                                        : file.status === 'processing'
                                        ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300'
                                        : file.status === 'error'
                                        ? 'bg-red-900/20 border-red-700/50 text-red-300'
                                        : 'bg-white/5 border-white/10 text-white/60'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="truncate flex-1">{file.name}</span>
                                    {file.status === 'completed' && (
                                        <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {file.status === 'processing' && (
                                        <svg className="animate-spin w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {file.status === 'error' && (
                                        <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                                {file.error && (
                                    <p className="mt-1 text-red-400 text-xs">{file.error}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <p className="text-sm text-red-300 font-medium">⚠️ Erro ao processar documento(s)</p>
                    <p className="text-xs text-red-400 mt-1 whitespace-pre-line">{error}</p>
                </div>
            )}
        </div>
    );
};
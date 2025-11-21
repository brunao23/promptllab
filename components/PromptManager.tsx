'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';
import { PromptInputForm } from './PromptInputForm';
import { OutputDisplay } from './OutputDisplay';
import { HistoryPanel } from './HistoryPanel';
import { ChatInterface } from './ChatInterface';
import { PromptOptimizer } from './PromptOptimizer';
import { AssistantPanel } from './AssistantPanel';
import { PasteModal } from './PasteModal';
import { ExplanationModal } from './ExplanationModal';
import { WorkspaceManager } from './WorkspaceManager';
import type { PromptData, PromptVersion, ChatMessage, FewShotExample, OptimizationPair } from '../types';
import { INITIAL_PROMPT_DATA } from '../constants';
import {
    createPrompt,
    getPrompt,
    getUserPrompts,
    createPromptVersion,
    getPromptVersions,
    saveChatMessage,
    getChatMessages,
    getDefaultWorkspace,
    getCurrentProfile,
} from '../services/supabaseService';
import {
    createFinalPrompt,
    optimizePrompt,
    generateExamples,
    explainPrompt,
    continueChat,
    startChat,
    processAudioCommand,
} from '../services/geminiService';
import {
    canCreateVersion,
    checkAccess,
    getCurrentMonthVersions,
    incrementVersionCount,
    checkUserLimits,
    canShareChat,
} from '../services/subscriptionService';
import type { GenerateContentResponse } from '@google/genai';

export default function PromptManager() {
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Estados do formulário
    const [formData, setFormData] = useState<PromptData>(INITIAL_PROMPT_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Estados de prompts e versões
    const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
    const [versionHistory, setVersionHistory] = useState<PromptVersion[]>([]);
    const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
    const [validatedVersionId, setValidatedVersionId] = useState<string | null>(null);

    // Estados de chat
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Estados de otimização
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationPairs, setOptimizationPairs] = useState<OptimizationPair[]>([]);
    const [manualOptInstructions, setManualOptInstructions] = useState('');

    // Estados de exemplos
    const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);

    // Estados de explicação
    const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);
    const [explanationContent, setExplanationContent] = useState('');
    const [explanationError, setExplanationError] = useState<string | null>(null);

    // Estados de workspace
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
    const [isSavingToRepository, setIsSavingToRepository] = useState(false);

    // Estados de assistente de voz
    const [isRecording, setIsRecording] = useState(false);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [assistantError, setAssistantError] = useState<string | null>(null);
    const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Estados de limites do usuário
    const [userLimits, setUserLimits] = useState<any>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

    // Estado de carregamento inicial
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Função para processar resposta do assistente de voz
    const processAssistantResponse = useCallback((response: GenerateContentResponse) => {
        try {
            // Extrair texto da resposta
            const text = response.text || '';
            
            // Processar function calls se houver
            if (response.functionCalls && response.functionCalls.length > 0) {
                response.functionCalls.forEach((call: any) => {
                    const { name, args } = call;
                    
                    switch (name) {
                        case 'updatePersona':
                            setFormData(prev => ({ ...prev, persona: args.text || prev.persona }));
                            break;
                        case 'updateObjetivo':
                            setFormData(prev => ({ ...prev, objetivo: args.text || prev.objetivo }));
                            break;
                        case 'updateContextoNegocio':
                            setFormData(prev => ({ ...prev, contextoNegocio: args.text || prev.contextoNegocio }));
                            break;
                        case 'updateContextoInteracao':
                            setFormData(prev => ({ ...prev, contexto: args.text || prev.contexto }));
                            break;
                        case 'addRegra':
                            if (args.text) {
                                setFormData(prev => ({ ...prev, regras: [...prev.regras, args.text] }));
                            }
                            break;
                        case 'addExemplo':
                            if (args.user && args.agent) {
                                setFormData(prev => ({
                                    ...prev,
                                    exemplos: [...prev.exemplos, {
                                        id: crypto.randomUUID(),
                                        user: args.user,
                                        agent: args.agent,
                                    }]
                                }));
                            }
                            break;
                    }
                });
            }

            // Adicionar mensagem do assistente
            if (text) {
                setAssistantMessages(prev => [...prev, { author: 'agent', text }]);
            }
        } catch (err: any) {
            console.error('Erro ao processar resposta do assistente:', err);
            setAssistantError(err.message || 'Erro ao processar resposta do assistente');
        }
    }, []);

    // Função para iniciar gravação
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result?.toString().split(',')[1];
                    if (base64Audio) {
                        setIsAssistantLoading(true);
                        try {
                            const response = await processAudioCommand(base64Audio, audioBlob.type);
                            processAssistantResponse(response);
                        } catch (err: any) {
                            setAssistantError(err.message || "Erro ao processar áudio.");
                        } finally {
                            setIsAssistantLoading(false);
                        }
                    }
                };
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            setAssistantError("Falha ao iniciar a gravação. Verifique as permissões do microfone.");
        }
    }, [processAssistantResponse]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleToggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const handleSelectApiKey = useCallback(async () => {
        try {
            if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                await window.aistudio.openSelectKey();
                setIsApiKeySelected(true);
                setAssistantError(null);
            }
        } catch (error) {
            console.error("Error opening API key selection:", error);
            setAssistantError("Não foi possível abrir o seletor de chave de API.");
        }
    }, []);

    const handleGeneratePrompt = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        // Obter workspace atual
        const workspaceIdToUse = currentWorkspaceId || (await getDefaultWorkspace())?.id || undefined;

        // Salvar ou criar prompt no banco
        let promptId = currentPromptId;
        if (!promptId) {
            // Criar novo prompt
            console.log('📝 Criando novo prompt no banco...', workspaceIdToUse ? `(workspace: ${workspaceIdToUse})` : '');
            try {
                const newPrompt = await createPrompt(formData, undefined, workspaceIdToUse);
                promptId = newPrompt.id;
                setCurrentPromptId(promptId);
                console.log('✅ Novo prompt criado:', promptId);
            } catch (promptError: any) {
                console.error('❌ ERRO ao criar prompt:', promptError);
                setError(`Erro ao salvar prompt no banco: ${promptError.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
                setIsLoading(false);
                return;
            }
        } else {
            // Criar novo registro de prompt (histórico)
            console.log('📝 Atualizando prompt no banco:', promptId);
            try {
                await createPrompt(formData, `Prompt ${new Date().toLocaleDateString('pt-BR')}`, workspaceIdToUse);
                console.log('✅ Prompt atualizado');
            } catch (promptError: any) {
                console.error('❌ ERRO ao atualizar prompt:', promptError);
                setError(`Erro ao atualizar prompt no banco: ${promptError.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
                setIsLoading(false);
                return;
            }
        }

        console.log('🤖 Gerando conteúdo do prompt...');
        const promptContent = await createFinalPrompt(formData);

        // Verificar limite de versões antes de criar
        const versionCheck = await canCreateVersion();
        if (!versionCheck.allowed) {
            setError(versionCheck.reason || 'Limite de versões atingido');
            setIsLoading(false);
            return;
        }

        // Verificar se promptId existe (TypeScript check)
        if (!promptId) {
            setError('Erro: ID do prompt não encontrado. Tente novamente.');
            setIsLoading(false);
            return;
        }

        // Criar versão no banco (promptId é garantidamente string aqui)
        console.log('💾 Salvando versão no banco...');
        let newVersion: PromptVersion;
        const finalPromptId: string = promptId; // Type assertion para garantir que é string
        try {
            newVersion = await createPromptVersion(finalPromptId, {
                content: promptContent,
                format: formData.formatoSaida,
                masterFormat: formData.masterPromptFormat,
                sourceData: formData,
            });
            console.log('✅ Versão salva:', newVersion.id);

            // Incrementar contador de versões
            await incrementVersionCount();

            // Atualizar limites locais
            const updatedLimits = await checkUserLimits();
            setUserLimits(updatedLimits);
        } catch (versionError: any) {
            console.error('❌ ERRO ao salvar versão:', versionError);
            setError(`Erro ao salvar versão no banco: ${versionError.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
            setIsLoading(false);
            return;
        }

        setVersionHistory(prev => [...prev, newVersion]);
        setActiveVersion(newVersion);
        setHasUnsavedChanges(false);

        // Reiniciar chat
        await startChat(promptContent);
    } catch (e: any) {
        console.error('❌ Erro ao gerar prompt:', e);
        setError(e.message || "Ocorreu um erro desconhecido. Verifique o console para mais detalhes.");
    } finally {
        setIsLoading(false);
    }
    }, [currentWorkspaceId, currentPromptId, formData]);

    const handleOptimizePrompt = useCallback(async () => {
    // Verificar limite de versões antes de otimizar
    const hasAccess = await checkAccess('create_version');
    if (!hasAccess) {
        const versionsInfo = await getCurrentMonthVersions();
        alert(`Limite de versões atingido! Você já criou ${versionsInfo.versionsCount} de ${versionsInfo.versionsLimit} versões permitidas no seu plano este mês. Upgrade para Premium para criar versões ilimitadas.`);
        return;
    }
    if (!activeVersion || !currentPromptId) return;
    if (optimizationPairs.length === 0 && !manualOptInstructions.trim()) return;

    setIsOptimizing(true);
    setError(null);
    try {
        const optimizedContent = await optimizePrompt(activeVersion.content, optimizationPairs, manualOptInstructions);

        // Verificar limite de versões antes de criar
        const versionCheck = await canCreateVersion();
        if (!versionCheck.allowed) {
            setError(versionCheck.reason || 'Limite de versões atingido');
            setIsOptimizing(false);
            return;
        }

        // Criar nova versão no banco
        const newVersion = await createPromptVersion(currentPromptId, {
            content: optimizedContent,
            format: activeVersion.sourceData.formatoSaida,
            masterFormat: activeVersion.sourceData.masterPromptFormat,
            sourceData: activeVersion.sourceData,
        });

        // Incrementar contador de versões
        await incrementVersionCount();

        // Atualizar limites locais
        const updatedLimits = await checkUserLimits();
        setUserLimits(updatedLimits);

        setVersionHistory(prev => [...prev, newVersion]);
        setActiveVersion(newVersion);
        setOptimizationPairs([]);
        setManualOptInstructions('');
    } catch (error: any) {
        console.error('❌ Erro ao otimizar prompt:', error);
        // Garantir que sempre temos uma mensagem de erro válida
        const errorMessage = error?.message || error?.toString() || "Ocorreu um erro desconhecido ao otimizar.";
        setError(errorMessage);
    } finally {
        setIsOptimizing(false);
    }
    }, [activeVersion, currentPromptId, optimizationPairs, manualOptInstructions]);

    const handleGenerateExamples = useCallback(async () => {
    setIsGeneratingExamples(true);
    setError(null);
    try {
        const newExamplesData = await generateExamples(formData);
        const newExamplesWithIds: FewShotExample[] = newExamplesData.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
        }));
        setFormData(prev => ({ ...prev, exemplos: [...prev.exemplos, ...newExamplesWithIds] }));
    } catch (e: any) {
        setError(e.message || "Ocorreu um erro ao gerar exemplos.");
    } finally {
        setIsGeneratingExamples(false);
    }
    }, [formData]);

    const handleSendMessage = useCallback(async (message: string) => {
    if (!activeVersion) {
        setError('Crie um prompt primeiro antes de enviar mensagens.');
        return;
    }

    // Adicionar mensagem do usuário ao estado e salvar no banco
    const userMessage: ChatMessage = { author: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);

    // Salvar mensagem do usuário no banco
    if (activeVersion.id) {
        try {
            await saveChatMessage(activeVersion.id, userMessage);
        } catch (err) {
            console.error('Erro ao salvar mensagem do usuário:', err);
        }
    }

    setIsChatLoading(true);
    try {
        const response = await continueChat(message);
        const agentMessage: ChatMessage = { author: 'agent', text: response };
        setChatMessages(prev => [...prev, agentMessage]);

        // Salvar mensagem do agente no banco
        if (activeVersion.id) {
            try {
                await saveChatMessage(activeVersion.id, agentMessage);
            } catch (err) {
                console.error('Erro ao salvar mensagem do agente:', err);
            }
        }
    } catch (e: any) {
        const errorMessage: ChatMessage = { author: 'agent', text: `Erro: ${e.message}` };
        setChatMessages(prev => [...prev, errorMessage]);

        // Salvar mensagem de erro no banco
        if (activeVersion.id) {
            try {
                await saveChatMessage(activeVersion.id, errorMessage);
            } catch (err) {
                console.error('Erro ao salvar mensagem de erro:', err);
            }
        }
    } finally {
        setIsChatLoading(false);
    }
    }, [activeVersion]);

    const handleClearChat = useCallback(async () => {
        if (activeVersion) {
            await startChat(activeVersion.content);
            setChatMessages([]);
        }
    }, [activeVersion]);

    // Função para detectar e extrair ferramentas do texto
    interface ExtractedTool {
        name: string;
        args: any;
        rawText: string;
    }

    const extractTools = useCallback((text: string): { conversationText: string; tools: ExtractedTool[] } => {
    const tools: ExtractedTool[] = [];
    let conversationText = text;

    // Padrão 1: [CALL: functionName(...args...)] - padrão específico para chamadas de ferramentas
    const callPattern = /\[CALL:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\]/gi;
    let match;

    while ((match = callPattern.exec(text)) !== null) {
        const toolName = match[1];
        const argsText = match[2];
        let args: any = {};

        // Tentar parsear argumentos JSON
        try {
            // Se os argumentos estão em formato de objeto JavaScript
            if (argsText.trim().startsWith('{') || argsText.includes(':')) {
                // Tentar extrair objeto JSON
                const jsonMatch = argsText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    args = JSON.parse(jsonMatch[0]);
                } else {
                    // Tentar parsear argumentos nomeados simples
                    const argPairs = argsText.split(',').map(arg => arg.trim());
                    argPairs.forEach(pair => {
                        const [key, ...valueParts] = pair.split(':');
                        if (key && valueParts.length > 0) {
                            const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
                            try {
                                args[key.trim()] = JSON.parse(value);
                            } catch {
                                args[key.trim()] = value;
                            }
                        }
                    });
                }
            } else if (argsText.trim()) {
                // Argumentos simples como string
                args = { value: argsText.trim().replace(/^['"]|['"]$/g, '') };
            }
        } catch (e) {
            // Se falhar, armazenar como string
            args = { raw: argsText };
        }

        tools.push({
            name: toolName,
            args: args,
            rawText: match[0]
        });

        // Remover do texto conversacional
        conversationText = conversationText.replace(match[0], '').trim();
    }

    // NÃO detectar funções genéricas - apenas [CALL: ...] para evitar falsos positivos

    // Limpar espaços extras do texto conversacional
    conversationText = conversationText.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

        return { conversationText, tools };
    }, []);

    // Função para limpar e normalizar texto
    const cleanTextForPDF = useCallback((text: string): string => {
    if (!text) return '';

    // Remover placeholders não processados como {{ $now }}, {{$now}}, etc.
    let cleaned = text
        .replace(/\{\{\s*\$now\s*\}\}/gi, new Date().toLocaleString('pt-BR'))
        .replace(/\{\{[^}]*\}\}/g, '') // Remover outros placeholders genéricos
        .replace(/Ø=[^ ]*/g, '') // Remover caracteres estranhos como Ø=ÜM, Ø=, etc.
        .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, (char) => {
            // Manter apenas caracteres ASCII e Unicode latino estendido
            // Substituir outros caracteres problemáticos por equivalente ou espaço
            const code = char.charCodeAt(0);
            if (code === 8203) return ''; // Zero-width space
            if (code === 8202) return ''; // Zero-width no-break space
            if (code >= 0x2000 && code <= 0x200F) return ''; // Espaços especiais
            return ' ';
        })
        .replace(/\s+/g, ' ') // Normalizar espaços múltiplos
        .trim();

        return cleaned;
    }, []);

    // Função para formatar argumentos de ferramenta para exibição
    const formatToolArgs = useCallback((args: any): string => {
    if (!args || Object.keys(args).length === 0) {
        return '(sem argumentos)';
    }

    try {
        // Formatar de forma legível
        const formatted = Object.entries(args)
            .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return `  • ${key}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`;
                } else if (typeof value === 'string' && value.length > 100) {
                    return `  • ${key}: ${value.substring(0, 100)}...`;
                } else {
                    return `  • ${key}: ${String(value)}`;
                }
            })
            .join('\n');

        return formatted;
        } catch (e) {
            return String(args);
        }
    }, []);

    const handleDownloadChat = useCallback(async (format: 'txt' | 'pdf') => {
    if (chatMessages.length === 0 || !activeVersion) return;

    // Buscar informações do especialista e agente
    let specialistName = 'Especialista';
    let agentName = 'Agente de IA';

    try {
        const profile = await getCurrentProfile();
        if (profile?.full_name) {
            specialistName = profile.full_name;
        }
    } catch (err) {
        console.error('Erro ao buscar nome do especialista:', err);
    }

    // Extrair nome do agente da persona
    try {
        if (formData.persona) {
            const personaText = cleanTextForPDF(formData.persona);
            // Tentar extrair nome comum da persona (ex: "Eu sou a Isa", "Meu nome é X", "Eu sou X")
            const nameMatch = personaText.match(/(?:eu sou (?:a|o)?|meu nome é|sou (?:a|o)?|chamo-me|me chamo)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/i);
            if (nameMatch && nameMatch[1]) {
                agentName = nameMatch[1];
            } else {
                // Se não encontrar, usar primeira palavra após "sou" ou similar
                const fallbackMatch = personaText.match(/(?:sou|é)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+(?:\s+[a-záéíóúàèìòùâêîôûãõç]+)?)/i);
                if (fallbackMatch && fallbackMatch[1]) {
                    agentName = fallbackMatch[1].trim();
                }
            }
        }
    } catch (err) {
        console.error('Erro ao extrair nome do agente:', err);
    }

    const toolName = 'LaBPrompT';
    const header = `Histórico de Chat - Prompt v${activeVersion.version}`;
    const timestamp = `Exportado em: ${new Date().toLocaleString('pt-BR')}`;

    if (format === 'txt') {
        const chatParts: string[] = [];

        chatMessages.forEach(msg => {
            const author = msg.author === 'user' ? 'Usuário' : agentName;
            const { conversationText, tools } = extractTools(msg.text);

            // Adicionar mensagem conversacional
            if (conversationText.trim()) {
                const cleanedText = cleanTextForPDF(conversationText);
                chatParts.push(`${author}: ${cleanedText}`);
            }

            // Adicionar ferramentas usadas (se houver) - apenas para mensagens do agente
            if (tools.length > 0 && msg.author === 'agent') {
                chatParts.push(`\n[Ferramentas Utilizadas por ${author}]`);
                tools.forEach(tool => {
                    chatParts.push(`  • ${tool.name}`);
                    const argsFormatted = formatToolArgs(tool.args);
                    if (argsFormatted !== '(sem argumentos)') {
                        chatParts.push(`    ${argsFormatted.replace(/\n/g, '\n    ')}`);
                    }
                });
                chatParts.push(''); // Linha em branco após ferramentas
            }
        });

        const fullContent = `${toolName}\n${header}\n\nEspecialista: ${specialistName}\nAgente: ${agentName}\n\n${timestamp}\n\n${chatParts.join('\n')}`;

        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historico_chat_v${activeVersion.version}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        let y = 20;
        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Configurar fonte para melhor suporte a caracteres UTF-8
        // jsPDF usa Helvetica por padrão que suporta bem caracteres latinos
        doc.setFont('helvetica', 'normal');

        // Logo/Ícone (usando texto estilizado como logo)
        doc.setFontSize(24);
        doc.setTextColor(16, 185, 129); // Verde esmeralda
        const toolNameText = cleanTextForPDF(toolName);
        doc.text(toolNameText, margin, y);
        y += 10;

        // Linha divisória
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Cabeçalho
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); // Preto para o cabeçalho
        const headerText = cleanTextForPDF(header);
        doc.text(headerText, margin, y);
        y += 8;

        // Informações do especialista e agente
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`Especialista: ${cleanTextForPDF(specialistName)}`, margin, y);
        y += 6;
        doc.text(`Agente: ${cleanTextForPDF(agentName)}`, margin, y);
        y += 8;

        // Timestamp
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Cinza
        const timestampText = cleanTextForPDF(timestamp);
        doc.text(timestampText, margin, y);
        y += 12;

        // Linha divisória antes das mensagens
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Mensagens do chat
        doc.setFontSize(11);

        chatMessages.forEach((msg, index) => {
            const isUser = msg.author === 'user';
            const { conversationText, tools } = extractTools(msg.text);

            // Renderizar mensagem conversacional (se houver)
            if (conversationText.trim()) {
                const text = cleanTextForPDF(conversationText);
                const bubbleWidth = pageWidth * 0.7;

                // Dividir texto em linhas que cabem na largura
                const lines = doc.splitTextToSize(text, bubbleWidth - 20);
                const lineHeight = 6;
                const padding = 8;
                const labelHeight = 5;
                const bubbleHeight = (lines.length * lineHeight) + (padding * 2) + labelHeight;

                // Nova página se necessário
                if (y + bubbleHeight > pageHeight - margin) {
                    doc.addPage();
                    y = 20;
                }

                const x = isUser ? pageWidth - bubbleWidth - margin : margin;

                // Cores: verde para usuário, cinza escuro para agente
                const userColor = [16, 185, 129]; // emerald-500
                const agentColor = [60, 60, 60]; // dark gray (mais escuro para melhor legibilidade)

                // Desenhar balão
                doc.setFillColor(isUser ? userColor[0] : agentColor[0], isUser ? userColor[1] : agentColor[1], isUser ? userColor[2] : agentColor[2]);
                doc.setDrawColor(isUser ? userColor[0] : agentColor[0], isUser ? userColor[1] : agentColor[1], isUser ? userColor[2] : agentColor[2]);
                doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 3, 3, 'FD');

                // Label do autor (pequeno)
                doc.setFontSize(9);
                doc.setTextColor(255, 255, 255, 80); // Branco semi-transparente
                const authorLabel = isUser ? 'Usuário' : agentName;
                doc.text(authorLabel, x + padding, y + padding + labelHeight);

                // Texto branco para melhor contraste
                doc.setFontSize(11);
                doc.setTextColor(255, 255, 255);
                doc.text(lines, x + padding, y + padding + labelHeight + lineHeight);

                y += bubbleHeight + 8;
            }

            // Renderizar ferramentas utilizadas (se houver) - apenas para mensagens do agente
            if (tools.length > 0 && !isUser) {
                const toolsWidth = pageWidth - (margin * 2);
                let toolsHeight = 15; // Altura inicial para título

                // Calcular altura total necessária
                tools.forEach(tool => {
                    const toolNameHeight = 6;
                    const argsText = formatToolArgs(tool.args);
                    const argsLines = doc.splitTextToSize(argsText, toolsWidth - 20);
                    toolsHeight += toolNameHeight + (argsLines.length * 4) + 4;
                });

                // Nova página se necessário
                if (y + toolsHeight > pageHeight - margin) {
                    doc.addPage();
                    y = 20;
                }

                // Container para ferramentas (fundo diferente)
                const toolsX = margin;
                const toolsY = y;

                // Fundo claro para seção de ferramentas (cinza muito claro)
                doc.setFillColor(249, 250, 251); // gray-50
                doc.setDrawColor(251, 191, 36); // amber-400 para borda
                doc.setLineWidth(1);
                doc.roundedRect(toolsX, toolsY, toolsWidth, toolsHeight, 3, 3, 'FD');

                // Título da seção (sem emoji para evitar problemas de encoding)
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(245, 158, 11); // amber-600 para título
                doc.text('Ferramentas Utilizadas:', toolsX + 8, toolsY + 8);

                let toolY = toolsY + 15;

                // Listar cada ferramenta
                tools.forEach(tool => {
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0); // Preto para nome da ferramenta
                    doc.text(`• ${tool.name}`, toolsX + 12, toolY);
                    toolY += 6;

                    // Argumentos da ferramenta
                    const argsText = formatToolArgs(tool.args);
                    if (argsText !== '(sem argumentos)') {
                        const argsLines = doc.splitTextToSize(argsText, toolsWidth - 24);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(40, 40, 40); // Cinza escuro para argumentos
                        doc.text(argsLines, toolsX + 16, toolY);
                        toolY += argsLines.length * 4 + 2;
                    } else {
                        toolY += 2;
                    }
                });

                y = toolY + 8;
            }
        });

        doc.save(`historico_chat_v${activeVersion.version}.pdf`);
    }
    }, [chatMessages, activeVersion, formData]);

    const handleUpdateMessage = useCallback((messageIndex: number, update: Partial<ChatMessage>) => {
    setChatMessages(prevMessages =>
        prevMessages.map((msg, index) =>
            index === messageIndex ? { ...msg, ...update } : msg
        )
    );
    }, []);

    const handleSaveCorrection = useCallback((messageIndex: number, correctedText: string) => {
    let userQuery = '';
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (chatMessages[i].author === 'user') {
            userQuery = chatMessages[i].text;
            break;
        }
    }
    if (userQuery) {
        const originalMessage = chatMessages[messageIndex];
        setOptimizationPairs(prev => [...prev, {
            id: crypto.randomUUID(),
            userQuery,
            originalResponse: originalMessage.text,
            correctedResponse: correctedText
        }]);
    }
    handleUpdateMessage(messageIndex, { correction: correctedText, isEditing: false });
    }, [chatMessages, handleUpdateMessage]);

    const handleSelectVersion = useCallback((id: string) => {
    const version = versionHistory.find(v => v.id === id);
    if (version) setActiveVersion(version);
    }, [versionHistory]);

    const handleValidateVersion = useCallback((id: string) => setValidatedVersionId(id), []);

    const handleDeleteVersion = useCallback((id: string) => {
    const updatedHistory = versionHistory.filter(v => v.id !== id);
    setVersionHistory(updatedHistory);
    if (validatedVersionId === id) setValidatedVersionId(null);
    if (activeVersion?.id === id) setActiveVersion(updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : null);
    }, [versionHistory, validatedVersionId, activeVersion]);

    const handleExplainPrompt = useCallback(async (content: string) => {
    if (!content) return;
    setIsExplanationModalOpen(true);
    setIsExplanationLoading(true);
    setExplanationContent('');
    setExplanationError(null);
    try {
        const explanation = await explainPrompt(content);
        setExplanationContent(explanation);
    } catch (e: any) {
        setExplanationError(e.message || "Ocorreu um erro desconhecido ao gerar a explicação.");
    } finally {
        setIsExplanationLoading(false);
    }
    }, []);

    const handleDownloadExplanation = useCallback((format: 'txt' | 'pdf') => {
    if (!explanationContent) return;
    const title = 'Explicacao_do_Prompt';

    if (format === 'txt') {
        const blob = new Blob([explanationContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        const doc = new jsPDF();
        let y = 15;
        const margin = 10;
        const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

        doc.setFontSize(18);
        doc.text('Explicação do Prompt', margin, y);
        y += 10;

        const lines = explanationContent.split('\n');

        lines.forEach(line => {
            if (y > 280) { // Page break check
                doc.addPage();
                y = 15;
            }

            line = line.replace(/\*\*(.*?)\*\*/g, '$1'); // Basic bold removal for size calculation
            const isHeader1 = line.startsWith('# ');
            const isHeader2 = line.startsWith('## ');
            const isListItem = line.startsWith('- ') || /^\d+\.\s/.test(line);

            let text = line;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            if (isHeader1) {
                text = line.substring(2);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
            } else if (isHeader2) {
                text = line.substring(3);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
            } else if (isListItem) {
                text = '  • ' + line.replace(/(-|\d+\.)\s/, '');
            }

            const splitText = doc.splitTextToSize(text, maxWidth);
            doc.text(splitText, margin, y);
            y += (splitText.length * 5); // Line height approx 5

            if (isHeader1 || isHeader2) {
                y += 3; // Extra space after headers
            }
        });

        doc.save(`${title}.pdf`);
    }
    }, [explanationContent]);

    const loadExternalPrompt = useCallback(async (content: string, sourceName: string) => {
    try {
        // Tenta detectar se é JSON
        let detectedMasterFormat: 'markdown' | 'json' = 'markdown';
        try {
            JSON.parse(content);
            detectedMasterFormat = 'json';
        } catch (e) { }

        const importedSourceData: PromptData = {
            ...INITIAL_PROMPT_DATA,
            persona: sourceName,
            objetivo: 'Prompt importado externamente.',
            contexto: `Conteúdo carregado via ${sourceName}.`,
            masterPromptFormat: detectedMasterFormat
        };

        // Atualizar formData
        setFormData(importedSourceData);

        // Salvar prompt no banco se não existir
        let promptId = currentPromptId;
        if (!promptId) {
            const newPrompt = await createPrompt(importedSourceData, sourceName);
            promptId = newPrompt.id;
            setCurrentPromptId(promptId);
        } else {
            // Atualizar prompt existente
            await createPrompt(importedSourceData, `Prompt Importado - ${new Date().toLocaleDateString('pt-BR')}`);
        }

        // Verificar se promptId existe (TypeScript check)
        if (!promptId) {
            setError('Erro: ID do prompt não encontrado. Tente novamente.');
            return;
        }

        // Criar versão no banco (promptId é garantidamente string aqui)
        const finalPromptId: string = promptId;
        const newVersion = await createPromptVersion(finalPromptId, {
            content: content,
            format: 'markdown',
            masterFormat: detectedMasterFormat,
            sourceData: importedSourceData,
        });

        setVersionHistory(prev => [...prev, newVersion]);
        setActiveVersion(newVersion);
        setHasUnsavedChanges(false);

        // Reiniciar chat com o novo prompt
        await startChat(content);
    } catch (err: any) {
        console.error('Erro ao carregar prompt externo:', err);
        setError(err.message || 'Erro ao importar prompt. Verifique o console para mais detalhes.');
    }
    }, [currentPromptId]);

    const handleImportClick = useCallback(() => fileInputRef.current?.click(), []);

    const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (content) await loadExternalPrompt(content, 'Arquivo Importado');
    };
    reader.onerror = (e) => setError("Falha ao ler o arquivo.");
    reader.readAsText(file);
    if (event.target) event.target.value = '';
    }, [loadExternalPrompt]);

    const handlePasteClick = useCallback(() => setIsPasteModalOpen(true), []);
    const handlePasteConfirm = useCallback(async (text: string) => {
    await loadExternalPrompt(text, 'Prompt Colado');
    }, [loadExternalPrompt]);

    // Função para salvar no repositório
    const handleSaveToRepository = useCallback(async () => {
    if (!formData.persona.trim()) {
        setError('Persona não pode estar vazia para salvar no repositório');
        return;
    }

    setIsSavingToRepository(true);
    setError(null);

    try {
        // Obter workspace atual
        const workspaceIdToUse = currentWorkspaceId || (await getDefaultWorkspace())?.id || undefined;

        // Criar ou atualizar prompt no banco
        let promptId = currentPromptId;
        if (!promptId) {
            const newPrompt = await createPrompt(formData, undefined, workspaceIdToUse);
            promptId = newPrompt.id;
            setCurrentPromptId(promptId);
            console.log('✅ Prompt salvo no repositório:', promptId);
        } else {
            // Atualizar prompt existente
            await createPrompt(formData, `Prompt ${new Date().toLocaleDateString('pt-BR')}`, workspaceIdToUse);
            console.log('✅ Prompt atualizado no repositório:', promptId);
        }

        setHasUnsavedChanges(false);
        alert('Prompt salvo no repositório com sucesso!');
    } catch (err: any) {
        console.error('❌ Erro ao salvar no repositório:', err);
        setError(err.message || 'Erro ao salvar no repositório');
        alert('Erro ao salvar no repositório: ' + (err.message || 'Erro desconhecido'));
    } finally {
        setIsSavingToRepository(false);
    }
    }, [formData, currentWorkspaceId, currentPromptId]);

    // Função para mudar de workspace
    const handleWorkspaceChange = useCallback(async (workspaceId: string) => {
    console.log('📁 Mudando para workspace:', workspaceId);
    setCurrentWorkspaceId(workspaceId);

    // Limpar área atual
    setVersionHistory([]);
    setActiveVersion(null);
    setChatMessages([]);
    setFormData(INITIAL_PROMPT_DATA);
    setCurrentPromptId(null);
    setHasUnsavedChanges(false);

    // Carregar prompts do novo workspace
    try {
        const prompts = await getUserPrompts(workspaceId);
        console.log('✅ Prompts carregados do workspace:', prompts?.length || 0);

        if (prompts && prompts.length > 0) {
            const latestPrompt = prompts[0];
            setCurrentPromptId(latestPrompt.id);
            const { promptData } = await getPrompt(latestPrompt.id);
            setFormData(promptData);

            const versions = await getPromptVersions(latestPrompt.id);
            if (versions && versions.length > 0) {
                setVersionHistory(versions);
                const latestVersion = versions[0];
                setActiveVersion(latestVersion);

                const messages = await getChatMessages(latestVersion.id);
                if (messages && messages.length > 0) {
                    setChatMessages(messages);
                }

                if (latestVersion.content) {
                    await startChat(latestVersion.content);
                }
            }
        }
    } catch (err: any) {
        console.error('❌ Erro ao carregar prompts do workspace:', err);
        setError(err.message || 'Erro ao carregar prompts do workspace');
    }
    }, []);

    // Função para quando criar novo workspace
    const handleWorkspaceCreated = useCallback(() => {
    // Limpar área (já feito no handleWorkspaceChange, mas garantir)
    setVersionHistory([]);
    setActiveVersion(null);
    setChatMessages([]);
    setFormData(INITIAL_PROMPT_DATA);
    setCurrentPromptId(null);
    setHasUnsavedChanges(false);
    }, []);

    const handleShareVersion = useCallback(async (versionId: string) => {
    // Verificar se pode compartilhar chat
    const shareCheck = await canShareChat();
    if (!shareCheck.allowed) {
        setError(shareCheck.reason || 'Compartilhamento não disponível no seu plano');
        return;
    }

    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/chat/${versionId}`;

    // Criar modal de compartilhamento
    const shareModal = document.createElement('div');
    shareModal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm';
    shareModal.innerHTML = `
            <div class="bg-black/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl w-full max-w-md border border-white/10 animate-in fade-in zoom-in duration-200" style="animation: fadeIn 0.2s ease-out">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">Compartilhar Chat</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p class="text-white/60 text-sm mb-4">
                    Compartilhe este link para que clientes testem o chat com esta versão do prompt:
                </p>
                <div class="flex space-x-2 mb-4">
                    <input
                        type="text"
                        value="${shareUrl}"
                        readonly
                        id="shareLinkInput"
                        class="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm"
                    />
                    <button
                        onclick="navigator.clipboard.writeText('${shareUrl}').then(() => { this.textContent = 'Copiado!'; setTimeout(() => this.closest('.fixed').remove(), 2000); })"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition text-sm"
                    >
                        Copiar
                    </button>
                </div>
                <div class="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3">
                    <p class="text-emerald-300 text-xs">
                        💡 <strong>Dica:</strong> O link abrirá uma nova aba com o chat conversacional. O cliente poderá interagir com o agente usando esta versão do prompt.
                    </p>
                </div>
            </div>
        `;
    shareModal.onclick = (e) => {
        if (e.target === shareModal) {
            shareModal.remove();
        }
    };
    document.body.appendChild(shareModal);

    // Auto-selecionar e copiar
    const input = shareModal.querySelector('#shareLinkInput') as HTMLInputElement;
    if (input) {
        input.select();
    }
    }, []);

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            console.log('🔄 [PromptManager] Iniciando carregamento de dados...');
            setIsLoadingData(true);
            try {
                // Primeiro verificar se há sessão
                console.log('🔍 [PromptManager] Verificando sessão...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('❌ [PromptManager] Erro ao verificar sessão:', sessionError);
                    setError('Erro de autenticação. Por favor, faça login novamente.');
                    setIsLoadingData(false);
                    return;
                }
                
                if (!session) {
                    console.warn('⚠️ [PromptManager] Nenhuma sessão encontrada. Redirecionando para login...');
                    setError('Sessão não encontrada. Por favor, faça login.');
                    setIsLoadingData(false);
                    // Redirecionar para login após um breve delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                    return;
                }
                
                console.log('✅ [PromptManager] Sessão encontrada:', session.user.email);
                
                // Verificar se o perfil existe, criar se necessário
                console.log('👤 [PromptManager] Verificando perfil do usuário...');
                try {
                    const profile = await getCurrentProfile();
                    if (profile) {
                        console.log('✅ [PromptManager] Perfil encontrado:', profile.full_name || profile.email);
                    } else {
                        console.warn('⚠️ [PromptManager] Perfil não encontrado');
                    }
                } catch (profileErr: any) {
                    console.error('❌ [PromptManager] Erro ao verificar perfil:', profileErr);
                }
                
                // Carregar workspace padrão
                console.log('📁 [PromptManager] Carregando workspace padrão...');
                let defaultWorkspace;
                try {
                    defaultWorkspace = await getDefaultWorkspace();
                    if (defaultWorkspace) {
                        console.log('✅ [PromptManager] Workspace padrão encontrado:', defaultWorkspace.id);
                        setCurrentWorkspaceId(defaultWorkspace.id);
                    } else {
                        console.warn('⚠️ [PromptManager] Nenhum workspace padrão encontrado');
                    }
                } catch (workspaceErr: any) {
                    console.error('❌ [PromptManager] Erro ao carregar workspace:', workspaceErr);
                    setError(`Erro ao carregar workspace: ${workspaceErr.message}`);
                }

                // Carregar prompts do workspace padrão
                if (defaultWorkspace) {
                    console.log('📄 [PromptManager] Carregando prompts do workspace...');
                    try {
                        const workspacePrompts = await getUserPrompts(defaultWorkspace.id);
                        console.log('✅ [PromptManager] Prompts carregados:', workspacePrompts?.length || 0);
                        
                        if (workspacePrompts && workspacePrompts.length > 0) {
                            const latestPrompt = workspacePrompts[0];
                            console.log('📄 [PromptManager] Carregando último prompt:', latestPrompt.id);
                            setCurrentPromptId(latestPrompt.id);
                            
                            // Carregar prompt completo e versões em paralelo
                            try {
                                const [promptResult, versions] = await Promise.all([
                                    getPrompt(latestPrompt.id),
                                    getPromptVersions(latestPrompt.id)
                                ]);
                                
                                console.log('✅ [PromptManager] Prompt carregado com', versions?.length || 0, 'versões');
                                setFormData(promptResult.promptData);
                                setVersionHistory(versions);
                                
                                if (versions && versions.length > 0) {
                                    const latestVersion = versions[0];
                                    setActiveVersion(latestVersion);
                                    
                                    // Carregar mensagens apenas se necessário (lazy)
                                    getChatMessages(latestVersion.id).then(messages => {
                                        if (messages && messages.length > 0) {
                                            console.log('✅ [PromptManager] Mensagens carregadas:', messages.length);
                                            setChatMessages(messages);
                                        }
                                    }).catch(err => {
                                        console.error('❌ [PromptManager] Erro ao carregar mensagens:', err);
                                    });
                                    
                                    if (latestVersion.content) {
                                        await startChat(latestVersion.content);
                                    }
                                }
                            } catch (promptErr: any) {
                                console.error('❌ [PromptManager] Erro ao carregar prompt:', promptErr);
                                setError(`Erro ao carregar prompt: ${promptErr.message}`);
                            }
                        } else {
                            console.log('ℹ️ [PromptManager] Nenhum prompt encontrado no workspace');
                        }
                    } catch (promptsErr: any) {
                        console.error('❌ [PromptManager] Erro ao carregar prompts:', promptsErr);
                        setError(`Erro ao carregar prompts: ${promptsErr.message}`);
                    }
                }
                
                console.log('✅ [PromptManager] Carregamento concluído');
            } catch (err: any) {
                console.error('❌ [PromptManager] Erro GERAL ao carregar dados iniciais:', err);
                console.error('❌ [PromptManager] Stack:', err.stack);
                setError(err.message || 'Erro ao carregar dados. Por favor, recarregue a página.');
            } finally {
                setIsLoadingData(false);
            }
        };
        
        loadInitialData();
    }, []);

    const isUIBlocked = isLoading || isOptimizing;

    // Mostrar loading enquanto carrega dados do Supabase
    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[600px] w-full bg-black">
                <div className="flex flex-col items-center space-y-4 sm:space-y-6 px-4">
                    <div className="relative">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 border-r-green-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-white/90 font-medium text-sm sm:text-base md:text-lg">Carregando seus prompts...</p>
                        <p className="text-white/50 text-xs sm:text-sm mt-1 sm:mt-2">Aguarde um momento</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
                        >
                            Se demorar muito, clique aqui para recarregar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Mostrar erro crítico se houver
    if (error && error.includes('login')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <h2 className="text-2xl font-bold mb-4 text-red-400">❌ Erro de Autenticação</h2>
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-2xl w-full">
                    <p className="text-red-300 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = '/login';
                            }}
                            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        >
                            💣 Limpar Tudo e Fazer Login Novamente
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            🔄 Recarregar Página
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="h-full w-full overflow-auto bg-black">
        <ExplanationModal
            isOpen={isExplanationModalOpen}
            onClose={() => setIsExplanationModalOpen(false)}
            content={explanationContent}
            isLoading={isExplanationLoading}
            error={explanationError}
            onDownload={handleDownloadExplanation}
        />
        <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onConfirm={handlePasteConfirm} />
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelected} 
            className="hidden" 
            accept=".txt,.md,.json"
            aria-label="Importar prompt de arquivo (TXT, MD, JSON)"
            title="Importar prompt de arquivo"
        />

        {/* Desktop Layout - Grid 3 Colunas Fixas */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 xl:gap-5 2xl:gap-6">
            {/* Coluna Esquerda - Input Form (4 colunas) */}
            <div className="col-span-12 xl:col-span-4 bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
                <PromptInputForm
                    formData={formData}
                    setFormData={(newData) => {
                        setFormData(newData);
                        setHasUnsavedChanges(true);
                    }}
                    onGenerate={handleGeneratePrompt}
                    isLoading={isLoading}
                    onGenerateExamples={handleGenerateExamples}
                    isGeneratingExamples={isGeneratingExamples}
                    activePromptContent={activeVersion?.content ?? ''}
                    onSaveToRepository={handleSaveToRepository}
                    isSavingToRepository={isSavingToRepository}
                />
            </div>

            {/* Coluna Central - Output e Chat (5 colunas) */}
            <div className="col-span-12 xl:col-span-5 space-y-4 xl:space-y-5 2xl:space-y-6">
                {/* Output Display */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-xl" style={{ height: 'calc(50vh - 100px)' }}>
                    <OutputDisplay
                        version={activeVersion}
                        isLoading={isUIBlocked}
                        error={error}
                        isValidated={!!validatedVersionId && activeVersion?.id === validatedVersionId}
                        onValidate={handleValidateVersion}
                        onExplain={handleExplainPrompt}
                    />
                </div>

                {/* Chat Interface */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ height: 'calc(50vh - 100px)' }}>
                    <ChatInterface
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        onClearChat={handleClearChat}
                        isLoading={isChatLoading}
                        disabled={!activeVersion || isUIBlocked}
                        onUpdateMessage={handleUpdateMessage}
                        onSaveCorrection={handleSaveCorrection}
                        onDownloadChat={handleDownloadChat}
                    />
                </div>
            </div>

            {/* Coluna Direita - Workspace, History, Optimizer, Assistant (3 colunas) */}
            <div className="col-span-12 xl:col-span-3 space-y-4 xl:space-y-5 2xl:space-y-6">
                {/* Workspace Manager */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ minHeight: '150px' }}>
                    <WorkspaceManager
                        currentWorkspaceId={currentWorkspaceId}
                        onWorkspaceChange={handleWorkspaceChange}
                        onWorkspaceCreated={handleWorkspaceCreated}
                    />
                </div>

                {/* History Panel */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ height: 'calc(35vh - 80px)' }}>
                    <HistoryPanel
                        history={versionHistory}
                        activeVersionId={activeVersion?.id ?? null}
                        onSelectVersion={handleSelectVersion}
                        onDeleteVersion={handleDeleteVersion}
                        validatedVersionId={validatedVersionId}
                        onImport={handleImportClick}
                        onPaste={handlePasteClick}
                        onShare={handleShareVersion}
                    />
                </div>

                {/* Optimizer */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ minHeight: '150px' }}>
                    <PromptOptimizer
                        onOptimize={handleOptimizePrompt}
                        isLoading={isOptimizing}
                        disabled={!activeVersion || isUIBlocked}
                        optimizationPairs={optimizationPairs}
                        onClearCorrections={() => setOptimizationPairs([])}
                        manualInstructions={manualOptInstructions}
                        onManualInstructionsChange={setManualOptInstructions}
                    />
                </div>

                {/* Assistant Panel */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xl:rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col" style={{ height: 'calc(35vh - 80px)' }}>
                    <AssistantPanel
                        messages={assistantMessages}
                        isRecording={isRecording}
                        onToggleRecording={handleToggleRecording}
                        isAssistantLoading={isAssistantLoading}
                        error={assistantError}
                        isApiKeySelected={isApiKeySelected}
                        onSelectKey={handleSelectApiKey}
                    />
                </div>
            </div>
        </div>

        {/* Mobile Layout - Totalmente Responsivo */}
        <div className="lg:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
            {/* Mobile - Input Form */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl w-full">
                <PromptInputForm
                    formData={formData}
                    setFormData={(newData) => {
                        setFormData(newData);
                        setHasUnsavedChanges(true);
                    }}
                    onGenerate={handleGeneratePrompt}
                    isLoading={isLoading}
                    onGenerateExamples={handleGenerateExamples}
                    isGeneratingExamples={isGeneratingExamples}
                    activePromptContent={activeVersion?.content ?? ''}
                    onSaveToRepository={handleSaveToRepository}
                    isSavingToRepository={isSavingToRepository}
                />
            </div>

            {/* Mobile - Output Display */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col border border-white/10 shadow-xl min-h-[300px] sm:min-h-[400px] w-full">
                <OutputDisplay
                    version={activeVersion}
                    isLoading={isUIBlocked}
                    error={error}
                    isValidated={!!validatedVersionId && activeVersion?.id === validatedVersionId}
                    onValidate={handleValidateVersion}
                    onExplain={handleExplainPrompt}
                />
            </div>

            {/* Mobile - History Panel */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl min-h-[250px] sm:min-h-[300px] w-full">
                <HistoryPanel
                    history={versionHistory}
                    activeVersionId={activeVersion?.id ?? null}
                    onSelectVersion={handleSelectVersion}
                    onDeleteVersion={handleDeleteVersion}
                    validatedVersionId={validatedVersionId}
                    onImport={handleImportClick}
                    onPaste={handlePasteClick}
                    onShare={handleShareVersion}
                />
            </div>

            {/* Mobile - Optimizer */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl min-h-[250px] sm:min-h-[300px] w-full">
                <PromptOptimizer
                    onOptimize={handleOptimizePrompt}
                    isLoading={isOptimizing}
                    disabled={!activeVersion || isUIBlocked}
                    optimizationPairs={optimizationPairs}
                    onClearCorrections={() => setOptimizationPairs([])}
                    manualInstructions={manualOptInstructions}
                    onManualInstructionsChange={setManualOptInstructions}
                />
            </div>

            {/* Mobile - Chat Interface */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl min-h-[300px] sm:min-h-[400px] w-full">
                <ChatInterface
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    onClearChat={handleClearChat}
                    isLoading={isChatLoading}
                    disabled={!activeVersion || isUIBlocked}
                    onUpdateMessage={handleUpdateMessage}
                    onSaveCorrection={handleSaveCorrection}
                    onDownloadChat={handleDownloadChat}
                />
            </div>

            {/* Mobile - Assistant Panel */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl min-h-[250px] sm:min-h-[300px] w-full">
                <AssistantPanel
                    messages={assistantMessages}
                    isRecording={isRecording}
                    onToggleRecording={handleToggleRecording}
                    isAssistantLoading={isAssistantLoading}
                    error={assistantError}
                    isApiKeySelected={isApiKeySelected}
                    onSelectKey={handleSelectApiKey}
                />
            </div>
        </div>
    </div>
    );
}
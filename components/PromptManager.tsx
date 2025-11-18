

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PromptInputForm } from './PromptInputForm';
import { OutputDisplay } from './OutputDisplay';
import { HistoryPanel } from './HistoryPanel';
import { ChatInterface } from './ChatInterface';
import { PromptOptimizer } from './PromptOptimizer';
import { AssistantPanel } from './AssistantPanel';
import { PasteModal } from './PasteModal';
import { ExplanationModal } from './ExplanationModal';
import type { PromptData, PromptVersion, ChatMessage, FewShotExample, OptimizationPair } from '../types';
import { INITIAL_PROMPT_DATA } from '../constants';
import { createFinalPrompt, startChat, continueChat, optimizePrompt, generateExamples, processAudioCommand, explainPrompt } from '../services/geminiService';
import type { GenerateContentResponse } from '@google/genai';
import { jsPDF } from 'jspdf';
import { 
  createPrompt, 
  getUserPrompts, 
  getPrompt, 
  createPromptVersion, 
  getPromptVersions,
  saveChatMessage,
  getChatMessages,
  supabase,
  getCurrentUser,
  getCurrentProfile
} from '../services/supabaseService';

export const PromptManager: React.FC = () => {
    const location = useLocation();
    const [versionHistory, setVersionHistory] = useState<PromptVersion[]>([]);
    const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
    const [validatedVersionId, setValidatedVersionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<PromptData>(INITIAL_PROMPT_DATA);
    const [optimizationPairs, setOptimizationPairs] = useState<OptimizationPair[]>([]);
    const [manualOptInstructions, setManualOptInstructions] = useState('');
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Estados para controle de prompt ativo no banco
    const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dataLoadedRef = useRef<boolean>(false);
    const lastLoadTimeRef = useRef<number>(0);
    const isVisibleRef = useRef<boolean>(true);

    // Proteção contra recarregamento quando a aba/janela perde/ganha foco
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;
            // Quando a aba volta ao foco, NÃO recarrega os dados automaticamente
            // Só recarrega se o usuário fizer logout/login explicitamente
            if (!document.hidden) {
                console.log('🔍 Aba voltou ao foco - mantendo dados carregados (sem recarregar)');
            } else {
                console.log('⏸️ Aba perdeu foco - pausando operações');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Explanation State
    const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
    const [explanationContent, setExplanationContent] = useState('');
    const [isExplanationLoading, setIsExplanationLoading] = useState(false);
    const [explanationError, setExplanationError] = useState<string | null>(null);

    // Assistant State
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [assistantError, setAssistantError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Carregar dados do Supabase ao montar o componente E quando a sessão mudar
    useEffect(() => {
        const loadUserData = async (forceReload = false) => {
            // Proteção: evitar recarregamento se já foi carregado recentemente (menos de 5 segundos)
            const now = Date.now();
            const timeSinceLastLoad = now - lastLoadTimeRef.current;
            if (!forceReload && dataLoadedRef.current && timeSinceLastLoad < 5000) {
                console.log('⏭️ Dados já foram carregados recentemente, pulando recarregamento desnecessário');
                return;
            }

            try {
                console.log('🔄 Iniciando carregamento de dados do usuário...');
                setIsLoadingData(true);
                lastLoadTimeRef.current = now;
                
                // Verificar se usuário está autenticado
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log('⚠️ Usuário não autenticado, pulando carregamento');
                    setIsLoadingData(false);
                    // Limpar estados se não há sessão
                    setCurrentPromptId(null);
                    setVersionHistory([]);
                    setActiveVersion(null);
                    setChatMessages([]);
                    return;
                }

                console.log('✅ Usuário autenticado:', session.user.email);

                // Verificar se há um promptId no state (vindo do repositório)
                const promptIdFromState = (location.state as any)?.promptId;
                
                if (promptIdFromState) {
                    console.log('📋 Carregando prompt específico do repositório:', promptIdFromState);
                    try {
                        const { promptData } = await getPrompt(promptIdFromState);
                        setCurrentPromptId(promptIdFromState);
                        setFormData(promptData);
                        
                        const versions = await getPromptVersions(promptIdFromState);
                        if (versions && versions.length > 0) {
                            setVersionHistory(versions);
                            const latestVersion = versions[0];
                            setActiveVersion(latestVersion);
                            
                            const messages = await getChatMessages(latestVersion.id);
                            if (messages && messages.length > 0) {
                                setChatMessages(messages);
                            }
                            
                            if (latestVersion.content) {
                                startChat(latestVersion.content);
                            }
                        }
                        setIsLoadingData(false);
                        return;
                    } catch (err) {
                        console.error('❌ Erro ao carregar prompt do repositório:', err);
                        // Continuar com o fluxo normal se houver erro
                    }
                }

                // Carregar prompts do usuário
                console.log('📥 Carregando prompts do usuário...');
                // Dar tempo ao React para atualizar a UI
                await new Promise(resolve => setTimeout(resolve, 10));
                const prompts = await getUserPrompts();
                console.log('✅ Prompts carregados:', prompts?.length || 0);
                
                if (prompts && prompts.length > 0) {
                    // Carregar o prompt mais recente
                    const latestPrompt = prompts[0];
                    console.log('📋 Carregando prompt mais recente:', latestPrompt.id, latestPrompt.title);
                    setCurrentPromptId(latestPrompt.id);
                    
                    // Carregar dados completos do prompt (incluindo relacionamentos)
                    console.log('📝 Carregando dados completos do prompt...');
                    const { promptData } = await getPrompt(latestPrompt.id);
                    console.log('✅ Dados do prompt carregados:', {
                        hasPersona: !!promptData.persona,
                        persona: promptData.persona?.substring(0, 50) + '...',
                        hasObjetivo: !!promptData.objetivo,
                        objetivo: promptData.objetivo?.substring(0, 50) + '...',
                        exemplos: promptData.exemplos.length,
                        variaveis: promptData.variaveisDinamicas.length,
                        ferramentas: promptData.ferramentas.length,
                        fluxos: promptData.fluxos.length,
                    });
                    console.log('💾 Definindo formData completo no estado...');
                    setFormData(promptData);
                    console.log('✅ FormData definido no estado com sucesso');
                    
                    // Carregar TODAS as versões do prompt - CRÍTICO: SEMPRE tentar carregar
                    console.log('📜 Carregando TODAS as versões do prompt do ID:', latestPrompt.id);
                    // Dar tempo ao React para atualizar a UI
                    await new Promise(resolve => setTimeout(resolve, 10));
                    let versions: PromptVersion[] = [];
                    try {
                        versions = await getPromptVersions(latestPrompt.id);
                        console.log('✅ Versões carregadas do banco:', versions?.length || 0);
                        
                        if (!versions) {
                            console.warn('⚠️ getPromptVersions retornou null/undefined');
                            versions = [];
                        }
                        
                        if (versions.length > 0) {
                            console.log('📋 Detalhes completos das versões:');
                            versions.forEach((v, idx) => {
                                console.log(`  [${idx}] v${v.version} - ${v.timestamp} - ID: ${v.id}`);
                                console.log(`      Conteúdo: ${v.content?.substring(0, 100) || 'VAZIO'}...`);
                                console.log(`      Has sourceData: ${!!v.sourceData}`);
                            });
                            
                            // Definir histórico completo ANTES de qualquer outra coisa
                            // CRÍTICO: Usar callback para garantir atualização
                            console.log('💾 DEFININDO histórico completo no estado:', versions.length, 'versões');
                            setVersionHistory(prev => {
                                // Verificar se já tem o mesmo número de versões
                                if (prev.length === versions.length && prev.length > 0) {
                                    // Verificar se os IDs são os mesmos
                                    const prevIds = prev.map(v => v.id).sort().join(',');
                                    const newIds = versions.map(v => v.id).sort().join(',');
                                    if (prevIds === newIds) {
                                        console.log('⏭️ Histórico já está atualizado, pulando');
                                        return prev;
                                    }
                                }
                                console.log('✅ Atualizando histórico com', versions.length, 'versões');
                                return versions;
                            });
                            console.log('✅ Histórico definido no estado. Total de versões:', versions.length);
                            
                            // Carregar versão ativa (mais recente = primeira do array)
                            const latestVersion = versions[0];
                            console.log('🎯 SELECIONANDO VERSÃO ATIVA:', {
                                id: latestVersion.id,
                                version: latestVersion.version,
                                timestamp: latestVersion.timestamp,
                                hasContent: !!latestVersion.content,
                                contentLength: latestVersion.content?.length || 0,
                                hasSourceData: !!latestVersion.sourceData,
                            });
                            
                            if (!latestVersion.id) {
                                console.error('❌ ERRO CRÍTICO: Versão não tem ID! Versão:', latestVersion);
                            }
                            if (!latestVersion.content) {
                                console.warn('⚠️ AVISO: Versão não tem conteúdo! ID:', latestVersion.id);
                            }
                            
                            // DEFINIR versão ativa ANTES de carregar mensagens
                            console.log('💾 DEFININDO versão ativa no estado...');
                            console.log('💾 Versão a ser definida:', JSON.stringify({ 
                                id: latestVersion.id, 
                                version: latestVersion.version,
                                hasContent: !!latestVersion.content,
                                contentLength: latestVersion.content?.length || 0,
                            }, null, 2));
                            setActiveVersion({ ...latestVersion }); // Usar spread para garantir nova referência
                            console.log('✅ Versão ativa definida no estado com sucesso');
                            
                            // CRÍTICO: Aguardar um pouco para garantir que o estado foi atualizado
                            // E forçar re-renderização dos componentes
                            await new Promise(resolve => setTimeout(resolve, 200));
                            
                            // Verificar se o estado foi atualizado (será verificado no próximo render)
                            console.log('🔍 Aguardando atualização do estado...');
                            
                            // Carregar mensagens de chat da versão ativa ANTES de inicializar o chat
                            try {
                                console.log('💬 Carregando mensagens de chat da versão:', latestVersion.id);
                                const messages = await getChatMessages(latestVersion.id);
                                console.log('✅ Mensagens de chat carregadas do banco:', messages?.length || 0);
                                
                                if (!messages) {
                                    console.warn('⚠️ getChatMessages retornou null/undefined');
                                }
                                
                                // Definir mensagens ANTES de inicializar o chat
                                if (messages && messages.length > 0) {
                                    console.log('💬 Restaurando histórico completo de chat:', messages.length, 'mensagens');
                                    messages.forEach((msg, idx) => {
                                        console.log(`  [${idx}] ${msg.author}: ${msg.text?.substring(0, 50) || 'VAZIO'}...`);
                                    });
                                    console.log('💬 Definindo mensagens no estado...');
                                    setChatMessages([...messages]); // Usar spread para garantir nova referência
                                    console.log('💬 Histórico de chat restaurado com sucesso no estado');
                                } else {
                                    console.log('ℹ️ Nenhuma mensagem de chat encontrada para esta versão');
                                    setChatMessages([]);
                                }
                                
                                // Reiniciar chat com o prompt da versão ativa DEPOIS de carregar as mensagens
                                if (latestVersion.content && latestVersion.content.trim().length > 0) {
                                    console.log('🔄 Inicializando chat com conteúdo da versão...');
                                    startChat(latestVersion.content);
                                    console.log('✅ Chat inicializado com prompt da versão ativa');
                                    console.log('📋 Conteúdo do prompt carregado:', latestVersion.content.substring(0, 100) + '...');
                                } else {
                                    console.warn('⚠️ Versão não tem conteúdo válido para inicializar o chat. ID:', latestVersion.id);
                                }
                            } catch (err: any) {
                                console.error('❌ ERRO ao carregar mensagens de chat:', err);
                                console.error('❌ Detalhes do erro:', {
                                    message: err.message,
                                    stack: err.stack,
                                    details: err.details,
                                    hint: err.hint,
                                    code: err.code,
                                });
                                setChatMessages([]);
                                // Mesmo com erro, tentar inicializar o chat se houver conteúdo
                                if (latestVersion.content && latestVersion.content.trim().length > 0) {
                                    console.log('🔄 Tentando inicializar chat mesmo com erro nas mensagens...');
                                    startChat(latestVersion.content);
                                }
                            }
                        } else {
                            console.warn('⚠️ Nenhuma versão encontrada para o prompt:', latestPrompt.id);
                            // Não limpar tudo, manter o prompt e formData carregados
                            // Mas definir arrays vazios para que os componentes saibam que não há dados
                            console.log('💾 Definindo arrays vazios no estado (sem versões)');
                            setVersionHistory([]);
                            setActiveVersion(null);
                            setChatMessages([]);
                            console.log('✅ Estados de versões limpos (sem versões)');
                        }
                    } catch (versionsError: any) {
                        console.error('❌ ERRO CRÍTICO ao carregar versões:', versionsError);
                        console.error('❌ Detalhes do erro:', {
                            message: versionsError.message,
                            stack: versionsError.stack,
                            details: versionsError.details,
                            hint: versionsError.hint,
                            code: versionsError.code,
                        });
                        // Em caso de erro, não limpar tudo - manter o que já foi carregado
                        // Mas definir arrays vazios para que os componentes saibam que não há dados
                        setVersionHistory([]);
                        setActiveVersion(null);
                        setChatMessages([]);
                    }
                    
                    // CRÍTICO: Aguardar um pouco mais para garantir que TODOS os estados foram atualizados
                    console.log('⏳ Aguardando sincronização de estados...');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    console.log('✅ Sincronização de estados concluída');
                } else {
                    console.log('ℹ️ Nenhum prompt encontrado. Usuário pode começar criando um novo.');
                    // Limpar estados se não há prompts
                    setCurrentPromptId(null);
                    setVersionHistory([]);
                    setActiveVersion(null);
                    setChatMessages([]);
                }
            } catch (err: any) {
                console.error('❌ Erro ao carregar dados do usuário:', err);
                console.error('❌ Detalhes do erro:', {
                    message: err.message,
                    stack: err.stack,
                    details: err.details,
                    hint: err.hint,
                    code: err.code,
                });
                setError(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`);
                // Continuar com dados vazios
            } finally {
                console.log('✅ Carregamento de dados finalizado. isLoadingData = false');
                setIsLoadingData(false);
                dataLoadedRef.current = true;
            }
        };

        loadUserData();

        // Listener para mudanças de autenticação (logout/login)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Mudança de autenticação:', event);
            if (event === 'SIGNED_IN') {
                if (session) {
                    console.log('✅ Usuário fez login, recarregando dados...');
                    dataLoadedRef.current = false; // Forçar recarregamento em login
                    await loadUserData(true);
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token refreshed - não recarregar dados, apenas logar
                // Verifica se a aba está visível antes de fazer qualquer operação
                if (!isVisibleRef.current) {
                    console.log('⏸️ TOKEN_REFRESHED ignorado - aba não está visível');
                    return;
                }
                console.log('🔄 Token atualizado (refresh automático), mantendo dados carregados');
                // NÃO recarregar dados para evitar spinner desnecessário
            } else if (event === 'SIGNED_OUT') {
                console.log('🚪 Usuário fez logout, limpando dados...');
                dataLoadedRef.current = false;
                lastLoadTimeRef.current = 0;
                setCurrentPromptId(null);
                setVersionHistory([]);
                setActiveVersion(null);
                setChatMessages([]);
                setFormData(INITIAL_PROMPT_DATA);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Debug: Log quando versionHistory muda
    useEffect(() => {
        if (versionHistory.length > 0) {
            console.log('📊 Histórico de versões atualizado no React:', {
                total: versionHistory.length,
                versoes: versionHistory.map(v => `v${v.version} (${v.id})`).join(', '),
            });
        } else {
            console.log('📊 Histórico de versões está vazio no React');
        }
    }, [versionHistory]);

    // Debug: Log quando activeVersion muda
    useEffect(() => {
        if (activeVersion) {
            console.log('🎯 Versão ativa atualizada no React:', {
                id: activeVersion.id,
                version: activeVersion.version,
                hasContent: !!activeVersion.content,
                contentLength: activeVersion.content?.length || 0,
            });
        } else {
            console.log('🎯 Versão ativa está null no React');
        }
    }, [activeVersion]);

    // Debug: Log quando chatMessages muda
    useEffect(() => {
        if (chatMessages.length > 0) {
            console.log('💬 Mensagens de chat atualizadas no React:', {
                total: chatMessages.length,
                mensagens: chatMessages.map(m => `${m.author}: ${m.text.substring(0, 30)}...`).join(', '),
            });
        } else {
            console.log('💬 Mensagens de chat estão vazias no React');
        }
    }, [chatMessages]);

    // Auto-save do formData quando muda (debounced)
    useEffect(() => {
        if (hasUnsavedChanges && !isLoadingData) {
            // Limpar timeout anterior
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Aguardar 3 segundos após a última mudança antes de salvar
            autoSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    let promptId = currentPromptId;
                    
                    if (!promptId) {
                        // Criar novo prompt se não existe
                        const newPrompt = await createPrompt(formData, `Prompt ${new Date().toLocaleDateString('pt-BR')}`);
                        promptId = newPrompt.id;
                        setCurrentPromptId(promptId);
                        console.log('✅ Novo prompt criado no auto-save:', promptId);
                    } else {
                        // Atualizar prompt existente (criar novo registro)
                        await createPrompt(formData, `Prompt ${new Date().toLocaleDateString('pt-BR')}`);
                        console.log('✅ Prompt atualizado no auto-save:', promptId);
                    }
                    
                    setHasUnsavedChanges(false);
                } catch (err: any) {
                    console.error('❌ Erro no auto-save:', err);
                    // Não mostrar erro para o usuário no auto-save
                }
            }, 3000);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [formData, currentPromptId, hasUnsavedChanges, isLoadingData]);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

    // Carregar dados quando a versão ativa muda (mas não durante o carregamento inicial)
    useEffect(() => {
        // CRÍTICO: Ignorar durante o carregamento inicial para evitar conflitos
        if (isLoadingData) {
            console.log('⏸️ Carregamento inicial em andamento, ignorando mudança de versão');
            return;
        }

        // Só executar quando o ID da versão muda, não quando o objeto inteiro muda
        if (activeVersion?.id) {
            console.log('🔄 [USE_EFFECT] Versão ativa mudou (não é carregamento inicial):', activeVersion.id);
            
            // Só carregar mensagens se ainda não foram carregadas OU se mudou para uma versão diferente
            // Isso evita recarregar mensagens que já foram carregadas durante o carregamento inicial
            const currentVersionId = activeVersion.id;
            const shouldReloadMessages = !chatMessages.length || 
                (chatMessages.length > 0 && !chatMessages.some(() => true)); // Simplificado
            
            if (shouldReloadMessages) {
                // Carregar mensagens de chat do banco ANTES de inicializar o chat
                const loadChatMessages = async () => {
                    try {
                        console.log('💬 [USE_EFFECT] Carregando mensagens para versão:', currentVersionId);
                        const messages = await getChatMessages(currentVersionId);
                        console.log('✅ [USE_EFFECT] Mensagens carregadas:', messages?.length || 0);
                        
                        // Definir mensagens ANTES de inicializar o chat
                        if (messages && messages.length > 0) {
                            console.log('💬 [USE_EFFECT] Restaurando histórico de chat:', messages.length, 'mensagens');
                            setChatMessages(messages);
                        } else {
                            // Limpar se realmente não há mensagens
                            setChatMessages([]);
                            console.log('ℹ️ [USE_EFFECT] Nenhuma mensagem encontrada para esta versão');
                        }
                        
                        // Inicializar chat DEPOIS de carregar as mensagens
                        if (activeVersion.content && activeVersion.content.trim().length > 0) {
                            console.log('🔄 [USE_EFFECT] Inicializando chat com nova versão...');
                            startChat(activeVersion.content);
                            console.log('✅ [USE_EFFECT] Chat inicializado com nova versão');
                        }
                    } catch (err: any) {
                        console.warn('⚠️ [USE_EFFECT] Erro ao carregar mensagens de chat:', err);
                        // Mesmo com erro, tentar inicializar o chat se houver conteúdo
                        if (activeVersion.content && activeVersion.content.trim().length > 0) {
                            startChat(activeVersion.content);
                        }
                    }
                };
                
                loadChatMessages();
            } else {
                console.log('⏭️ [USE_EFFECT] Pulando recarregamento de mensagens (já carregadas)');
                // Apenas inicializar chat se houver conteúdo e ainda não foi inicializado
                if (activeVersion.content && activeVersion.content.trim().length > 0) {
                    console.log('🔄 [USE_EFFECT] Apenas reinicializando chat com conteúdo da versão');
                    startChat(activeVersion.content);
                }
            }
            
            // NÃO atualizar formData aqui durante mudança de versão manual
            // O formData já está correto do carregamento inicial
        } else if (!isLoadingData && !currentPromptId && !isLoadingData) {
            // Só resetar se realmente não há dados (e já terminou de carregar)
            console.log('🔄 [USE_EFFECT] Sem versão ativa e sem prompt, resetando formData');
            setFormData(INITIAL_PROMPT_DATA);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeVersion?.id, isLoadingData]); // Dependência do ID e do estado de carregamento
    
    const handleAssistantToolCall = (toolCall: any) => {
        const { name, args } = toolCall;
        
        switch (name) {
            case 'updatePersona':
                setFormData(prev => ({ ...prev, persona: args.text }));
                setHasUnsavedChanges(true);
                break;
            case 'updateObjetivo':
                setFormData(prev => ({ ...prev, objetivo: args.text }));
                setHasUnsavedChanges(true);
                break;
            case 'updateContextoNegocio':
                setFormData(prev => ({ ...prev, contextoNegocio: args.text }));
                setHasUnsavedChanges(true);
                break;
            case 'updateContextoInteracao':
                setFormData(prev => ({ ...prev, contexto: args.text }));
                setHasUnsavedChanges(true);
                break;
            case 'addRegra':
                setFormData(prev => ({ ...prev, regras: [...prev.regras, args.text] }));
                setHasUnsavedChanges(true);
                break;
            case 'addExemplo':
                 setFormData(prev => ({ ...prev, exemplos: [...prev.exemplos, { ...args, id: crypto.randomUUID() }] }));
                 setHasUnsavedChanges(true);
                 break;
            default:
                console.warn(`Função ${name} não reconhecida.`);
        }
    };
    
    const processAssistantResponse = (response: GenerateContentResponse) => {
        if (response.functionCalls && response.functionCalls.length > 0) {
            response.functionCalls.forEach(handleAssistantToolCall);
        }
        const responseText = response.text.trim();
        if (responseText) {
            const transcriptionMatch = responseText.match(/\[TRANSCRIÇÃO:\s*(.*?)\]/i);
            const userTranscription = transcriptionMatch ? transcriptionMatch[1] : "Comando de áudio não transcrito.";
            setAssistantMessages(prev => [
                ...prev, 
                { author: 'user', text: userTranscription },
                { author: 'agent', text: responseText.replace(/\[TRANSCRIÇÃO:.*?\]\s*/i, '') }
            ]);
        }
    }

    const startRecording = async () => {
        if (isRecording) return;
        setAssistantError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
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
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSelectApiKey = async () => {
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
    };

    const handleGeneratePrompt = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Salvar ou criar prompt no banco
            let promptId = currentPromptId;
            if (!promptId) {
                // Criar novo prompt
                console.log('📝 Criando novo prompt no banco...');
                try {
                    const newPrompt = await createPrompt(formData);
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
                    await createPrompt(formData, `Prompt ${new Date().toLocaleDateString('pt-BR')}`);
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
            
            // Criar versão no banco
            console.log('💾 Salvando versão no banco...');
            let newVersion: PromptVersion;
            try {
                newVersion = await createPromptVersion(promptId, {
                    content: promptContent,
                    format: formData.formatoSaida,
                    masterFormat: formData.masterPromptFormat,
                    sourceData: formData,
                });
                console.log('✅ Versão salva:', newVersion.id);
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
            startChat(promptContent);
        } catch (e: any) {
            console.error('❌ Erro ao gerar prompt:', e);
            setError(e.message || "Ocorreu um erro desconhecido. Verifique o console para mais detalhes.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOptimizePrompt = async () => {
        if (!activeVersion || !currentPromptId) return;
        if (optimizationPairs.length === 0 && !manualOptInstructions.trim()) return;

        setIsOptimizing(true);
        setError(null);
        try {
            const optimizedContent = await optimizePrompt(activeVersion.content, optimizationPairs, manualOptInstructions);
            
            // Criar nova versão no banco
            const newVersion = await createPromptVersion(currentPromptId, {
                content: optimizedContent,
                format: activeVersion.sourceData.formatoSaida,
                masterFormat: activeVersion.sourceData.masterPromptFormat,
                sourceData: activeVersion.sourceData,
            });

            setVersionHistory(prev => [...prev, newVersion]);
            setActiveVersion(newVersion);
            setOptimizationPairs([]);
            setManualOptInstructions('');
        } catch (e: any) {
            setError(e.message || "Ocorreu um erro desconhecido ao otimizar.");
        } finally {
            setIsOptimizing(false);
        }
    };
    
    const handleGenerateExamples = async () => {
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
    };

    const handleSendMessage = async (message: string) => {
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
    };

    const handleClearChat = () => {
        if (activeVersion) {
            startChat(activeVersion.content);
            setChatMessages([]);
        }
    };
    
    // Função para limpar e normalizar texto
    const cleanTextForPDF = (text: string): string => {
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
    };

    const handleDownloadChat = async (format: 'txt' | 'pdf') => {
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
            const chatContent = chatMessages.map(msg => {
                const author = msg.author === 'user' ? 'Usuário' : agentName;
                const cleanedText = cleanTextForPDF(msg.text);
                return `${author}: ${cleanedText}`;
            }).join('\n\n');

            const fullContent = `${toolName}\n${header}\n\nEspecialista: ${specialistName}\nAgente: ${agentName}\n\n${timestamp}\n\n${chatContent}`;

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
                let text = cleanTextForPDF(msg.text);
                
                // Se o texto estiver vazio após limpeza, pular
                if (!text || text.trim().length === 0) {
                    return;
                }

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
            });

            doc.save(`historico_chat_v${activeVersion.version}.pdf`);
        }
    };

    const handleUpdateMessage = (messageIndex: number, update: Partial<ChatMessage>) => {
        setChatMessages(prevMessages =>
            prevMessages.map((msg, index) =>
                index === messageIndex ? { ...msg, ...update } : msg
            )
        );
    };

    const handleSaveCorrection = (messageIndex: number, correctedText: string) => {
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
    };

    const handleSelectVersion = (id: string) => {
        const version = versionHistory.find(v => v.id === id);
        if (version) setActiveVersion(version);
    };

    const handleValidateVersion = (id: string) => setValidatedVersionId(id);

    const handleDeleteVersion = (id: string) => {
        const updatedHistory = versionHistory.filter(v => v.id !== id);
        setVersionHistory(updatedHistory);
        if (validatedVersionId === id) setValidatedVersionId(null);
        if (activeVersion?.id === id) setActiveVersion(updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : null);
    };
    
    const handleExplainPrompt = async (content: string) => {
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
    };

    const handleDownloadExplanation = (format: 'txt' | 'pdf') => {
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
    };


    const loadExternalPrompt = async (content: string, sourceName: string) => {
        try {
            // Tenta detectar se é JSON
            let detectedMasterFormat: 'markdown' | 'json' = 'markdown';
            try {
                JSON.parse(content);
                detectedMasterFormat = 'json';
            } catch (e) {}

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

            // Criar versão no banco
            const newVersion = await createPromptVersion(promptId, {
                content: content,
                format: 'markdown',
                masterFormat: detectedMasterFormat,
                sourceData: importedSourceData,
            });

            setVersionHistory(prev => [...prev, newVersion]);
            setActiveVersion(newVersion);
            setHasUnsavedChanges(false);
            
            // Reiniciar chat com o novo prompt
            startChat(content);
        } catch (err: any) {
            console.error('Erro ao carregar prompt externo:', err);
            setError(err.message || 'Erro ao importar prompt. Verifique o console para mais detalhes.');
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const handlePasteClick = () => setIsPasteModalOpen(true);
    const handlePasteConfirm = async (text: string) => {
        await loadExternalPrompt(text, 'Prompt Colado');
    };

    const handleShareVersion = (versionId: string) => {
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
    };

    const isUIBlocked = isLoading || isOptimizing;

    // Mostrar loading enquanto carrega dados do Supabase
    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-black">
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 border-r-green-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium text-lg">Carregando seus dados...</p>
                        <p className="text-white/40 text-sm mt-2">Aguarde um momento</p>
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
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept=".txt,.md,.json" />
            
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-6 gap-6 p-6 h-full">
                {/* Left Panel - Input Form */}
                <div className="col-span-12 xl:col-span-4 lg:row-span-6 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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
                    />
                </div>

                {/* Middle Panel - Output Display */}
                <div className="col-span-12 xl:col-span-5 lg:row-span-4 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-xl">
                <OutputDisplay 
                    version={activeVersion} 
                    isLoading={isUIBlocked} 
                    error={error} 
                    isValidated={!!validatedVersionId && activeVersion?.id === validatedVersionId}
                    onValidate={handleValidateVersion}
                    onExplain={handleExplainPrompt}
                    />
                </div>

                {/* Top Right - History Panel */}
                <div className="col-span-12 xl:col-span-3 lg:row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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

                {/* Top Right Bottom - Optimizer */}
                <div className="col-span-12 xl:col-span-3 lg:row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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

                {/* Bottom - Chat Interface */}
                <div className="col-span-12 xl:col-span-5 lg:row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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

                {/* Bottom Right - Assistant Panel */}
                <div className="col-span-12 xl:col-span-3 lg:row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-4 p-4">
                {/* Mobile - Input Form */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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
                    />
                </div>

                {/* Mobile - Output Display */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-xl min-h-[400px]">
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
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[300px]">
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
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[300px]">
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
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[400px]">
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
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[300px]">
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
};
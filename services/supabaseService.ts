// Serviço para integração com Supabase
// Instale o cliente: npm install @supabase/supabase-js

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PromptData, PromptVersion, ChatMessage, FewShotExample, VariavelDinamica, Ferramenta, Fluxo, OptimizationPair } from '../types';
import { 
  sanitizeText, 
  validatePromptText, 
  isValidUUID, 
  sanitizeObject,
  validateFileSize,
  validateFileType,
} from '../utils/security';

// Configuração do Supabase
// No Vite, use VITE_ prefixo para variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validação mais rigorosa das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ ERRO: Variáveis de ambiente do Supabase não configuradas!\n' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou nas variáveis de ambiente da Vercel.\n' +
    `URL atual: ${supabaseUrl || 'VAZIO'}\n` +
    `Key atual: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'VAZIO'}`;
  
  console.error(errorMsg);
  
  // Em produção, não queremos quebrar a aplicação completamente
  // Mas vamos criar um cliente com valores vazios para que os erros apareçam claramente
  if (import.meta.env.PROD) {
    console.error('⚠️ Aplicação em produção sem configuração do Supabase!');
  }
}

// Criar cliente Supabase
// Mesmo sem variáveis válidas, criamos o cliente para que os erros sejam claros nas chamadas
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Verificar se as credenciais são válidas ao inicializar
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
} else {
  console.warn('⚠️ Supabase não configurado corretamente. A autenticação pode falhar.');
}

// =====================================================
// AUTENTICAÇÃO
// =====================================================

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registra um novo usuário
 */
export async function signUp(data: SignUpData) {
  // SEMPRE usar a URL de produção para o email de confirmação
  // Isso garante que o link do email sempre funcione, mesmo se o usuário
  // estiver testando em localhost ou em preview da Vercel
  const productionUrl = 'https://labprompt.com.br';
  const redirectTo = `${productionUrl}/auth/callback`;
  
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
      // SEMPRE usar produção para email de confirmação
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  return authData;
}

/**
 * Faz login de um usuário existente
 */
export async function signIn(data: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw error;
  return authData;
}

/**
 * Faz logout do usuário atual
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// PROMPTS
// =====================================================

/**
 * Cria um novo prompt
 */
export async function createPrompt(promptData: PromptData, title?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO DE DADOS
  const maxTitleLength = 200;
  const sanitizedTitle = title 
    ? sanitizeText(title.trim(), maxTitleLength) 
    : sanitizeText(promptData.persona.substring(0, 50), maxTitleLength);

  // Validar e sanitizar campos de texto
  const personaValidation = validatePromptText(promptData.persona, 10000);
  if (!personaValidation.valid) {
    throw new Error(personaValidation.error || 'Persona inválida');
  }

  const objetivoValidation = validatePromptText(promptData.objetivo, 5000);
  if (!objetivoValidation.valid) {
    throw new Error(objetivoValidation.error || 'Objetivo inválido');
  }

  const contextoNegocioValidation = validatePromptText(promptData.contextoNegocio || '', 10000);
  const contextoValidation = validatePromptText(promptData.contexto || '', 10000);

  // Sanitizar regras
  const sanitizedRegras = promptData.regras
    .map(regra => sanitizeText(regra.trim(), 1000))
    .filter(regra => regra.length > 0);

  // Validar formato de saída
  const validOutputFormats = ['text', 'markdown', 'json', 'xml', 'yaml'];
  const validMasterFormats = ['markdown', 'json'];
  
  if (!validOutputFormats.includes(promptData.formatoSaida)) {
    throw new Error('Formato de saída inválido');
  }

  if (!validMasterFormats.includes(promptData.masterPromptFormat)) {
    throw new Error('Formato do prompt mestre inválido');
  }

  // Validar tamanho do prompt
  if (promptData.promptSize < 500 || promptData.promptSize > 100000) {
    throw new Error('Tamanho do prompt deve estar entre 500 e 100000 caracteres');
  }

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: user.id,
      title: sanitizedTitle,
      persona: personaValidation.sanitized || '',
      objetivo: objetivoValidation.sanitized || '',
      contexto_negocio: contextoNegocioValidation.sanitized || '',
      contexto: contextoValidation.sanitized || '',
      regras: sanitizedRegras,
      formato_saida: promptData.formatoSaida,
      master_prompt_format: promptData.masterPromptFormat,
      estrutura_saida: sanitizeText(promptData.estruturaSaida || '', 5000),
      prompt_size: promptData.promptSize,
    })
    .select()
    .single();

  if (error) throw error;

  // Criar relacionamentos (exemplos, variáveis, ferramentas, fluxos)
  const promptId = data.id;

  // Few-shot examples
  if (promptData.exemplos.length > 0) {
    await supabase.from('few_shot_examples').insert(
      promptData.exemplos.map((ex, index) => ({
        prompt_id: promptId,
        user_text: ex.user,
        agent_text: ex.agent,
        order_index: index,
      }))
    );
  }

  // Variáveis dinâmicas
  if (promptData.variaveisDinamicas.length > 0) {
    await supabase.from('variaveis_dinamicas').insert(
      promptData.variaveisDinamicas.map((v, index) => ({
        prompt_id: promptId,
        chave: v.chave,
        valor: v.valor,
        order_index: index,
      }))
    );
  }

  // Ferramentas
  if (promptData.ferramentas.length > 0) {
    await supabase.from('ferramentas').insert(
      promptData.ferramentas.map((f, index) => ({
        prompt_id: promptId,
        nome: f.nome,
        descricao: f.descricao,
        order_index: index,
      }))
    );
  }

  // Fluxos
  if (promptData.fluxos.length > 0) {
    await supabase.from('fluxos').insert(
      promptData.fluxos.map((f, index) => ({
        prompt_id: promptId,
        nome: f.nome,
        tipo_prompt: f.tipoPrompt,
        objetivo: f.objetivo,
        base_conhecimento_rag: f.baseConhecimentoRAG,
        few_shot_examples: f.fewShotExamples,
        reforcar_cot: f.reforcarCoT,
        ativar_guardrails: f.ativarGuardrails,
        order_index: index,
      }))
    );
  }

  return data;
}

/**
 * Obtém todos os prompts do usuário atual
 */
export async function getUserPrompts() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Obtém um prompt específico com todos os relacionamentos
 */
export async function getPrompt(promptId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  // Buscar prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('user_id', user.id)
    .single();

  if (promptError) throw promptError;
  if (!prompt) throw new Error('Prompt não encontrado');

  // Buscar relacionamentos
  const [examples, variaveis, ferramentas, fluxos] = await Promise.all([
    supabase.from('few_shot_examples').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('variaveis_dinamicas').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('ferramentas').select('*').eq('prompt_id', promptId).order('order_index'),
    supabase.from('fluxos').select('*').eq('prompt_id', promptId).order('order_index'),
  ]);

  // Montar PromptData
  const promptData: PromptData = {
    persona: prompt.persona,
    objetivo: prompt.objetivo,
    contextoNegocio: prompt.contexto_negocio || '',
    contexto: prompt.contexto || '',
    regras: prompt.regras || [],
    exemplos: (examples.data || []).map(ex => ({
      id: ex.id,
      user: ex.user_text,
      agent: ex.agent_text,
    })),
    variaveisDinamicas: (variaveis.data || []).map(v => ({
      id: v.id,
      chave: v.chave,
      valor: v.valor,
    })),
    ferramentas: (ferramentas.data || []).map(f => ({
      id: f.id,
      nome: f.nome,
      descricao: f.descricao,
    })),
    formatoSaida: prompt.formato_saida as any,
    masterPromptFormat: prompt.master_prompt_format as 'markdown' | 'json',
    estruturaSaida: prompt.estrutura_saida || '',
    fluxos: (fluxos.data || []).map(f => ({
      id: f.id,
      nome: f.nome,
      tipoPrompt: f.tipo_prompt || '',
      objetivo: f.objetivo || '',
      baseConhecimentoRAG: f.base_conhecimento_rag || '',
      fewShotExamples: f.few_shot_examples || '',
      reforcarCoT: f.reforcar_cot || false,
      ativarGuardrails: f.ativar_guardrails || false,
    })),
    promptSize: prompt.prompt_size || 5000,
  };

  return { prompt, promptData };
}

// =====================================================
// VERSÕES DE PROMPTS
// =====================================================

/**
 * Cria uma nova versão de um prompt
 */
export async function createPromptVersion(
  promptId: string,
  versionData: {
    content: string;
    format: string;
    masterFormat: string;
    sourceData: PromptData;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Conteúdo da versão
  const contentValidation = validatePromptText(versionData.content, 100000);
  if (!contentValidation.valid) {
    throw new Error(contentValidation.error || 'Conteúdo da versão inválido');
  }

  // Obter o número da próxima versão
  const { data: lastVersion } = await supabase
    .from('prompt_versions')
    .select('version_number')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      version_number: nextVersionNumber,
      content: contentValidation.sanitized || '',
      format: versionData.format,
      master_format: versionData.masterFormat,
      source_data: sanitizeObject(versionData.sourceData as any) as any,
    })
    .select()
    .single();

  if (error) throw error;

  // Converter para formato PromptVersion
  const promptVersion: PromptVersion = {
    id: data.id,
    version: data.version_number,
    content: data.content,
    format: data.format as any,
    masterFormat: data.master_format as 'markdown' | 'json',
    timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
    sourceData: data.source_data as PromptData,
  };

  return promptVersion;
}

/**
 * Obtém todas as versões de um prompt
 */
export async function getPromptVersions(promptId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptId)) {
    throw new Error('ID de prompt inválido');
  }

  const { data, error } = await supabase
    .from('prompt_versions')
    .select(`
      *,
      prompts!inner(user_id)
    `)
    .eq('prompts.user_id', user.id)
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false });

  if (error) throw error;

  return (data || []).map((v: any) => ({
    id: v.id,
    version: v.version_number,
    content: v.content,
    format: v.format,
    masterFormat: v.master_format,
    timestamp: new Date(v.created_at).toLocaleString('pt-BR'),
    sourceData: v.source_data as PromptData,
  })) as PromptVersion[];
}

// =====================================================
// CHAT MESSAGES
// =====================================================

/**
 * Salva uma mensagem de chat
 */
export async function saveChatMessage(
  promptVersionId: string,
  message: Omit<ChatMessage, 'isEditing'>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Mensagem
  if (!message.author || !['user', 'agent'].includes(message.author)) {
    throw new Error('Autor da mensagem inválido');
  }

  const textValidation = validatePromptText(message.text, 50000);
  if (!textValidation.valid) {
    throw new Error(textValidation.error || 'Texto da mensagem inválido');
  }

  // Obter a próxima ordem
  const { data: lastMessage } = await supabase
    .from('chat_messages')
    .select('order_index')
    .eq('prompt_version_id', promptVersionId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = lastMessage ? lastMessage.order_index + 1 : 0;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      prompt_version_id: promptVersionId,
      author: message.author,
      text: textValidation.sanitized || '',
      feedback: message.feedback,
      correction: message.correction ? sanitizeText(message.correction, 5000) : null,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtém todas as mensagens de uma versão de prompt
 */
export async function getChatMessages(promptVersionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      prompt_versions!inner(
        prompts!inner(user_id)
      )
    `)
    .eq('prompt_versions.prompts.user_id', user.id)
    .eq('prompt_version_id', promptVersionId)
    .order('order_index', { ascending: true });

  if (error) throw error;

  return (data || []).map((m: any) => ({
    author: m.author as 'user' | 'agent',
    text: m.text,
    feedback: m.feedback as 'correct' | 'incorrect' | undefined,
    isEditing: false,
    correction: m.correction,
  })) as ChatMessage[];
}

// =====================================================
// OPTIMIZATION PAIRS
// =====================================================

/**
 * Salva um par de otimização
 */
export async function saveOptimizationPair(
  promptVersionId: string,
  pair: Omit<OptimizationPair, 'id'>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  // 🔒 VALIDAÇÃO E SANITIZAÇÃO - Par de otimização
  const userQueryValidation = validatePromptText(pair.userQuery, 5000);
  const originalResponseValidation = validatePromptText(pair.originalResponse, 50000);
  const correctedResponseValidation = validatePromptText(pair.correctedResponse, 50000);

  if (!userQueryValidation.valid || !originalResponseValidation.valid || !correctedResponseValidation.valid) {
    throw new Error('Dados do par de otimização inválidos');
  }

  const { data, error } = await supabase
    .from('optimization_pairs')
    .insert({
      prompt_version_id: promptVersionId,
      user_query: userQueryValidation.sanitized || '',
      original_response: originalResponseValidation.sanitized || '',
      corrected_response: correctedResponseValidation.sanitized || '',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtém todos os pares de otimização de uma versão
 */
export async function getOptimizationPairs(promptVersionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 🔒 VALIDAÇÃO DE SEGURANÇA - UUID válido
  if (!isValidUUID(promptVersionId)) {
    throw new Error('ID de versão de prompt inválido');
  }

  const { data, error } = await supabase
    .from('optimization_pairs')
    .select(`
      *,
      prompt_versions!inner(
        prompts!inner(user_id)
      )
    `)
    .eq('prompt_versions.prompts.user_id', user.id)
    .eq('prompt_version_id', promptVersionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    userQuery: p.user_query,
    originalResponse: p.original_response,
    correctedResponse: p.corrected_response,
  })) as OptimizationPair[];
}

// =====================================================
// DOCUMENTS
// =====================================================

/**
 * Salva um documento
 */
export async function saveDocument(document: {
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url?: string;
  content_text?: string;
  metadata?: Record<string, any>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      ...document,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtém todos os documentos do usuário
 */
export async function getUserDocuments() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}


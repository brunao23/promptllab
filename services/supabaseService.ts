// Serviço para integração com Supabase
// Instale o cliente: npm install @supabase/supabase-js

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PromptData, PromptVersion, ChatMessage, FewShotExample, VariavelDinamica, Ferramenta, Fluxo, OptimizationPair } from '../types';

// Configuração do Supabase
// No Vite, use VITE_ prefixo para variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
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

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: user.id,
      title: title || promptData.persona.substring(0, 50),
      persona: promptData.persona,
      objetivo: promptData.objetivo,
      contexto_negocio: promptData.contextoNegocio,
      contexto: promptData.contexto,
      regras: promptData.regras,
      formato_saida: promptData.formatoSaida,
      master_prompt_format: promptData.masterPromptFormat,
      estrutura_saida: promptData.estruturaSaida,
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
      content: versionData.content,
      format: versionData.format,
      master_format: versionData.masterFormat,
      source_data: versionData.sourceData as any,
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
      text: message.text,
      feedback: message.feedback,
      correction: message.correction,
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

  const { data, error } = await supabase
    .from('optimization_pairs')
    .insert({
      prompt_version_id: promptVersionId,
      user_query: pair.userQuery,
      original_response: pair.originalResponse,
      corrected_response: pair.correctedResponse,
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


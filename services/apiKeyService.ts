// Serviço para gerenciar API Keys dos usuários
import { supabase } from './supabaseService';

export type ApiProvider = 'gemini' | 'openai';

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: ApiProvider;
  api_key: string;
  is_active: boolean;
  is_global: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  usage_count: number;
  total_tokens_used: number;
}

/**
 * Busca a API Key ativa do usuário para um provider específico
 */
export async function getUserApiKey(provider: ApiProvider): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Silenciosamente retorna null se não houver usuário autenticado
      return null;
    }

    // Usar select('*') para evitar problemas com RLS e headers Accept
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle(); // Usar maybeSingle ao invés de single para não dar erro se não encontrar

    if (error) {
      // Log apenas se não for erro de "não encontrado"
      if (error.code !== 'PGRST116') {
        console.warn('Erro ao buscar API Key do usuário:', error.message);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    return data.api_key || null;
  } catch (error: any) {
    // Erro silencioso - não quebrar o fluxo se houver problema ao buscar API key
    console.warn('Erro ao buscar API Key do usuário (ignorado):', error?.message || error);
    return null;
  }
}

/**
 * Salva ou atualiza a API Key do usuário
 */
export async function saveUserApiKey(
  provider: ApiProvider,
  apiKey: string,
  isGlobal: boolean = false
): Promise<UserApiKey> {
  try {
    console.log('💾 [saveUserApiKey] Iniciando salvamento...', { provider, isGlobal, keyLength: apiKey.trim().length });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ [saveUserApiKey] Erro ao obter usuário:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('✅ [saveUserApiKey] Usuário autenticado:', user.id);

    // Validar formato básico da API Key
    if (!apiKey || apiKey.trim().length < 10) {
      throw new Error('API Key inválida (muito curta)');
    }

    console.log('🔍 [saveUserApiKey] Verificando se já existe API Key para este provider...');
    
    // Verificar se já existe uma API Key ativa para este provider
    const { data: existing, error: existingError } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();

    if (existingError) {
      console.error('❌ [saveUserApiKey] Erro ao verificar existência:', existingError);
    } else if (existing) {
      console.log('📝 [saveUserApiKey] API Key existente encontrada:', existing.id);
    } else {
      console.log('➕ [saveUserApiKey] Nenhuma API Key existente, criando nova...');
    }

    let result;
    if (existing) {
      // Atualizar existente
      console.log('📝 [saveUserApiKey] Atualizando API Key existente:', existing.id);
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .update({
          api_key: apiKey.trim(),
          is_global: isGlobal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [saveUserApiKey] Erro ao atualizar:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      
      if (!data) {
        throw new Error('Erro ao atualizar API Key - nenhum dado retornado');
      }
      
      console.log('✅ [saveUserApiKey] API Key atualizada com sucesso');
      result = data;
    } else {
      // Desativar outras API Keys do mesmo provider (se houver)
      console.log('🔄 [saveUserApiKey] Desativando outras API Keys do mesmo provider...');
      
      const { error: deactivateError } = await supabase
        .from('user_api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider);
      
      if (deactivateError) {
        console.warn('⚠️ [saveUserApiKey] Erro ao desativar chaves antigas (ignorado):', deactivateError);
      }

      // Criar nova
      console.log('➕ [saveUserApiKey] Inserindo nova API Key...');
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider,
          api_key: apiKey.trim(),
          is_global: isGlobal,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [saveUserApiKey] Erro ao inserir:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      
      if (!data) {
        throw new Error('Erro ao criar API Key - nenhum dado retornado');
      }
      
      console.log('✅ [saveUserApiKey] Nova API Key criada com sucesso:', data.id);
      result = data;
    }

    return result as UserApiKey;
  } catch (error: any) {
    console.error('❌ [saveUserApiKey] Erro GERAL ao salvar API Key:', error);
    console.error('❌ [saveUserApiKey] Stack:', error.stack);
    throw new Error(error.message || 'Erro ao salvar API Key');
  }
}

/**
 * Lista todas as API Keys do usuário
 */
export async function getUserApiKeys(): Promise<UserApiKey[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserApiKey[];
  } catch (error) {
    console.error('Erro ao listar API Keys:', error);
    return [];
  }
}

/**
 * Remove uma API Key
 */
export async function deleteUserApiKey(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erro ao deletar API Key:', error);
    throw new Error(error.message || 'Erro ao deletar API Key');
  }
}

/**
 * Atualiza estatísticas de uso da API Key
 */
export async function updateApiKeyUsage(
  provider: ApiProvider,
  tokensUsed: number
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar a API Key ativa primeiro para obter os valores atuais
    const { data: currentKey } = await supabase
      .from('user_api_keys')
      .select('usage_count, total_tokens_used')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

    if (!currentKey) return;

    // Atualizar com os novos valores
    const { error } = await supabase
      .from('user_api_keys')
      .update({
        usage_count: (currentKey.usage_count || 0) + 1,
        total_tokens_used: (currentKey.total_tokens_used || 0) + tokensUsed,
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  } catch (error) {
    console.error('Erro ao atualizar uso da API Key:', error);
  }
}

/**
 * Valida se uma API Key do Gemini é válida
 */
export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    // Verificar formato básico da chave Gemini (começa com AIzaSy)
    if (!apiKey.startsWith('AIzaSy')) {
      console.warn('API Key do Gemini não tem o formato esperado (deve começar com AIzaSy)');
      // Não retornar false aqui, pois pode ser uma chave válida com formato diferente
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na validação Gemini:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    // Verificar se retornou uma lista de modelos
    return data && Array.isArray(data.models) && data.models.length > 0;
  } catch (error: any) {
    console.error('Erro ao validar API Key do Gemini:', error);
    // Se for erro de rede, pode ser que a chave seja válida mas não conseguimos validar
    // Nesse caso, retornamos true para permitir que o usuário tente usar
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('Erro de rede ao validar. Permitindo salvar a chave para tentativa posterior.');
      return true; // Permitir salvar mesmo com erro de rede
    }
    return false;
  }
}

/**
 * Valida se uma API Key da OpenAI é válida
 */
export async function validateOpenAIApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    // Verificar formato básico da chave OpenAI (começa com sk-)
    if (!apiKey.startsWith('sk-')) {
      console.warn('API Key da OpenAI não tem o formato esperado (deve começar com sk-)');
      // Não retornar false aqui, pois pode ser uma chave válida com formato diferente
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na validação OpenAI:', response.status, errorText);
      
      // Se for erro 401, a chave é inválida
      if (response.status === 401) {
        return false;
      }
      
      // Outros erros podem ser temporários
      return false;
    }

    const data = await response.json();
    // Verificar se retornou uma lista de modelos
    return data && Array.isArray(data.data) && data.data.length > 0;
  } catch (error: any) {
    console.error('Erro ao validar API Key da OpenAI:', error);
    // Se for erro de rede, pode ser que a chave seja válida mas não conseguimos validar
    // Nesse caso, retornamos true para permitir que o usuário tente usar
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('Erro de rede ao validar. Permitindo salvar a chave para tentativa posterior.');
      return true; // Permitir salvar mesmo com erro de rede
    }
    return false;
  }
}


/**
 * Serviço para gerenciar buckets do Supabase Storage
 */

import { supabase } from './supabaseService';

/**
 * Cria o bucket "avatars" se não existir
 * Retorna true se o bucket existe ou foi criado com sucesso
 */
export async function ensureAvatarsBucket(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔍 Verificando se o bucket "avatars" existe...');

    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return {
        success: false,
        message: `Erro ao verificar buckets: ${listError.message}`
      };
    }

    // Verificar se o bucket já existe
    const existingBucket = buckets?.find(b => b.name === 'avatars');
    if (existingBucket) {
      console.log('✅ Bucket "avatars" já existe');
      return {
        success: true,
        message: 'Bucket "avatars" já existe'
      };
    }

    console.log('📦 Bucket não encontrado. Tentando criar...');

    // Tentar criar o bucket usando a API REST diretamente
    // Isso pode não funcionar com ANON_KEY, mas vamos tentar
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        message: 'Variáveis de ambiente do Supabase não configuradas'
      };
    }

    // Usar fetch para criar o bucket via API REST
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        name: 'avatars',
        public: true,
        allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        file_size_limit: 5242880
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.message && (data.message.includes('already exists') || data.message.includes('duplicate'))) {
        console.log('✅ Bucket "avatars" já existe (mensagem de erro)');
        return {
          success: true,
          message: 'Bucket "avatars" já existe'
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Permissão insuficiente. A criação automática de buckets requer SERVICE_ROLE_KEY. Por favor, crie o bucket manualmente no Supabase Dashboard.'
        };
      }

      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Bucket "avatars" criado com sucesso!');
    return {
      success: true,
      message: 'Bucket "avatars" criado com sucesso!'
    };

  } catch (error: any) {
    console.error('❌ Erro ao criar bucket:', error);
    return {
      success: false,
      message: error.message || 'Erro ao criar bucket'
    };
  }
}


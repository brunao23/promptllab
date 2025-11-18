/**
 * Função utilitária para criar o bucket "avatars" via API do Supabase
 * Usa a service role key para ter permissões administrativas
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export async function createAvatarsBucketIfNotExists(
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Criar cliente com service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return {
        success: false,
        message: `Erro ao verificar buckets: ${listError.message}`
      };
    }

    const existingBucket = buckets?.find(b => b.name === 'avatars');
    if (existingBucket) {
      return {
        success: true,
        message: 'Bucket "avatars" já existe'
      };
    }

    // Criar o bucket
    const { data: bucket, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        return {
          success: true,
          message: 'Bucket "avatars" já existe'
        };
      }
      
      return {
        success: false,
        message: `Erro ao criar bucket: ${createError.message}`
      };
    }

    return {
      success: true,
      message: 'Bucket "avatars" criado com sucesso!'
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Erro inesperado: ${error.message}`
    };
  }
}


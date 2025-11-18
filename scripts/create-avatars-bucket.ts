/**
 * Script para criar o bucket "avatars" automaticamente no Supabase Storage
 * Execute este script com: npx tsx scripts/create-avatars-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zmagqrcymbletqymclig.supabase.co';
// Para criar buckets, precisamos da SERVICE_ROLE_KEY (não a ANON_KEY)
// Você precisa obter esta chave do Dashboard do Supabase → Settings → API → service_role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function createAvatarsBucket() {
  console.log('🚀 Iniciando criação do bucket "avatars"...');
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.log('\n📋 Para obter a SERVICE_ROLE_KEY:');
    console.log('1. Acesse https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para Settings → API');
    console.log('4. Copie a "service_role" key (NÃO use a anon key)');
    console.log('5. Configure: export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"');
    console.log('   Ou crie um arquivo .env.local com: SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui');
    process.exit(1);
  }

  try {
    // Criar cliente com service role key (tem permissões administrativas)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Cliente Supabase criado com service role key');

    // Verificar se o bucket já existe
    console.log('🔍 Verificando se o bucket já existe...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      throw listError;
    }

    const existingBucket = buckets?.find(b => b.name === 'avatars');
    if (existingBucket) {
      console.log('✅ Bucket "avatars" já existe!');
      console.log('📊 Detalhes do bucket:', existingBucket);
      return;
    }

    console.log('📦 Bucket não encontrado. Criando...');

    // Criar o bucket
    const { data: bucket, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket já existe (erro pode ser ignorado)');
        return;
      }
      
      throw createError;
    }

    console.log('✅ Bucket "avatars" criado com sucesso!');
    console.log('📊 Detalhes do bucket:', bucket);

    // Configurar políticas RLS (opcional, mas recomendado)
    console.log('\n🔒 Configurando políticas RLS...');
    console.log('⚠️ As políticas RLS precisam ser criadas manualmente via SQL Editor no Supabase Dashboard.');
    console.log('📋 Execute o SQL do arquivo: scripts/setup-bucket-policies.sql');

  } catch (error: any) {
    console.error('❌ Erro ao criar bucket:', error);
    console.log('\n💡 Alternativa: Crie o bucket manualmente seguindo as instruções em INSTRUCOES_BUCKET_AVATARS.md');
    process.exit(1);
  }
}

createAvatarsBucket();


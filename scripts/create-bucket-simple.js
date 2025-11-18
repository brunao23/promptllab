/**
 * Script simples para criar o bucket "avatars" no Supabase Storage
 * Execute: node scripts/create-bucket-simple.js
 * 
 * NOTA: Você precisa configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * OU obter a SERVICE_ROLE_KEY do Supabase Dashboard → Settings → API
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zmagqrcymbletqymclig.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function createBucket() {
  console.log('🚀 Tentando criar bucket "avatars"...\n');
  
  if (!SUPABASE_KEY) {
    console.error('❌ Erro: Chave do Supabase não configurada!');
    console.log('\n📋 Configure uma das seguintes opções:');
    console.log('1. VITE_SUPABASE_ANON_KEY (pode não ter permissão)');
    console.log('2. SUPABASE_SERVICE_ROLE_KEY (recomendado - tem permissões administrativas)');
    console.log('\n💡 Para obter a SERVICE_ROLE_KEY:');
    console.log('   Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  try {
    // Usar fetch direto para a API do Supabase Storage
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
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
      if (data.message && data.message.includes('already exists')) {
        console.log('✅ Bucket "avatars" já existe!');
        return;
      }
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Bucket "avatars" criado com sucesso!');
    console.log('📊 Detalhes:', data);

  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    console.log('\n💡 Se o erro for de permissão:');
    console.log('   1. Use a SERVICE_ROLE_KEY em vez da ANON_KEY');
    console.log('   2. Ou crie o bucket manualmente no Dashboard do Supabase');
    console.log('\n📋 Consulte INSTRUCOES_BUCKET_AVATARS.md para instruções manuais');
    process.exit(1);
  }
}

createBucket();


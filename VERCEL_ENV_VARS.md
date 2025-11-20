# 🔧 Variáveis de Ambiente Necessárias na Vercel

## ⚠️ IMPORTANTE: Configure estas variáveis na Vercel para o banco de dados funcionar!

### Passo 1: Acesse as Configurações do Projeto na Vercel

1. Acesse: https://vercel.com/seu-usuario/promptllab/settings/environment-variables
2. Ou: Dashboard → Seu Projeto → Settings → Environment Variables

### Passo 2: Adicione as Variáveis OBRIGATÓRIAS

Você **DEVE** adicionar estas variáveis:

#### 1. Supabase URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Sua URL do Supabase (ex: `https://xxxxxxxxxxxxx.supabase.co`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### 2. Supabase Anon Key
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Sua chave anônima do Supabase
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### 3. Gemini API Key (Opcional, mas recomendado)
- **Key:** `GEMINI_API_KEY`
- **Value:** Sua chave da API do Google Gemini
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### ⚠️ ATENÇÃO: Prefixo `NEXT_PUBLIC_`

- Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao cliente (browser)
- Variáveis SEM o prefixo são apenas no servidor
- Para Supabase funcionar no browser, **DEVE** ter o prefixo `NEXT_PUBLIC_`

### Como Encontrar suas Credenciais do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. Copie:
   - **Project URL** → use como `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Após Configurar

1. **Salve** as variáveis
2. **Faça um novo deploy** (ou aguarde o próximo automático)
3. Verifique se o banco de dados está carregando

### Verificar se está Funcionando

Abra o console do navegador (F12) e verifique:
- ✅ Deve aparecer: `✅ Supabase configurado`
- ❌ Se aparecer: `❌ Variáveis de ambiente do Supabase não configuradas!` → as variáveis não estão configuradas corretamente


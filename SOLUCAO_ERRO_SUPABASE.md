# 🔧 Solução: Erro "Variáveis de ambiente do Supabase não configuradas"

## 📋 Problema

O erro ocorre quando você está acessando um **build de produção antigo** que foi criado antes das variáveis de ambiente serem configuradas.

## ✅ Soluções

### 1️⃣ **Se estiver rodando LOCALMENTE em desenvolvimento:**

```bash
# Pare o servidor atual (Ctrl+C)
# Execute o servidor de desenvolvimento:
npm run dev
```

O servidor de desenvolvimento carrega automaticamente as variáveis do arquivo `.env`.

### 2️⃣ **Se estiver acessando o BUILD DE PRODUÇÃO local:**

```bash
# Opção A: Limpar cache do navegador
# Pressione Ctrl+Shift+Delete e limpe o cache

# Opção B: Reconstruir e testar o build
npm run build
npm run preview
```

### 3️⃣ **Se estiver rodando na VERCEL (produção online):**

As variáveis de ambiente precisam estar configuradas no dashboard da Vercel:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL` = `https://zmagqrcymbletqymclig.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY`
5. Marque todas as opções: **Production**, **Preview**, **Development**
6. Clique em **Save**
7. Faça um novo deploy (ou aguarde o próximo push no GitHub)

## 🔍 Verificação

Para verificar se as variáveis estão configuradas corretamente:

```bash
# No terminal, dentro da pasta labprompt:
cat .env | grep VITE_SUPABASE
```

Você deve ver:
```
VITE_SUPABASE_URL=https://zmagqrcymbletqymclig.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Importante

- O Vite **só inclui variáveis que começam com `VITE_`** no build de produção
- O arquivo `.env` **não é commitado no Git** (está no `.gitignore`)
- Para produção na Vercel, você **deve configurar as variáveis no dashboard**

## 🚀 Próximos Passos

1. Se estiver local: Execute `npm run dev`
2. Se estiver na Vercel: Configure as variáveis no dashboard e faça um novo deploy
3. Limpe o cache do navegador se o problema persistir


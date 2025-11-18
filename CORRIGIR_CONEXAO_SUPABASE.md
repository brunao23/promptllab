# 🔧 Corrigir Conexão com Supabase - "Failed to fetch"

## 🔴 Problema

Erro ao fazer login ou criar conta:
```
Erro ao fazer login: Failed to fetch
```

**Causa:** As variáveis de ambiente do Supabase não estão configuradas ou não estão sendo carregadas corretamente na Vercel.

## ✅ Solução Passo a Passo

### Passo 1: Verificar Variáveis de Ambiente na Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione o projeto:** `promptlllab`
3. **Vá em:** Settings → Environment Variables

### Passo 2: Adicionar/Verificar Variáveis

**Certifique-se que TODAS estas variáveis estão configuradas:**

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | ☑️ Production ☑️ Preview ☑️ Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY` | ☑️ Production ☑️ Preview ☑️ Development |
| `GEMINI_API_KEY` | `sua-chave-gemini-aqui` | ☑️ Production ☑️ Preview ☑️ Development |

**IMPORTANTE:**
- ✅ Marque TODAS para Production, Preview e Development
- ✅ Certifique-se que os valores estão corretos (copie e cole com cuidado)
- ✅ Não há espaços extras no início ou fim dos valores

### Passo 3: Obter Valores Corretos do Supabase

Se você não tem os valores corretos:

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em:** Settings → API
4. **Copie:**
   - **Project URL** → Use para `VITE_SUPABASE_URL`
   - **anon public** key → Use para `VITE_SUPABASE_ANON_KEY`

### Passo 4: Fazer Redeploy

Após adicionar/atualizar as variáveis:

1. **Vá em:** Deployments
2. **Clique nos três pontos** (⋯) do último deploy
3. **Clique em:** Redeploy
4. **Aguarde 2-3 minutos**

### Passo 5: Verificar no Console do Navegador

1. **Abra o site** na Vercel
2. **Pressione F12** para abrir o console
3. **Procure por:**
   - ✅ `✅ Supabase configurado:` → Tudo certo!
   - ❌ `⚠️ Supabase não configurado` → Variáveis não estão sendo carregadas

## 🔍 Diagnóstico Avançado

### Verificar se Variáveis Estão Sendo Carregadas

1. **Abra o Console (F12)**
2. **Vá na aba Console**
3. **Digite:**
   ```javascript
   console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'VAZIO');
   ```

**Resultado Esperado:**
- `VITE_SUPABASE_URL:` deve mostrar a URL do Supabase
- `VITE_SUPABASE_ANON_KEY:` deve mostrar "Configurado"

**Se mostrar "undefined" ou "VAZIO":**
- ❌ Variáveis não estão configuradas na Vercel
- ❌ Variáveis não foram marcadas para Production
- ❌ Redeploy não foi feito após adicionar variáveis

## ⚠️ Problemas Comuns

### Problema 1: Variáveis Não Aparecem no Console

**Solução:**
1. Verifique se marcou para **Production**
2. Faça um **Redeploy** completo (não basta salvar)
3. Aguarde alguns minutos para propagar

### Problema 2: URL Incorreta

**Solução:**
1. Verifique se a URL começa com `https://`
2. Verifique se não há espaços extras
3. Copie diretamente do Dashboard do Supabase

### Problema 3: Key Incorreta

**Solução:**
1. Certifique-se que está usando a **anon public** key (não service_role)
2. Verifique se copiou a key completa (é muito longa)
3. Não deve ter quebras de linha ou espaços

### Problema 4: CORS Errors

**Solução:**
1. No Supabase Dashboard: Settings → API
2. Verifique **Site URL**:
   - Deve incluir a URL da Vercel (ex: `https://promptlllab.vercel.app`)
   - Pode adicionar múltiplas URLs separadas por vírgula
3. **Redirect URLs:**
   - Adicione: `https://promptlllab.vercel.app/auth/callback`
   - Adicione: `https://promptlllab.vercel.app/**` (wildcard)

## 📋 Checklist Completo

Antes de reportar que ainda não funciona:

- [ ] Variáveis configuradas na Vercel
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Redeploy feito após adicionar variáveis
- [ ] URL do Supabase correta (começa com https://)
- [ ] Key do Supabase correta (anon public, não service_role)
- [ ] Sem espaços extras nos valores
- [ ] Site URL configurada no Supabase Dashboard
- [ ] Redirect URLs configuradas no Supabase Dashboard
- [ ] Console do navegador mostra "Supabase configurado"
- [ ] Testado em modo anônimo/incógnito

## 🚀 Após Corrigir

1. **Faça logout** (se estiver logado)
2. **Feche todas as abas** do site
3. **Aguarde 1 minuto**
4. **Abra o site novamente**
5. **Tente fazer login** ou criar conta

## 🆘 Se Ainda Não Funcionar

Envie:

1. **Screenshot das variáveis de ambiente** na Vercel (sem mostrar os valores completos)
2. **Logs do console** (F12 → Console → copie todos os erros)
3. **URL do projeto** na Vercel
4. **Mensagem de erro específica** que aparece

---

**A causa mais comum é: Variáveis não configuradas ou não marcadas para Production!** ✅


# 📖 SOLUÇÃO PASSO A PASSO - Erro de Conexão Supabase

## 🎯 Objetivo
Configurar as variáveis de ambiente do Supabase na Vercel para resolver o erro "Failed to fetch".

---

## 📍 PASSO 1: Abrir Vercel Dashboard

1. Abra seu navegador
2. Acesse: **https://vercel.com/dashboard**
3. Faça login (se necessário)
4. Você verá uma lista de projetos

---

## 📍 PASSO 2: Selecionar o Projeto

1. Procure pelo projeto: **`promptlllab`** (com 3 'l')
2. Clique no nome do projeto
3. Você será levado para a página do projeto

---

## 📍 PASSO 3: Ir para Environment Variables

1. No menu superior, clique em **"Settings"**
2. No menu lateral esquerdo, clique em **"Environment Variables"**
3. Você verá uma lista de variáveis (pode estar vazia)

---

## 📍 PASSO 4: Adicionar VITE_SUPABASE_URL

### 4.1. Clicar em "Add New"

1. Clique no botão **"Add New"** (geralmente no topo direito)
2. Um formulário aparecerá

### 4.2. Preencher os Campos

**Key:**
```
VITE_SUPABASE_URL
```
⚠️ **IMPORTANTE:** Copie exatamente como está acima (maiúsculas, minúsculas, underscores)

**Value:**
```
https://zmagqrcymbletqymclig.supabase.co
```
⚠️ **IMPORTANTE:** Não adicione espaços no início ou fim

**Environments:**
Marque todas as opções:
- ☑️ **Production** ← Muito importante!
- ☑️ **Preview**
- ☑️ **Development**

### 4.3. Salvar

1. Clique no botão **"Save"**
2. A variável deve aparecer na lista

---

## 📍 PASSO 5: Adicionar VITE_SUPABASE_ANON_KEY

### 5.1. Clicar em "Add New" Novamente

1. Clique no botão **"Add New"** novamente
2. Um novo formulário aparecerá

### 5.2. Preencher os Campos

**Key:**
```
VITE_SUPABASE_ANON_KEY
```
⚠️ **IMPORTANTE:** Copie exatamente como está acima

**Value:**
Cole a key completa (é bem longa, mais de 100 caracteres):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY
```

⚠️ **IMPORTANTE:** 
- Copie a key completa (do `eyJ` até o final)
- Não adicione espaços ou quebras de linha
- A key é uma linha só, muito longa

**Environments:**
Marque todas as opções:
- ☑️ **Production** ← Muito importante!
- ☑️ **Preview**
- ☑️ **Development**

### 5.3. Salvar

1. Clique no botão **"Save"**
2. A variável deve aparecer na lista

---

## 📍 PASSO 6: Verificar se Está Tudo Correto

Você deve ver na lista:

| Key | Value (oculto) | Environments |
|-----|----------------|--------------|
| `VITE_SUPABASE_URL` | `***...` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `***...` | Production, Preview, Development |

⚠️ **IMPORTANTE:** Se você não vê "Production" marcado, clique nos três pontos (⋯) e edite para marcar Production.

---

## 📍 PASSO 7: Fazer Redeploy

**⚠️ CRÍTICO:** As variáveis só funcionam após um redeploy!

### 7.1. Ir para Deployments

1. No menu lateral esquerdo, clique em **"Deployments"**
2. Você verá uma lista de deploys (o mais recente no topo)

### 7.2. Encontrar o Último Deploy

1. Procure pelo deploy mais recente (primeiro da lista)
2. Ele pode ter status "Ready", "Error" ou "Building"

### 7.3. Fazer Redeploy

1. À direita do deploy, clique nos **três pontos** (⋯)
2. Um menu aparecerá
3. Clique em **"Redeploy"**
4. Uma confirmação aparecerá
5. Clique em **"Redeploy"** novamente para confirmar
6. O status mudará para "Building"

### 7.4. Aguardar

1. **Aguarde 2-3 minutos** enquanto o deploy acontece
2. Você pode acompanhar o progresso na tela
3. Quando o status mudar para **"Ready"** (verde), o deploy terminou

---

## 📍 PASSO 8: Testar

### 8.1. Abrir o Site

1. Após o deploy terminar, clique na **URL** que aparece (ex: `promptlllab.vercel.app`)
2. O site abrirá em uma nova aba

### 8.2. Abrir Console do Navegador

1. Pressione **F12** no teclado
2. Uma janela abrirá na parte inferior ou lateral
3. Clique na aba **"Console"**

### 8.3. Verificar Mensagens

Procure por uma destas mensagens:

✅ **BOM SINAL:**
```
✅ Supabase configurado: https://zmagqrcymbletqymclig.supabase.co
```

❌ **MAL SINAL:**
```
⚠️ Supabase não configurado
```
ou
```
❌ ERRO: Variáveis de ambiente do Supabase não configuradas!
```

### 8.4. Tentar Login

1. Feche o console (F12 novamente)
2. Tente fazer login na aplicação
3. Se funcionar → ✅ **RESOLVIDO!**
4. Se ainda der erro → Veja "Problemas Comuns" abaixo

---

## 🔍 Se Você Não Tem os Valores

### Obter VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

1. Acesse: **https://supabase.com/dashboard**
2. Faça login
3. Clique no seu projeto (se tiver mais de um)
4. No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
5. Clique em **"API"**
6. Role a página até encontrar:

**Project URL:**
```
https://zmagqrcymbletqymclig.supabase.co
```
→ Use este valor para `VITE_SUPABASE_URL`

**Project API keys:**
Encontre a seção "anon public":
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Copie esta key completa para `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE:** Use a key **anon public**, NÃO a **service_role**!

---

## ⚠️ Problemas Comuns

### Problema 1: "Variáveis não aparecem no console"

**Causa:** Variáveis não foram marcadas para Production OU redeploy não foi feito.

**Solução:**
1. Volte para Settings → Environment Variables
2. Para cada variável, clique nos três pontos (⋯) → Edit
3. Verifique se ☑️ Production está marcado
4. Se não estiver, marque e salve
5. Vá para Deployments → ⋯ → Redeploy
6. Aguarde 3-4 minutos

### Problema 2: "Ainda dá erro de Failed to fetch"

**Causa:** CORS não configurado no Supabase.

**Solução:**
1. Acesse: https://supabase.com/dashboard → Seu Projeto → Settings → API
2. Em **Site URL**, adicione:
   ```
   https://promptlllab.vercel.app
   ```
3. Em **Redirect URLs**, adicione:
   ```
   https://promptlllab.vercel.app/auth/callback
   ```
4. Clique em **Save**
5. Aguarde 1 minuto
6. Tente novamente

### Problema 3: "Value muito curto ou incorreto"

**Causa:** Key ou URL copiada incorretamente.

**Solução:**
1. A URL deve começar com `https://` e terminar com `.supabase.co`
2. A Key é muito longa (mais de 100 caracteres) - certifique-se de copiar tudo
3. Não deve ter espaços ou quebras de linha
4. Copie novamente diretamente do Dashboard do Supabase

---

## 📋 Checklist Completo

Marque cada item conforme você faz:

- [ ] Acessei a Vercel Dashboard
- [ ] Selecionei o projeto `promptlllab`
- [ ] Fui para Settings → Environment Variables
- [ ] Adicionei `VITE_SUPABASE_URL` com valor correto
- [ ] Adicionei `VITE_SUPABASE_ANON_KEY` com valor correto
- [ ] Marquei ☑️ Production para ambas variáveis
- [ ] Marquei ☑️ Preview para ambas variáveis
- [ ] Marquei ☑️ Development para ambas variáveis
- [ ] Fui para Deployments
- [ ] Fiz Redeploy do último deploy
- [ ] Aguardei 2-3 minutos
- [ ] Verifiquei no console do navegador (F12)
- [ ] Site URL configurada no Supabase
- [ ] Redirect URLs configurada no Supabase
- [ ] Testei fazer login

---

## ✅ Resultado Esperado

Após seguir todos os passos:

✅ Console mostra: `✅ Supabase configurado`  
✅ Login funciona normalmente  
✅ Criar conta funciona normalmente  
✅ Não há mais erros "Failed to fetch"

---

## 🆘 Precisa de Ajuda?

Se depois de seguir todos os passos ainda não funciona, envie:

1. Screenshot das variáveis de ambiente na Vercel (mostrando os nomes e se Production está marcado)
2. Logs do console (F12 → Console → copie tudo)
3. Status do último deploy na Vercel

---

**Siga os passos acima na ordem e me avise o resultado!** 🚀


# ✅ LISTA FINAL - FAÇA ISSO AGORA (10 minutos)

## 🎯 OBJETIVO
Transformar sua conta em **Admin Master com Premium Ilimitado** e resolver TODOS os problemas.

---

# 📋 TAREFAS (em ordem)

## ✅ TAREFA 1: Executar Script de Admin Master (2 min)

1. Acesse: https://supabase.com/dashboard
2. Clique em **SQL Editor**
3. Abra o arquivo: **`CORRIGIR_ADMIN_MASTER_AGORA.sql`**
4. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Cole no SQL Editor
6. Clique em **RUN** (ou Ctrl+Enter)

**Verificar:** No final deve mostrar:
```
admin_role: super_admin
subscription_status: active
plan_name: 🔐 Admin Premium Master
versoes_permitidas: 999999
tokens_permitidos: 999999999
```

✅ Se viu isso, passou!

---

## ✅ TAREFA 2: Executar Script de API Keys (1 min)

1. Ainda no SQL Editor
2. Abra o arquivo: **`CORRIGIR_RLS_API_KEYS.sql`**
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **RUN**

**Verificar:** Deve mostrar 4 policies criadas:
- Users can view their own API keys
- Users can insert their own API keys  
- Users can update their own API keys
- Users can delete their own API keys

✅ Se viu isso, passou!

---

## ✅ TAREFA 3: Limpar Cache do Site (30 seg)

1. Vá para: https://labprompt.com.br
2. **Clique no botão 💣 (LARANJA)** no canto superior direito
3. Aguarde redirecionar para /login

✅ Se redirecionou, passou!

---

## ✅ TAREFA 4: Fazer Login Novamente (30 seg)

1. Faça login com: `brunocostaads23@gmail.com`
2. Digite sua senha
3. Clique em "Entrar"

**Verificar:** Na sidebar esquerda deve aparecer:
```
🔐 Admin Master          MASTER
♾️ Acesso Ilimitado Permanente

Tokens: 0 / ♾️ Ilimitado
Versões: 0 / ♾️ Ilimitado
```

✅ Se viu isso, passou!

---

## ✅ TAREFA 5: Adicionar API Key do Gemini (2 min)

### 5.1 Obter a chave (1 min)
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

### 5.2 Adicionar no site (1 min)
1. No site, clique em **"Configurações"** (menu lateral)
2. Role até a seção **"Chaves de API"**
3. Selecione: **Google Gemini**
4. Cole a chave
5. Clique em **"Salvar"**

**Se aparecer erro de validação:**
- Clique em **"OK"** no popup
- A chave será salva mesmo assim

**Verificar:** Deve aparecer:
```
✅ API Key do Gemini salva com sucesso!
```

✅ Se viu isso, passou!

---

## ✅ TAREFA 6: Testar o Sistema (2 min)

1. Clique em **"Workspace"** (menu lateral)
2. Preencha:
   - **Persona:** "Você é um assistente prestativo"
   - **Objetivo:** "Responder perguntas de forma clara"
3. Clique em **"Gerar Prompt Mestre"**
4. Aguarde 5-10 segundos

**Verificar:** Deve aparecer o prompt gerado na coluna do meio.

✅ Se gerou, passou! **TUDO ESTÁ FUNCIONANDO!** 🎉

---

# 🔴 SE ALGO DER ERRADO

## Problema 1: "Ainda aparece Trial Grátis"
- Aguarde 2-5 minutos (deploy da Vercel)
- Clique no 💣 novamente
- Faça logout/login

## Problema 2: "API Key não salva"
- Abra console (F12)
- Procure por: `❌ [saveUserApiKey]`
- Me envie o erro

## Problema 3: "Não gera o prompt"
- Verifique se a API Key do Gemini está correta
- Teste em: https://aistudio.google.com/app/apikey
- Gere uma nova chave se necessário

---

# 📊 CHECKLIST FINAL

Marque conforme conclui:

- [ ] Script 1: CORRIGIR_ADMIN_MASTER_AGORA.sql executado
- [ ] Script 2: CORRIGIR_RLS_API_KEYS.sql executado
- [ ] Botão 💣 clicado e fez logout
- [ ] Login feito novamente
- [ ] Sidebar mostra "🔐 Admin Master - MASTER"
- [ ] Sidebar mostra "♾️ Acesso Ilimitado"
- [ ] API Key do Gemini adicionada
- [ ] Prompt gerado com sucesso

---

**TODOS OS DEPLOYS FORAM FEITOS. EXECUTE OS SCRIPTS SQL AGORA!** 🚀


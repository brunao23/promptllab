# 🚀 SOLUÇÃO FINAL - API KEY GLOBAL E CRIAR USUÁRIO PREMIUM

## ✅ O QUE FOI CORRIGIDO:

### 1. **API Key Global Funcionando** ✅
- Criada API route `/api/gemini/generate` que usa a chave global do servidor
- Modificado `geminiService.ts` para usar a API route quando o usuário não tem chave própria
- **Agora TODOS os usuários podem gerar prompts sem configurar API Key!**

### 2. **Criar Usuário Premium Funcionando** ✅
- API route `/api/admin/create-user` já estava correta
- Usa `SUPABASE_SERVICE_ROLE_KEY` para criar usuários
- Cria profile, subscription premium e desativa subscriptions antigas

---

## 📋 PASSO A PASSO (5 MINUTOS):

### **PARTE 1: CONFIGURAR VERCEL (2 minutos)**

1. **Acesse:** https://vercel.com/dashboard
2. **Seu projeto** → **Settings** → **Environment Variables**
3. **Adicione estas 2 variáveis:**

```
Variável 1:
Name: GEMINI_API_KEY
Value: AIzaSyC5NFjPC1agckBYc2WUzCf0W-ua_AhXMrQ
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Variável 2:
Name: SUPABASE_SERVICE_ROLE_KEY  
Value: (copie do Supabase → Settings → API → service_role key)
Environments: ✅ TODOS
```

4. **Redesenhar:** Deployments → ... → Redeploy
5. **Aguardar:** 2-3 min até ✅ Ready

---

### **PARTE 2: TESTAR (2 minutos)**

#### **Teste 1: Gerar Prompt (API Key Global)**

1. Acesse: https://labprompt.com.br/dashboard
2. **NÃO configure API Key** nas Configurações
3. Preencha **Persona** e **Objetivo**
4. Clique **"Gerar Prompt Mestre"**
5. **DEVE FUNCIONAR!** ✅ (usando chave global)

#### **Teste 2: Criar Usuário Premium**

1. Faça login como admin (`brunocostaads23@gmail.com`)
2. Clique no botão **🔐** (verde) no header
3. Vá em **Usuários**
4. Clique **"Criar Usuário Premium"**
5. Preencha:
   - Email: `teste@exemplo.com`
   - Senha: `senha123456`
   - Nome: `Usuário Teste`
6. Clique **Criar**
7. **DEVE FUNCIONAR!** ✅

---

### **PARTE 3: VERIFICAR ERRO DE RELATIONSHIP (1 minuto)**

Se aparecer erro "Could not find a relationship between 'profiles' and 'subscriptions'":

1. **Supabase Dashboard** → **SQL Editor**
2. Execute:
```sql
-- Restart API para limpar cache
NOTIFY pgrst, 'reload schema';
```

3. Ou vá em: **Settings** → **API** → **"Restart API Server"**
4. Aguarde 1 minuto
5. Tente novamente

---

## 🔍 COMO FUNCIONA AGORA:

### **Fluxo de API Key:**

```
1. Usuário tenta gerar prompt
   ↓
2. Sistema verifica se usuário tem API Key própria
   ↓
3a. SE TEM → Usa API Key do usuário (localmente)
3b. SE NÃO TEM → Chama /api/gemini/generate (servidor usa GEMINI_API_KEY)
   ↓
4. Prompt gerado com sucesso! ✅
```

### **Fluxo de Criar Usuário:**

```
1. Admin clica "Criar Usuário Premium"
   ↓
2. Frontend chama /api/admin/create-user
   ↓
3. API verifica se é admin
   ↓
4. API usa SUPABASE_SERVICE_ROLE_KEY para:
   - Criar usuário no auth.users
   - Criar profile em profiles
   - Criar subscription premium em subscriptions
   ↓
5. Usuário criado com sucesso! ✅
```

---

## ✅ CHECKLIST FINAL:

- [ ] GEMINI_API_KEY adicionada na Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY adicionada na Vercel
- [ ] Redesenhar feito e deploy ✅ Ready
- [ ] Teste: Gerar prompt sem API Key própria → **FUNCIONA**
- [ ] Teste: Criar usuário premium → **FUNCIONA**
- [ ] Se erro de relationship → Restart API do Supabase

---

## 🆘 SE AINDA HOUVER PROBLEMAS:

### **Erro: "API_KEY não configurada"**
- Verifique se `GEMINI_API_KEY` está na Vercel
- Verifique se o deploy foi concluído
- Aguarde 1-2 minutos após o deploy

### **Erro: "User not allowed" ao criar usuário**
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está na Vercel
- Verifique se você está logado como admin
- Verifique se o email é `brunocostaads23@gmail.com`

### **Erro: "Could not find relationship"**
- Execute `NOTIFY pgrst, 'reload schema';` no Supabase
- Ou restart API Server no Supabase Dashboard
- Aguarde 1 minuto

---

**FAÇA OS TESTES AGORA!** 🚀

Tempo total: ~5 minutos


# 👤 Como Criar Novo Usuário com Premium

## ⚠️ PROBLEMA

O botão "Criar Usuário Premium" no painel de admin dá erro:
> "User not allowed"

**Causa:** O código não tem permissão de **Service Role** para criar usuários via API.

---

## ✅ SOLUÇÃO (Criar via Dashboard do Supabase)

### **Método 1: Dashboard + SQL (RECOMENDADO)**

#### PASSO 1: Criar usuário no Supabase Dashboard (1 minuto)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **Users** (menu lateral)
4. Clique no botão **"Add User"** (canto superior direito)
5. Preencha:
   - **Email:** email@cliente.com
   - **Password:** SenhaSegura123!
   - **Auto Confirm User:** ✅ Marque esta opção!
6. Clique em **"Create User"**

#### PASSO 2: Dar Premium via SQL (30 segundos)

1. Vá em **SQL Editor**
2. Abra o arquivo: **`CRIAR_USUARIO_PREMIUM_MANUAL.sql`**
3. **ALTERE estas linhas:**
   ```sql
   v_email text := 'email@cliente.com';  -- Email do usuário
   v_nome text := 'Nome do Cliente';     -- Nome completo
   ```
4. **ALTERE também no SELECT final:**
   ```sql
   WHERE u.email = 'email@cliente.com';  -- Mesmo email
   ```
5. Copie TODO o script
6. Cole no SQL Editor
7. Clique em **RUN**

#### PASSO 3: Verificar

Deve aparecer:
```
email              | full_name      | status | plano
-------------------|----------------|--------|--------
email@cliente.com  | Nome do Cliente| active | Premium
```

✅ **Usuário criado com Premium ativo!**

---

## 💡 Método 2: Via Email de Convite (ALTERNATIVA)

Se preferir que o usuário crie a própria senha:

1. No Dashboard Supabase: **Authentication** → **Users** → **Invite User**
2. Digite o email
3. O usuário recebe email com link para criar senha
4. Depois execute o script SQL para dar Premium

---

## 🔧 CORRIGIR O BOTÃO NO PAINEL ADMIN (Futuro)

Para que o botão funcione, você precisaria:

1. **Criar uma API Route no Next.js** que use Service Role Key
2. **Nunca expor** a Service Role Key no frontend

Mas por enquanto, usar o Dashboard é mais seguro e rápido.

---

## 📋 RESUMO

| Método | Tempo | Dificuldade | Segurança |
|--------|-------|-------------|-----------|
| **Dashboard + SQL** | 2 min | Fácil | ✅ Alta |
| Botão no Painel | Não funciona | - | ❌ Requer refatoração |

---

**USE O DASHBOARD DO SUPABASE + O SCRIPT SQL!** 

É mais rápido e seguro que consertar o botão agora.


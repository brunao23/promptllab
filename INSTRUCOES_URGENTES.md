# 🚨 INSTRUÇÕES URGENTES - CORRIJA AGORA

## O PROBLEMA

Seu banco de dados tem **policies RLS quebradas** e possivelmente o perfil não foi criado corretamente.

## SOLUÇÃO (5 MINUTOS)

### PASSO 1: Ir para Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral esquerdo)

### PASSO 2: Executar o Script
1. Abra o arquivo `FIX_ACCOUNT_NOW.sql`
2. **COPIE TODO O CONTEÚDO**
3. **COLE no SQL Editor do Supabase**
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### PASSO 3: Verificar Resultados
Você deve ver na última query 4 linhas:
```
type         | id                                   | email                      | ...
-------------|--------------------------------------|----------------------------|----
AUTH USER    | (seu-user-id)                       | brunocostaads23@gmail.com  | t
PROFILE      | (mesmo-id)                          | brunocostaads23@gmail.com  | t
ADMIN        | (mesmo-id)                          | brunocostaads23@gmail.com  | t
WORKSPACE    | (workspace-id)                      | Meu Workspace              | t
```

### PASSO 4: Testar no Site
1. **Clique no botão 💣 (laranja)** no site para limpar cache
2. **Faça login novamente**
3. **Deve funcionar agora!**

## SE AINDA NÃO FUNCIONAR

Rode esta query adicional no Supabase:

```sql
-- Ver TODAS as policies atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('workspaces', 'prompts', 'profiles')
ORDER BY tablename, policyname;
```

E me envie o resultado.

## PROBLEMA TÉCNICO IDENTIFICADO

O schema tem inconsistência:
- `workspaces.user_id` → `auth.users(id)` ✅
- `prompts.user_id` → `profiles(id)` ✅
- **MAS** as policies RLS podem estar usando o campo errado!

O script corrige isso automaticamente.

## LOGS IMPORTANTES

Depois de rodar o script e fazer login, abra o console (F12) e me envie:
- Qualquer linha que comece com ❌
- Qualquer linha que comece com 🔄 [PromptManager]

---

**RODE O SCRIPT AGORA E ME AVISE O RESULTADO!**


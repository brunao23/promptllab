# 🔧 Instruções para Corrigir Erros de Autenticação e RLS

## Problema
Erros 401 (Unauthorized) e 406 (Not Acceptable) ao tentar acessar workspaces, indicando problemas com:
- Autenticação (sessão não reconhecida)
- Políticas RLS (Row-Level Security) bloqueando acesso

## Solução

### Passo 1: Execute o Script SQL Simplificado

Execute o arquivo `CORRIGIR_RLS_WORKSPACES_SIMPLES.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `CORRIGIR_RLS_WORKSPACES_SIMPLES.sql`
4. Clique em **Run**

Este script:
- Remove políticas RLS antigas
- Cria políticas simples que permitem acesso para usuários autenticados
- Garante que RLS está habilitado

### Passo 2: Verificar se Você Está Logado

1. Faça logout da aplicação
2. Faça login novamente
3. Verifique se a sessão está ativa

### Passo 3: Verificar no Console do Navegador

Abra o Console do Navegador (F12) e verifique:
- Se há mensagens de "✅ Sessão encontrada"
- Se há erros de autenticação
- Se o user_id está sendo reconhecido

### Passo 4: Se o Problema Persistir

Se ainda houver erros 401 após executar o script SQL:

1. **Verifique se você está na tabela `admin_users`**:
   ```sql
   SELECT * FROM public.admin_users WHERE user_id = 'SEU_USER_ID_AQUI';
   ```

2. **Crie um workspace manualmente para testar**:
   ```sql
   INSERT INTO public.workspaces (user_id, name, description, is_active, is_default)
   VALUES ('SEU_USER_ID_AQUI', 'Meu Workspace', 'Workspace de teste', true, true);
   ```

3. **Verifique as políticas RLS ativas**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'workspaces';
   ```

## Arquivos Corrigidos

✅ `services/supabaseService.ts` - Todas as funções agora usam cliente SSR
✅ `components/PromptManager.tsx` - Verifica sessão antes de carregar dados
✅ `components/WorkspaceManager.tsx` - Verifica sessão antes de carregar workspaces
✅ `components/Header.tsx` - Tratamento de erros melhorado

## Scripts SQL Disponíveis

1. **CORRIGIR_RLS_WORKSPACES_SIMPLES.sql** - Versão simples (RECOMENDADO PRIMEIRO)
2. **CORRIGIR_RLS_WORKSPACES.sql** - Versão completa com suporte a admins

Execute primeiro o script SIMPLES, depois o completo se necessário.


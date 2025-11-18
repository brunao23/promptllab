# 🔧 Resolver Erro de Recursão RLS - Guia Rápido

## ❌ Problema Identificado

**Erro:** `infinite recursion detected in policy for relation "admin_users"`

**Causa:** A política RLS estava verificando `admin_users` dentro da própria verificação de `admin_users`, causando um loop infinito.

## ✅ Solução (5 minutos)

### Passo 1: Acessar Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto

### Passo 2: Executar Script SQL

1. **Vá em:** SQL Editor → New query
2. **Abra o arquivo:** `CORRIGIR_RLS_ADMIN_USERS.sql` (na raiz do projeto)
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. **Execute:** Ctrl+Enter (Windows) ou Cmd+Enter (Mac)
6. **Aguarde:** "✅ Políticas RLS corrigidas para admin_users"

### Passo 3: Verificar

1. **Recarregue a página** da aplicação (F5)
2. **O erro deve desaparecer** ✅
3. O **DiagnosticPanel** não deve mais mostrar erro de recursão

## 📋 O que o Script Faz

1. **Remove a política problemática** que causava recursão
2. **Cria uma função** `is_user_admin()` que contorna RLS usando `SECURITY DEFINER`
3. **Cria novas políticas** que usam a função (sem recursão)
4. **Permite que admins vejam outros admins** corretamente

## ✅ Resultado Esperado

Após executar o script:

- ✅ Erro "infinite recursion" desaparece
- ✅ DiagnosticPanel funciona corretamente
- ✅ Subscription é carregada normalmente
- ✅ Admin pode ver outros admins sem erros

## 🆘 Se Ainda Der Erro

1. Verifique se o script foi executado completamente
2. Verifique se todas as políticas foram criadas (veja logs no SQL Editor)
3. Tente fazer logout e login novamente
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

**Execute o script SQL e o problema será resolvido!** 🚀


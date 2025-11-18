# 🔐 Configuração de Autenticação - LaBPrompT

Este documento explica como a autenticação foi implementada usando Supabase.

## ✅ O que foi implementado

### 1. **Páginas de Autenticação**
- ✅ **Login** (`pages/Login.tsx`) - Login completo com Supabase
- ✅ **Register** (`pages/Register.tsx`) - Cadastro completo com Supabase
- ✅ Validação de formulários
- ✅ Tratamento de erros amigável
- ✅ Feedback visual de sucesso/erro

### 2. **Proteção de Rotas**
- ✅ **ProtectedRoute** (`components/ProtectedRoute.tsx`) - Protege rotas que exigem autenticação
- ✅ Verificação automática de sessão
- ✅ Redirecionamento automático para login se não autenticado
- ✅ Tela de loading durante verificação

### 3. **Header com Informações do Usuário**
- ✅ **Header** (`components/Header.tsx`) - Mostra informações do usuário logado
- ✅ Botão de logout funcional
- ✅ Busca automática do perfil do usuário

### 4. **Serviço de Autenticação**
- ✅ **supabaseService.ts** - Todas as funções de autenticação
  - `signUp()` - Registrar novo usuário
  - `signIn()` - Fazer login
  - `signOut()` - Fazer logout
  - `getCurrentUser()` - Obter usuário atual
  - `getCurrentProfile()` - Obter perfil do usuário

## 🚀 Como usar

### 1. Instalar Dependências

```bash
npm install
```

O pacote `@supabase/supabase-js` já foi adicionado ao `package.json`.

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (dentro da pasta `labprompt`) com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui

> ⚠️ **IMPORTANTE**: Obtenha a chave real em: https://supabase.com/dashboard → Settings → API
```

**Importante**: No Vite, as variáveis de ambiente devem ter o prefixo `VITE_` para serem acessíveis no código.

### 3. Executar o Schema SQL no Supabase

Execute o arquivo `supabase_schema.sql` no SQL Editor do Supabase Dashboard para criar todas as tabelas e políticas RLS.

### 4. Testar a Autenticação

1. **Cadastro**:
   - Acesse `/register`
   - Preencha nome, email e senha
   - Clique em "Criar conta"
   - O perfil será criado automaticamente via trigger

2. **Login**:
   - Acesse `/login`
   - Digite email e senha
   - Clique em "Entrar"
   - Será redirecionado para `/dashboard`

3. **Logout**:
   - Clique no botão "Sair" no Header
   - Será deslogado e redirecionado para `/login`

## 🔄 Fluxo de Autenticação

```
┌─────────────┐
│  Register   │ → Cria usuário no Supabase Auth
└──────┬──────┘ → Trigger cria perfil automaticamente
       │
       ↓
┌─────────────┐
│    Login    │ → Autentica com Supabase Auth
└──────┬──────┘ → Obtém sessão
       │
       ↓
┌─────────────┐
│  Dashboard  │ → ProtectedRoute verifica sessão
└──────┬──────┘ → Busca perfil do usuário
       │
       ↓
┌─────────────┐
│   Header    │ → Mostra nome/email do usuário
└──────┬──────┘ → Botão logout disponível
       │
       ↓
┌─────────────┐
│   Logout    │ → Remove sessão
└─────────────┘ → Redireciona para /login
```

## 🔒 Segurança

- ✅ **Row Level Security (RLS)** habilitado em todas as tabelas
- ✅ Usuários só podem ver seus próprios dados
- ✅ Senhas são criptografadas pelo Supabase
- ✅ Tokens JWT gerenciados automaticamente
- ✅ Refresh automático de tokens

## 📝 Funcionalidades Implementadas

### Login
- ✅ Validação de email e senha
- ✅ Mensagens de erro personalizadas
- ✅ Suporte para confirmação de email
- ✅ Redirecionamento automático após login
- ✅ Verificação de sessão existente

### Cadastro
- ✅ Validação de todos os campos
- ✅ Verificação de senhas coincidentes
- ✅ Validação de formato de email
- ✅ Mensagens de sucesso/erro
- ✅ Criação automática de perfil

### ProtectedRoute
- ✅ Verificação de autenticação
- ✅ Loading durante verificação
- ✅ Redirecionamento automático
- ✅ Listener para mudanças de autenticação

### Header
- ✅ Exibição de nome e email do usuário
- ✅ Logout funcional
- ✅ Atualização automática ao logar/sair

## 🐛 Troubleshooting

### "Variáveis de ambiente do Supabase não configuradas"

**Solução**: 
1. Crie o arquivo `.env` na pasta `labprompt`
2. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

### "Erro ao fazer login"

**Possíveis causas**:
- Email ou senha incorretos
- Email não confirmado (verifique configuração no Supabase)
- Problema de conexão com Supabase

**Solução**: 
- Verifique se o email foi confirmado no Supabase Dashboard
- Verifique as credenciais
- Verifique as variáveis de ambiente

### "Perfil não encontrado"

**Solução**: 
- O trigger deve criar o perfil automaticamente ao registrar
- Verifique se o trigger `on_auth_user_created` foi criado
- Verifique os logs do Supabase

### "Erro ao buscar perfil"

**Solução**: 
- Verifique se o schema SQL foi executado completamente
- Verifique se a tabela `profiles` existe
- Verifique as políticas RLS

## 📚 Próximos Passos

1. ✅ Autenticação implementada e funcional
2. ✅ Proteção de rotas implementada
3. ⏳ Integrar persistência de prompts no banco de dados
4. ⏳ Adicionar recuperação de senha
5. ⏳ Adicionar edição de perfil

## 📖 Recursos

- [Documentação do Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Cliente JavaScript](https://supabase.com/docs/reference/javascript/introduction)


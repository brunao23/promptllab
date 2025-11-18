# Configuração do Supabase - LaBPrompT

Este documento explica como configurar o banco de dados Supabase para o projeto LaBPrompT.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais do projeto (fornecidas pelo usuário)

## 🚀 Passo a Passo

### 1. Acessar o SQL Editor

1. Acesse seu projeto no Supabase Dashboard
2. Vá para **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Executar o Schema

1. Copie o conteúdo completo do arquivo `supabase_schema.sql`
2. Cole no SQL Editor
3. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 3. Verificar a Criação das Tabelas

1. Vá para **Table Editor** no menu lateral
2. Você deve ver todas as tabelas criadas:
   - `profiles`
   - `documents`
   - `prompts`
   - `prompt_versions`
   - `few_shot_examples`
   - `variaveis_dinamicas`
   - `ferramentas`
   - `fluxos`
   - `chat_messages`
   - `optimization_pairs`

### 4. Verificar Políticas RLS

1. Vá para **Authentication** > **Policies**
2. Verifique se as políticas RLS estão ativas em todas as tabelas

### 5. Configurar Autenticação

O Supabase já possui sistema de autenticação integrado. Você pode configurar:

1. **Email/Password** (já habilitado por padrão)
2. **OAuth providers** (Google, GitHub, etc.) - opcional
3. **Magic Links** - opcional

Vá em **Authentication** > **Providers** para configurar.

### 6. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env` ou `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

> ⚠️ **IMPORTANTE**: Obtenha as chaves reais em:
> - **Dashboard do Supabase**: https://supabase.com/dashboard → Settings → API
> - **Nunca commite estas chaves no repositório!** Use apenas em variáveis de ambiente ou arquivos `.env.local` (que devem estar no `.gitignore`)

## 📊 Estrutura do Banco de Dados

### Diagrama de Relacionamentos

```
profiles (users)
    ├── documents
    └── prompts
        ├── prompt_versions
        │   ├── chat_messages
        │   └── optimization_pairs
        ├── few_shot_examples
        ├── variaveis_dinamicas
        ├── ferramentas
        └── fluxos
```

### Tabelas Principais

#### `profiles`
- Armazena informações do perfil do usuário
- Vinculada ao `auth.users` do Supabase
- Criada automaticamente quando um usuário se registra

#### `prompts`
- Armazena os prompts principais criados pelo usuário
- Contém todos os dados do formulário de criação

#### `prompt_versions`
- Armazena versões geradas dos prompts
- Mantém histórico de todas as versões
- Contém o conteúdo final gerado

#### `chat_messages`
- Mensagens trocadas no chat com o agente
- Vinculadas a uma versão específica do prompt

#### `optimization_pairs`
- Pares de otimização (query original vs resposta corrigida)
- Usados para melhorar os prompts

## 🔒 Segurança (RLS)

Todas as tabelas possuem **Row Level Security (RLS)** habilitada:

- ✅ Usuários só podem ver seus próprios dados
- ✅ Usuários só podem inserir dados para si mesmos
- ✅ Usuários só podem atualizar seus próprios dados
- ✅ Usuários só podem deletar seus próprios dados

As políticas são aplicadas automaticamente via `auth.uid()`.

## 🔧 Funcionalidades Automáticas

### Triggers

1. **`handle_updated_at()`**: Atualiza automaticamente o campo `updated_at` em todas as tabelas
2. **`handle_new_user()`**: Cria automaticamente um perfil quando um novo usuário se registra

### Funções

1. **`get_latest_prompt_version(prompt_uuid)`**: Retorna a versão mais recente de um prompt

## 📝 Próximos Passos

1. **Instalar cliente Supabase no projeto**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Criar arquivo de configuração do Supabase**:
   ```typescript
   // lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. **Integrar autenticação nas páginas de Login e Register**

4. **Criar serviços para interagir com o banco de dados**

## 🐛 Troubleshooting

### Erro ao executar o script SQL

- Verifique se você tem permissões de administrador no projeto
- Certifique-se de que não há erros de sintaxe no SQL
- Execute o script em partes se necessário

### RLS bloqueando consultas

- Verifique se o usuário está autenticado (`auth.uid()` não é nulo)
- Verifique se as políticas RLS estão corretamente configuradas
- Use o Service Role Key apenas em funções server-side

### Trigger não cria perfil automaticamente

- Verifique se o trigger `on_auth_user_created` foi criado
- Verifique os logs do Supabase para erros
- Teste criando um novo usuário manualmente

## 📚 Recursos

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Cliente JavaScript](https://supabase.com/docs/reference/javascript/introduction)


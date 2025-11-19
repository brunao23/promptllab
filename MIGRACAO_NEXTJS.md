# 🚀 Migração Completa para Next.js - Status e Plano

## ✅ O Que Já Foi Feito

### 1. Configuração Base
- ✅ `package.json` atualizado para Next.js 15
- ✅ `next.config.js` criado com headers de segurança
- ✅ `tsconfig.json` atualizado para Next.js
- ✅ `middleware.ts` criado para autenticação
- ✅ Estrutura `lib/supabase/` criada (client.ts e server.ts)

### 2. Estrutura App Router
- ✅ `app/layout.tsx` - Layout principal
- ✅ `app/globals.css` - Estilos globais
- ✅ `app/page.tsx` - HomePage migrada

### 3. Dependências
- ✅ Removido: `react-router-dom`, `vite`, `@vitejs/plugin-react`
- ✅ Adicionado: `next`, `@supabase/ssr`
- ✅ Mantido: React 19, TypeScript, Tailwind CSS

## 🔄 O Que Precisa Ser Feito

### 1. Migrar Páginas para App Router

#### Páginas Públicas
- [ ] `app/login/page.tsx` - Migrar de `pages/Login.tsx`
- [ ] `app/register/page.tsx` - Migrar de `pages/Register.tsx`
- [ ] `app/auth/callback/page.tsx` - Migrar de `pages/AuthCallback.tsx`
- [ ] `app/chat/[versionId]/page.tsx` - Migrar de `pages/ShareChatPage.tsx`

#### Páginas Protegidas
- [ ] `app/dashboard/page.tsx` - Migrar de `pages/Dashboard.tsx`
- [ ] `app/dashboard/repository/page.tsx` - Migrar de `pages/RepositoryPage.tsx`
- [ ] `app/dashboard/settings/page.tsx` - Migrar de `pages/SettingsPage.tsx`
- [ ] `app/admin/page.tsx` - Migrar de `pages/AdminPage.tsx`

### 2. Atualizar Serviços

#### Supabase Service
- [ ] Criar `lib/supabaseService.ts` que usa `lib/supabase/client.ts` e `lib/supabase/server.ts`
- [ ] Substituir `import.meta.env.VITE_*` por `process.env.NEXT_PUBLIC_*`
- [ ] Adaptar funções para funcionar tanto no cliente quanto no servidor

#### Outros Serviços
- [ ] `services/geminiService.ts` - Atualizar para usar `process.env.GEMINI_API_KEY`
- [ ] `services/subscriptionService.ts` - Verificar compatibilidade
- [ ] Todos os outros serviços em `services/`

### 3. Migrar Componentes

Todos os componentes em `components/` precisam ser marcados como `'use client'` se usarem:
- Hooks do React (useState, useEffect, etc.)
- Event handlers
- Browser APIs

Componentes que podem ser Server Components:
- Componentes puramente de apresentação
- Componentes que só fazem fetch de dados

### 4. Atualizar Rotas e Navegação

- [ ] Substituir `react-router-dom` por `next/link` e `next/navigation`
- [ ] Substituir `useNavigate()` por `useRouter()` do Next.js
- [ ] Substituir `useLocation()` por `usePathname()` do Next.js
- [ ] Atualizar `ProtectedRoute` para usar middleware do Next.js

### 5. Variáveis de Ambiente

Atualizar na Vercel:
- ❌ `VITE_SUPABASE_URL` → ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `VITE_SUPABASE_ANON_KEY` → ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `GEMINI_API_KEY` (mantém igual)

### 6. Arquivos a Remover

Após migração completa:
- [ ] `vite.config.ts`
- [ ] `index.html`
- [ ] `index.tsx`
- [ ] `App.tsx`
- [ ] Pasta `pages/` (depois de migrar tudo)

### 7. Configuração Vercel

- [ ] Framework Preset: Mudar de "Vite" para "Next.js"
- [ ] Root Directory: Manter vazio (projeto na raiz)
- [ ] Build Command: Será detectado automaticamente (`next build`)
- [ ] Output Directory: Será detectado automaticamente (`.next`)

## 📋 Checklist de Migração por Página

### Login (`app/login/page.tsx`)
- [ ] Converter para Server/Client Component apropriado
- [ ] Substituir `useNavigate` por `useRouter` do Next.js
- [ ] Substituir `Link` do react-router por `Link` do Next.js
- [ ] Atualizar chamadas do Supabase para usar cliente do Next.js
- [ ] Testar autenticação

### Register (`app/register/page.tsx`)
- [ ] Mesmas mudanças do Login
- [ ] Testar registro e confirmação de email

### Dashboard (`app/dashboard/page.tsx`)
- [ ] Converter para Server Component (pode fazer fetch no servidor)
- [ ] Migrar `PromptManager` como Client Component
- [ ] Atualizar navegação

### Repository (`app/dashboard/repository/page.tsx`)
- [ ] Migrar lista de prompts
- [ ] Atualizar navegação para usar Next.js router
- [ ] Testar carregamento de prompts

### Settings (`app/dashboard/settings/page.tsx`)
- [ ] Migrar formulário de configurações
- [ ] Atualizar chamadas de API

### Admin (`app/admin/page.tsx`)
- [ ] Migrar painel administrativo
- [ ] Verificar permissões no middleware

### Share Chat (`app/chat/[versionId]/page.tsx`)
- [ ] Usar dynamic route `[versionId]`
- [ ] Migrar componente de chat compartilhado

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## ⚠️ Pontos de Atenção

1. **Server vs Client Components**
   - Componentes que usam hooks ou eventos devem ser Client Components (`'use client'`)
   - Componentes que só fazem fetch podem ser Server Components

2. **Supabase**
   - Usar `@supabase/ssr` para gerenciar cookies corretamente
   - Cliente do servidor: `lib/supabase/server.ts`
   - Cliente do browser: `lib/supabase/client.ts`

3. **Variáveis de Ambiente**
   - No Next.js, variáveis públicas devem ter prefixo `NEXT_PUBLIC_`
   - Variáveis privadas (server-only) não precisam do prefixo

4. **Rotas Dinâmicas**
   - `[versionId]` em vez de `:versionId`
   - Usar `useParams()` do Next.js

5. **Navegação**
   - `Link` do Next.js em vez de `Link` do react-router
   - `useRouter()` em vez de `useNavigate()`
   - `redirect()` para redirecionamentos no servidor

## 📝 Notas

- A migração está em andamento
- A estrutura base está pronta
- As páginas principais precisam ser migradas uma a uma
- Testar cada página após migração

## 🎯 Próximos Passos

1. Migrar página de Login
2. Migrar página de Register
3. Migrar Dashboard
4. Migrar demais páginas
5. Atualizar todos os serviços
6. Testar build completo
7. Atualizar variáveis de ambiente na Vercel
8. Fazer deploy de teste


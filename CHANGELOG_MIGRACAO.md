# 📝 Changelog da Migração para Next.js

## Data: 2024

### Mudanças Principais

#### Estrutura
- ✅ Migrado de Vite para Next.js 15
- ✅ Estrutura App Router implementada
- ✅ Middleware de autenticação criado

#### Páginas
- ✅ `app/page.tsx` - HomePage
- ✅ `app/login/page.tsx` - Login
- ✅ `app/register/page.tsx` - Register
- ✅ `app/auth/callback/page.tsx` - Auth Callback
- ✅ `app/dashboard/page.tsx` - Dashboard
- ✅ `app/dashboard/layout.tsx` - Layout do Dashboard
- ✅ `app/dashboard/repository/page.tsx` - Repository
- ✅ `app/dashboard/settings/page.tsx` - Settings
- ✅ `app/admin/page.tsx` - Admin
- ✅ `app/chat/[versionId]/page.tsx` - Share Chat (dynamic route)

#### Componentes Atualizados
- ✅ `components/Sidebar.tsx` - `useRouter`, `usePathname`
- ✅ `components/PromptManager.tsx` - `useSearchParams`
- ✅ `components/Header.tsx` - `useRouter`
- ✅ Todos os componentes com hooks marcados com `'use client'`

#### Serviços Atualizados
- ✅ `services/supabaseService.ts` - Suporta Next.js e Vite
- ✅ `services/bucketService.ts` - Suporta Next.js e Vite
- ✅ `services/geminiService.ts` - Suporta Next.js e Vite

#### Navegação
- ✅ `react-router-dom` → `next/navigation`
- ✅ `useNavigate` → `useRouter`
- ✅ `useLocation` → `usePathname`
- ✅ `Link` do react-router → `Link` do Next.js
- ✅ `location.state` → query params

#### Variáveis de Ambiente
- ✅ Suporte para `NEXT_PUBLIC_*` (Next.js)
- ✅ Compatibilidade com `VITE_*` (Vite) mantida
- ✅ Detecção automática do ambiente

### Arquivos Removidos/Obsoletos (Ainda presentes, mas não usados)
- ⚠️ `App.tsx` - Substituído por App Router
- ⚠️ `index.tsx` - Substituído por App Router
- ⚠️ `index.html` - Substituído por `app/layout.tsx`
- ⚠️ `vite.config.ts` - Não usado mais
- ⚠️ `components/ProtectedRoute.tsx` - Substituído por middleware

### Dependências

#### Removidas
- ❌ `react-router-dom`
- ❌ `vite`
- ❌ `@vitejs/plugin-react`

#### Adicionadas
- ✅ `next`
- ✅ `@supabase/ssr`

#### Mantidas
- ✅ `react` (19.0.0)
- ✅ `react-dom` (19.0.0)
- ✅ `@supabase/supabase-js`
- ✅ `@google/genai`
- ✅ Todas as outras dependências

### Breaking Changes

1. **Variáveis de Ambiente:**
   - Antes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Agora: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Navegação:**
   - Antes: `navigate('/path', { state: { data } })`
   - Agora: `router.push('/path?param=value')`

3. **Rotas Dinâmicas:**
   - Antes: `/chat/:versionId`
   - Agora: `/chat/[versionId]` (App Router)

4. **Componentes:**
   - Componentes com hooks precisam de `'use client'`

### Compatibilidade

O código mantém compatibilidade com Vite através de:
- Detecção automática de ambiente
- Suporte para ambas as formas de variáveis de ambiente
- Cliente Supabase compatível com ambos

### Próximos Passos

1. Atualizar variáveis de ambiente na Vercel
2. Mudar Framework Preset para "Next.js"
3. Fazer redeploy
4. Testar todas as funcionalidades
5. Remover arquivos obsoletos (opcional)


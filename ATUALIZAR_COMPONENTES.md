# 🔄 Atualizar Componentes para Next.js

## Componentes que Precisam de Atualização

### 1. Componentes que Usam `react-router-dom`

Estes componentes precisam ser atualizados para usar `next/navigation`:

#### `components/Sidebar.tsx`
- ❌ `useNavigate` → ✅ `useRouter` do Next.js
- ❌ `useLocation` → ✅ `usePathname` do Next.js
- ❌ `Link` do react-router → ✅ `Link` do Next.js
- Adicionar `'use client'` no topo

#### `components/PromptManager.tsx`
- ❌ `useLocation` → ✅ `usePathname` do Next.js
- ❌ `navigate('/dashboard', { state: { promptId } })` → ✅ Usar `router.push()` com query params ou cookies
- Adicionar `'use client'` no topo

#### `components/Header.tsx`
- ❌ `useNavigate` → ✅ `useRouter` do Next.js
- ❌ `Link` do react-router → ✅ `Link` do Next.js
- Adicionar `'use client'` no topo

#### `components/ProtectedRoute.tsx`
- ⚠️ **NÃO É NECESSÁRIO** - O middleware do Next.js já faz isso
- Pode ser removido ou adaptado como um componente wrapper

### 2. Páginas que Precisam de Ajustes

#### `pages/RepositoryPage.tsx`
- ❌ `useNavigate` → ✅ `useRouter` do Next.js
- ❌ `navigate('/dashboard', { state: { promptId } })` → ✅ Usar query params ou cookies
- Adicionar `'use client'` no topo

#### `pages/SettingsPage.tsx`
- ❌ `useNavigate` → ✅ `useRouter` do Next.js
- Adicionar `'use client'` no topo

#### `pages/AdminPage.tsx`
- ❌ `useNavigate` → ✅ `useRouter` do Next.js
- Adicionar `'use client'` no topo

#### `pages/ShareChatPage.tsx`
- ❌ `useParams` do react-router → ✅ `useParams` do Next.js (ou usar props)
- Adicionar `'use client'` no topo
- Ajustar para receber `versionId` como prop (já feito no route)

### 3. Serviços que Precisam de Atualização

#### `services/supabaseService.ts`
- ❌ `import.meta.env.VITE_SUPABASE_URL` → ✅ `process.env.NEXT_PUBLIC_SUPABASE_URL`
- ❌ `import.meta.env.VITE_SUPABASE_ANON_KEY` → ✅ `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Criar versões separadas para client e server quando necessário

#### `services/geminiService.ts`
- ❌ `process.env.GEMINI_API_KEY` ou `import.meta.env.GEMINI_API_KEY` → ✅ `process.env.GEMINI_API_KEY` (server) ou `process.env.NEXT_PUBLIC_GEMINI_API_KEY` (client)
- Verificar onde é usado (client ou server)

## 📋 Checklist de Atualização

### Componentes
- [ ] `components/Sidebar.tsx` - Atualizar navegação
- [ ] `components/PromptManager.tsx` - Atualizar navegação e location
- [ ] `components/Header.tsx` - Atualizar navegação
- [ ] `components/ProtectedRoute.tsx` - Remover ou adaptar
- [ ] Todos os outros componentes - Adicionar `'use client'` se necessário

### Páginas
- [ ] `pages/RepositoryPage.tsx` - Atualizar navegação
- [ ] `pages/SettingsPage.tsx` - Atualizar navegação
- [ ] `pages/AdminPage.tsx` - Atualizar navegação
- [ ] `pages/ShareChatPage.tsx` - Atualizar params

### Serviços
- [ ] `services/supabaseService.ts` - Atualizar variáveis de ambiente
- [ ] `services/geminiService.ts` - Atualizar variáveis de ambiente
- [ ] Verificar outros serviços

## 🔧 Exemplos de Conversão

### useNavigate → useRouter
```typescript
// Antes (React Router)
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');

// Depois (Next.js)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

### useLocation → usePathname
```typescript
// Antes (React Router)
import { useLocation } from 'react-router-dom';
const location = useLocation();
const path = location.pathname;

// Depois (Next.js)
import { usePathname } from 'next/navigation';
const pathname = usePathname();
```

### Link
```typescript
// Antes (React Router)
import { Link } from 'react-router-dom';
<Link to="/dashboard">Dashboard</Link>

// Depois (Next.js)
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
```

### useParams
```typescript
// Antes (React Router)
import { useParams } from 'react-router-dom';
const { versionId } = useParams<{ versionId: string }>();

// Depois (Next.js)
// Em page.tsx, recebe como prop:
export default function Page({ params }: { params: { versionId: string } }) {
  const { versionId } = params;
}
```

### State Navigation
```typescript
// Antes (React Router)
navigate('/dashboard', { state: { promptId: '123' } });

// Depois (Next.js)
// Opção 1: Query params
router.push(`/dashboard?promptId=123`);

// Opção 2: Cookies (para dados sensíveis)
// Usar cookies do Next.js

// Opção 3: Context/State Management
// Usar Context API ou Zustand/Redux
```


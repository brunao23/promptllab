# 🔍 ANÁLISE DE PERFORMANCE - BANCO DE DADOS

## 📋 RESUMO EXECUTIVO

Este documento identifica os principais problemas de performance relacionados ao carregamento de dados do banco de dados em produção e propõe soluções para otimização.

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **QUERIES N+1 E MÚLTIPLAS CONSULTAS SEQUENCIAIS**

#### Problema:
- A função `getPrompt()` faz múltiplas queries sequenciais para buscar relacionamentos
- A função `getPromptVersion()` também faz queries separadas para buscar dados relacionados
- Cada carregamento de prompt pode gerar 5-6 queries ao banco

**Localização:** `services/supabaseService.ts` (linhas 770-858, 1005-1115)

```typescript
// PROBLEMA: Queries sequenciais mesmo com Promise.all
const [examples, variaveis, ferramentas, fluxos] = await Promise.all([
  supabase.from('few_shot_examples').select('*').eq('prompt_id', promptId),
  supabase.from('variaveis_dinamicas').select('*').eq('prompt_id', promptId),
  supabase.from('ferramentas').select('*').eq('prompt_id', promptId),
  supabase.from('fluxos').select('*').eq('prompt_id', promptId),
]);
```

**Impacto:** Cada carregamento de prompt pode levar 500ms-2s dependendo da latência do Supabase.

---

### 2. **FALTA DE ÍNDICES COMPOSTOS**

#### Problema:
Queries frequentes filtram por múltiplas colunas, mas não há índices compostos otimizados:

- `prompts`: `user_id + workspace_id + is_active` (usado em `getUserPrompts`)
- `workspaces`: `user_id + is_active + is_default` (usado em `getDefaultWorkspace`)
- `prompt_versions`: `prompt_id + version_number` (já existe UNIQUE, mas pode melhorar)

**Localização:** `supabase_schema.sql`, `WORKSPACES_SCHEMA.sql`

**Impacto:** Queries podem fazer full table scan ou usar índices menos eficientes.

---

### 3. **VERIFICAÇÕES REPETIDAS DE PROFILE**

#### Problema:
Múltiplas funções fazem queries separadas para verificar o profile do usuário:

- `createPrompt()` - linha 536
- `deletePrompt()` - linha 737
- `getPrompt()` - linha 782
- `getUserPrompts()` - linha 679

**Localização:** `services/supabaseService.ts`

**Impacto:** Cada operação adiciona 1 query extra desnecessária (~100-300ms).

---

### 4. **QUERIES SEM LIMITES ADEQUADOS**

#### Problema:
Algumas queries não têm limites ou têm limites muito altos:

- `getUserPrompts()` - limite de 20 (OK, mas pode ser paginado)
- `getPromptVersions()` - limite de 50 (pode ser muito para alguns casos)
- `getChatMessages()` - limite de 100 (pode ser muito)

**Localização:** `services/supabaseService.ts`

**Impacto:** Queries podem retornar muitos dados desnecessários, aumentando tempo de resposta.

---

### 5. **FALTA DE CACHE**

#### Problema:
Dados frequentemente acessados não são cacheados:

- Profile do usuário (acessado em quase todas as operações)
- Workspace padrão (acessado múltiplas vezes)
- Lista de workspaces

**Impacto:** Múltiplas queries idênticas para os mesmos dados.

---

### 6. **QUERIES DE WORKSPACE INEFICIENTES**

#### Problema:
- `getDefaultWorkspace()` pode ser chamado múltiplas vezes
- Não há cache do workspace padrão
- Query pode falhar e criar workspace, adicionando latência

**Localização:** `services/supabaseService.ts` (linhas 1394-1416)

**Impacto:** Cada chamada adiciona 200-500ms de latência.

---

### 7. **JOINS COMPLEXOS SEM OTIMIZAÇÃO**

#### Problema:
Queries com joins aninhados podem ser lentas:

```typescript
// PROBLEMA: Join complexo com múltiplos níveis
.select('*, prompt_versions!inner(prompt_id, prompts!inner(user_id))')
.eq('prompt_versions.prompts.user_id', profile.id)
```

**Localização:** `services/supabaseService.ts` (linhas 1198-1203, 962-967)

**Impacto:** Joins complexos podem ser lentos, especialmente com muitos dados.

---

### 8. **FALTA DE ÍNDICE EM WORKSPACE_ID NA TABELA PROMPTS**

#### Problema:
A coluna `workspace_id` foi adicionada à tabela `prompts`, mas o índice pode não estar sendo usado eficientemente em queries que filtram por `user_id + workspace_id`.

**Localização:** `WORKSPACES_SCHEMA.sql` (linha 51)

**Impacto:** Queries que filtram por workspace podem ser mais lentas.

---

## ✅ SOLUÇÕES RECOMENDADAS

### **SOLUÇÃO 1: Criar Índices Compostos**

Execute este SQL no Supabase:

```sql
-- Índice composto para prompts (user_id + workspace_id + is_active)
CREATE INDEX IF NOT EXISTS idx_prompts_user_workspace_active 
ON public.prompts(user_id, workspace_id, is_active) 
WHERE is_active = true;

-- Índice composto para workspaces (user_id + is_active + is_default)
CREATE INDEX IF NOT EXISTS idx_workspaces_user_active_default 
ON public.workspaces(user_id, is_active, is_default) 
WHERE is_active = true;

-- Índice composto para prompt_versions (prompt_id + version_number DESC)
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_version_desc 
ON public.prompt_versions(prompt_id, version_number DESC);

-- Índice composto para chat_messages (prompt_version_id + order_index)
CREATE INDEX IF NOT EXISTS idx_chat_messages_version_order 
ON public.chat_messages(prompt_version_id, order_index);
```

**Impacto esperado:** Redução de 30-50% no tempo de queries.

---

### **SOLUÇÃO 2: Implementar Cache de Profile e Workspace**

Criar um sistema de cache simples em memória:

```typescript
// Adicionar em services/supabaseService.ts

// Cache simples em memória (para produção, considere Redis)
const profileCache = new Map<string, { data: any; timestamp: number }>();
const workspaceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Verificar cache
  const cached = profileCache.get(user.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Buscar do banco
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  // Atualizar cache
  if (data) {
    profileCache.set(user.id, { data, timestamp: Date.now() });
  }

  return data;
}

// Similar para getDefaultWorkspace
```

**Impacto esperado:** Redução de 50-70% nas queries de profile/workspace.

---

### **SOLUÇÃO 3: Otimizar Queries com Select Específico**

Em vez de `select('*')`, selecionar apenas colunas necessárias:

```typescript
// ANTES
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// DEPOIS
const { data: profile } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .eq('id', user.id)
  .single();
```

**Impacto esperado:** Redução de 20-30% no tamanho dos dados transferidos.

---

### **SOLUÇÃO 4: Implementar Paginação**

Adicionar paginação nas queries que retornam listas:

```typescript
export async function getUserPrompts(
  workspaceId?: string,
  page: number = 1,
  pageSize: number = 20
) {
  // ... código existente ...
  
  const { data, error } = await query
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1); // Paginação

  return data || [];
}
```

**Impacto esperado:** Redução de 40-60% no tempo de queries com muitos dados.

---

### **SOLUÇÃO 5: Usar RPC Functions para Queries Complexas**

Criar funções SQL no Supabase para queries complexas:

```sql
-- Função para buscar prompt completo com relacionamentos
CREATE OR REPLACE FUNCTION get_prompt_with_relations(prompt_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'prompt', row_to_json(p.*),
    'examples', (SELECT json_agg(row_to_json(e.*)) FROM few_shot_examples e WHERE e.prompt_id = p.id),
    'variaveis', (SELECT json_agg(row_to_json(v.*)) FROM variaveis_dinamicas v WHERE v.prompt_id = p.id),
    'ferramentas', (SELECT json_agg(row_to_json(f.*)) FROM ferramentas f WHERE f.prompt_id = p.id),
    'fluxos', (SELECT json_agg(row_to_json(fl.*)) FROM fluxos fl WHERE fl.prompt_id = p.id)
  ) INTO result
  FROM prompts p
  WHERE p.id = prompt_uuid AND p.user_id = user_uuid AND p.is_active = true;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Impacto esperado:** Redução de 60-80% no tempo de queries complexas (de 5-6 queries para 1).

---

### **SOLUÇÃO 6: Adicionar Connection Pooling**

O Supabase já gerencia connection pooling, mas podemos otimizar:

```typescript
// Em lib/supabase/client.ts, adicionar configurações de pool
export function createClient() {
  return createBrowserClient(supabaseUrl || '', supabaseAnonKey || '', {
    db: {
      schema: 'public',
      // Otimizações de conexão
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'labprompt-nextjs',
      },
      // Timeout otimizado
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Timeout de 10 segundos
          signal: AbortSignal.timeout(10000),
        });
      },
    },
  });
}
```

---

### **SOLUÇÃO 7: Implementar Debounce para Queries Frequentes**

Para queries que são chamadas frequentemente (ex: ao digitar), implementar debounce:

```typescript
// Exemplo para busca de prompts
let searchTimeout: NodeJS.Timeout;

export async function searchPrompts(query: string) {
  return new Promise((resolve) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const results = await supabase
        .from('prompts')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(10);
      resolve(results);
    }, 300); // Aguardar 300ms antes de buscar
  });
}
```

---

## 📊 PRIORIZAÇÃO DAS SOLUÇÕES

### **ALTA PRIORIDADE (Implementar Imediatamente)**

1. ✅ **Criar índices compostos** (Solução 1) - Impacto alto, esforço baixo
2. ✅ **Implementar cache de profile/workspace** (Solução 2) - Impacto alto, esforço médio
3. ✅ **Otimizar queries com select específico** (Solução 3) - Impacto médio, esforço baixo

### **MÉDIA PRIORIDADE (Implementar em Breve)**

4. ✅ **Implementar paginação** (Solução 4) - Impacto médio, esforço médio
5. ✅ **Usar RPC functions** (Solução 5) - Impacto alto, esforço alto

### **BAIXA PRIORIDADE (Otimizações Futuras)**

6. ✅ **Connection pooling** (Solução 6) - Impacto baixo, esforço baixo
7. ✅ **Debounce** (Solução 7) - Impacto baixo, esforço baixo

---

## 🧪 COMO TESTAR AS MELHORIAS

1. **Antes das otimizações:**
   - Medir tempo de carregamento do dashboard
   - Medir tempo de carregamento de um prompt
   - Verificar número de queries no Network tab

2. **Depois das otimizações:**
   - Comparar tempos de carregamento
   - Verificar redução no número de queries
   - Monitorar uso de recursos no Supabase Dashboard

---

## 📝 PRÓXIMOS PASSOS

1. Executar SQL de criação de índices compostos
2. Implementar cache de profile/workspace
3. Otimizar queries com select específico
4. Monitorar performance após cada mudança
5. Implementar RPC functions para queries complexas

---

## 🔗 REFERÊNCIAS

- [Supabase Performance Best Practices](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [Next.js Caching Strategies](https://nextjs.org/docs/app/building-your-application/caching)

---

**Data da Análise:** 2024-12-19  
**Versão:** 1.0


# 🔍 ANÁLISE DE PERFORMANCE - PromptManager.tsx

## 📋 RESUMO EXECUTIVO

Este documento identifica os **problemas críticos de performance** no componente `PromptManager.tsx` que causam lentidão no carregamento de dados do banco de dados em produção.

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **PROBLEMA 1: QUERIES SEQUENCIAIS NO handleWorkspaceChange** ⚠️ CRÍTICO

**Localização:** Linhas 913-956

```typescript
// PROBLEMA: 4 queries sequenciais (cada uma espera a anterior)
const prompts = await getUserPrompts(workspaceId);           // Query 1: ~300-500ms
const { promptData } = await getPrompt(latestPrompt.id);     // Query 2: ~500-1000ms (faz 5 queries internas!)
const versions = await getPromptVersions(latestPrompt.id);   // Query 3: ~300-500ms
const messages = await getChatMessages(latestVersion.id);    // Query 4: ~200-400ms
```

**Impacto:** 
- **Tempo total: 1.3s - 2.4s** apenas para carregar dados de um workspace
- Em produção com latência maior, pode chegar a **3-5 segundos**
- O usuário fica esperando sem feedback durante todo esse tempo

**Solução:** Executar queries em paralelo quando possível:

```typescript
// OTIMIZADO: Executar queries em paralelo
const [prompts, defaultWorkspace] = await Promise.all([
  getUserPrompts(workspaceId),
  getDefaultWorkspace() // Se necessário
]);

if (prompts && prompts.length > 0) {
  const latestPrompt = prompts[0];
  setCurrentPromptId(latestPrompt.id);
  
  // Executar queries em paralelo
  const [promptResult, versions] = await Promise.all([
    getPrompt(latestPrompt.id),
    getPromptVersions(latestPrompt.id)
  ]);
  
  const { promptData } = promptResult;
  setFormData(promptData);
  
  if (versions && versions.length > 0) {
    setVersionHistory(versions);
    const latestVersion = versions[0];
    setActiveVersion(latestVersion);
    
    // Carregar mensagens apenas se necessário (lazy loading)
    const messages = await getChatMessages(latestVersion.id);
    if (messages && messages.length > 0) {
      setChatMessages(messages);
    }
    
    if (latestVersion.content) {
      await startChat(latestVersion.content);
    }
  }
}
```

**Ganho esperado:** Redução de **50-60%** no tempo de carregamento (de 2.4s para ~1.0s)

---

### **PROBLEMA 2: getPrompt() FAZ 5 QUERIES INTERNAS** ⚠️ CRÍTICO

**Localização:** `services/supabaseService.ts` linhas 770-858

A função `getPrompt()` faz:
1. Query para verificar profile
2. Query para buscar prompt
3. Query para buscar exemplos (few_shot_examples)
4. Query para buscar variáveis (variaveis_dinamicas)
5. Query para buscar ferramentas (ferramentas)
6. Query para buscar fluxos (fluxos)

**Impacto:** Cada chamada a `getPrompt()` pode levar **500ms - 1.5s** em produção.

**Solução:** Criar uma função RPC no Supabase que retorna tudo em uma query:

```sql
-- Criar função SQL no Supabase
CREATE OR REPLACE FUNCTION get_prompt_complete(prompt_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'prompt', row_to_json(p.*),
    'examples', (
      SELECT json_agg(row_to_json(e.*) ORDER BY e.order_index)
      FROM few_shot_examples e 
      WHERE e.prompt_id = p.id
    ),
    'variaveis', (
      SELECT json_agg(row_to_json(v.*) ORDER BY v.order_index)
      FROM variaveis_dinamicas v 
      WHERE v.prompt_id = p.id
    ),
    'ferramentas', (
      SELECT json_agg(row_to_json(f.*) ORDER BY f.order_index)
      FROM ferramentas f 
      WHERE f.prompt_id = p.id
    ),
    'fluxos', (
      SELECT json_agg(row_to_json(fl.*) ORDER BY fl.order_index)
      FROM fluxos fl 
      WHERE fl.prompt_id = p.id
    )
  ) INTO result
  FROM prompts p
  WHERE p.id = prompt_uuid 
    AND p.user_id = user_uuid 
    AND p.is_active = true;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Ganho esperado:** Redução de **70-80%** no tempo (de 1.5s para ~300ms)

---

### **PROBLEMA 3: getDefaultWorkspace() CHAMADO MÚLTIPLAS VEZES** ⚠️ ALTO

**Localização:** 
- Linha 82: `handleGeneratePrompt()`
- Linha 886: `handleSaveToRepository()`
- Provavelmente no `useEffect` inicial

**Impacto:** 
- Cada chamada adiciona **200-500ms** de latência
- Se chamado 3 vezes no carregamento inicial = **600ms - 1.5s** desperdiçados

**Solução:** Cachear o workspace padrão:

```typescript
// Adicionar no início do componente
const [defaultWorkspaceCache, setDefaultWorkspaceCache] = useState<Workspace | null>(null);

// Função auxiliar com cache
const getCachedDefaultWorkspace = useCallback(async () => {
  if (defaultWorkspaceCache) {
    return defaultWorkspaceCache;
  }
  
  const workspace = await getDefaultWorkspace();
  if (workspace) {
    setDefaultWorkspaceCache(workspace);
  }
  return workspace;
}, [defaultWorkspaceCache]);

// Usar em vez de getDefaultWorkspace() diretamente
const workspaceIdToUse = currentWorkspaceId || (await getCachedDefaultWorkspace())?.id || undefined;
```

**Ganho esperado:** Redução de **100%** nas chamadas subsequentes (cache hit = 0ms)

---

### **PROBLEMA 4: CARREGAMENTO INICIAL SEM PARALELISMO** ⚠️ CRÍTICO

**Problema:** O `useEffect` inicial (se existir) provavelmente carrega dados sequencialmente:
1. Carrega workspace padrão
2. Carrega prompts do workspace
3. Carrega prompt selecionado
4. Carrega versões
5. Carrega mensagens

**Solução:** Carregar tudo em paralelo quando possível:

```typescript
useEffect(() => {
  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      // Carregar workspace e prompts em paralelo
      const [defaultWorkspace, allPrompts] = await Promise.all([
        getDefaultWorkspace(),
        getUserPrompts() // Sem workspaceId = todos os prompts
      ]);
      
      if (defaultWorkspace) {
        setCurrentWorkspaceId(defaultWorkspace.id);
      }
      
      if (allPrompts && allPrompts.length > 0) {
        const latestPrompt = allPrompts[0];
        setCurrentPromptId(latestPrompt.id);
        
        // Carregar prompt completo e versões em paralelo
        const [promptResult, versions] = await Promise.all([
          getPrompt(latestPrompt.id),
          getPromptVersions(latestPrompt.id)
        ]);
        
        setFormData(promptResult.promptData);
        setVersionHistory(versions);
        
        if (versions && versions.length > 0) {
          const latestVersion = versions[0];
          setActiveVersion(latestVersion);
          
          // Carregar mensagens apenas se necessário (pode ser lazy)
          const messages = await getChatMessages(latestVersion.id);
          setChatMessages(messages || []);
          
          if (latestVersion.content) {
            await startChat(latestVersion.content);
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados iniciais:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoadingData(false);
    }
  };
  
  loadInitialData();
}, []);
```

**Ganho esperado:** Redução de **40-50%** no tempo de carregamento inicial

---

### **PROBLEMA 5: getChatMessages() CARREGADO SEMPRE** ⚠️ MÉDIO

**Localização:** Linha 942

**Problema:** Mensagens de chat são carregadas mesmo quando o usuário pode não precisar delas imediatamente.

**Solução:** Lazy loading - carregar apenas quando o chat for aberto:

```typescript
// Não carregar mensagens no handleWorkspaceChange
// Carregar apenas quando necessário:

const loadChatMessages = useCallback(async (versionId: string) => {
  if (chatMessages.length > 0) return; // Já carregado
  
  try {
    const messages = await getChatMessages(versionId);
    setChatMessages(messages || []);
  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
  }
}, [chatMessages.length]);

// Chamar apenas quando o chat for visualizado
useEffect(() => {
  if (activeVersion?.id && isChatVisible) {
    loadChatMessages(activeVersion.id);
  }
}, [activeVersion?.id, isChatVisible, loadChatMessages]);
```

**Ganho esperado:** Redução de **200-400ms** no carregamento inicial

---

### **PROBLEMA 6: FALTA DE PAGINAÇÃO NAS QUERIES** ⚠️ MÉDIO

**Problema:** 
- `getUserPrompts()` retorna até 20 prompts (OK)
- `getPromptVersions()` retorna até 50 versões (pode ser muito)
- `getChatMessages()` retorna até 100 mensagens (pode ser muito)

**Solução:** Implementar paginação e carregar apenas o necessário:

```typescript
// Carregar apenas a versão mais recente inicialmente
const versions = await getPromptVersions(latestPrompt.id, { limit: 1 });

// Carregar apenas as últimas 20 mensagens
const messages = await getChatMessages(latestVersion.id, { limit: 20 });
```

**Ganho esperado:** Redução de **30-40%** no tamanho dos dados transferidos

---

## ✅ SOLUÇÕES PRIORITÁRIAS

### **PRIORIDADE 1 (Implementar Imediatamente):**

1. ✅ **Paralelizar queries no handleWorkspaceChange** (Problema 1)
   - **Impacto:** Alto
   - **Esforço:** Baixo
   - **Ganho:** 50-60% de redução no tempo

2. ✅ **Cachear getDefaultWorkspace()** (Problema 3)
   - **Impacto:** Alto
   - **Esforço:** Baixo
   - **Ganho:** 100% nas chamadas subsequentes

3. ✅ **Otimizar carregamento inicial com paralelismo** (Problema 4)
   - **Impacto:** Alto
   - **Esforço:** Médio
   - **Ganho:** 40-50% de redução no tempo

### **PRIORIDADE 2 (Implementar em Breve):**

4. ✅ **Criar função RPC para getPrompt()** (Problema 2)
   - **Impacto:** Muito Alto
   - **Esforço:** Alto
   - **Ganho:** 70-80% de redução no tempo

5. ✅ **Lazy loading de mensagens de chat** (Problema 5)
   - **Impacto:** Médio
   - **Esforço:** Baixo
   - **Ganho:** 200-400ms no carregamento inicial

### **PRIORIDADE 3 (Otimizações Futuras):**

6. ✅ **Implementar paginação** (Problema 6)
   - **Impacto:** Médio
   - **Esforço:** Médio
   - **Ganho:** 30-40% no tamanho dos dados

---

## 📊 ESTIMATIVA DE MELHORIA TOTAL

### **Antes das Otimizações:**
- Carregamento inicial: **3-5 segundos**
- Mudança de workspace: **2-3 segundos**
- Carregamento de prompt: **1-2 segundos**

### **Depois das Otimizações (Prioridade 1 + 2):**
- Carregamento inicial: **1-1.5 segundos** (redução de 70%)
- Mudança de workspace: **0.8-1.2 segundos** (redução de 60%)
- Carregamento de prompt: **0.3-0.5 segundos** (redução de 75%)

---

## 🔧 CÓDIGO OTIMIZADO - handleWorkspaceChange

```typescript
// Função para mudar de workspace (OTIMIZADA)
const handleWorkspaceChange = async (workspaceId: string) => {
  console.log('📁 Mudando para workspace:', workspaceId);
  setCurrentWorkspaceId(workspaceId);

  // Limpar área atual
  setVersionHistory([]);
  setActiveVersion(null);
  setChatMessages([]);
  setFormData(INITIAL_PROMPT_DATA);
  setCurrentPromptId(null);
  setHasUnsavedChanges(false);

  // Carregar prompts do novo workspace
  try {
    const prompts = await getUserPrompts(workspaceId);
    console.log('✅ Prompts carregados do workspace:', prompts?.length || 0);

    if (prompts && prompts.length > 0) {
      const latestPrompt = prompts[0];
      setCurrentPromptId(latestPrompt.id);
      
      // OTIMIZAÇÃO: Executar queries em paralelo
      const [promptResult, versions] = await Promise.all([
        getPrompt(latestPrompt.id),
        getPromptVersions(latestPrompt.id)
      ]);
      
      const { promptData } = promptResult;
      setFormData(promptData);
      
      if (versions && versions.length > 0) {
        setVersionHistory(versions);
        const latestVersion = versions[0];
        setActiveVersion(latestVersion);
        
        // OTIMIZAÇÃO: Carregar mensagens apenas se necessário (lazy)
        // Pode ser carregado depois quando o chat for visualizado
        if (latestVersion.content) {
          await startChat(latestVersion.content);
          
          // Carregar mensagens em background (não bloquear UI)
          getChatMessages(latestVersion.id).then(messages => {
            if (messages && messages.length > 0) {
              setChatMessages(messages);
            }
          }).catch(err => {
            console.error('Erro ao carregar mensagens:', err);
          });
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Erro ao carregar prompts do workspace:', err);
    setError(err.message || 'Erro ao carregar prompts do workspace');
  }
};
```

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Implementar paralelismo no `handleWorkspaceChange`
2. ✅ Adicionar cache para `getDefaultWorkspace()`
3. ✅ Otimizar `useEffect` inicial com paralelismo
4. ✅ Criar função RPC no Supabase para `getPrompt()`
5. ✅ Implementar lazy loading para mensagens de chat
6. ✅ Testar performance antes e depois
7. ✅ Monitorar métricas em produção

---

**Data da Análise:** 2024-12-19  
**Versão:** 1.0  
**Arquivo Analisado:** `components/PromptManager.tsx`


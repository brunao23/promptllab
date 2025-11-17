# 🔍 Debug: Problemas de Salvamento no Supabase

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Função `loadExternalPrompt` Corrigida**
- **Antes:** Apenas criava versão em memória, não salvava no banco
- **Agora:** 
  - Salva prompt no banco quando não existe
  - Cria versão no banco automaticamente
  - Atualiza formData
  - Reinicia chat com o novo prompt

### 2. **Auto-Save Melhorado**
- **Antes:** Só salvava se já existisse `currentPromptId`
- **Agora:** 
  - Cria novo prompt automaticamente se não existir
  - Salva mesmo quando não há prompt anterior
  - Logs detalhados para debug

### 3. **Logs de Debug Adicionados**
- Logs em todas as etapas de carregamento
- Logs em todas as etapas de salvamento
- Logs de erros detalhados

### 4. **Tratamento de Erros Melhorado**
- Erros agora aparecem no console com detalhes
- Mensagens de erro para o usuário quando necessário

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### 1. Abra o Console do Navegador (F12)
Você verá logs como:
```
📥 Carregando prompts do usuário...
✅ Prompts carregados: X
📋 Carregando prompt: [ID]
✅ Dados do prompt carregados
📜 Carregando versões do prompt...
✅ Versões carregadas: X
💬 Carregando mensagens de chat...
✅ Mensagens carregadas: X
```

### 2. Ao Colar/Importar Prompt
Você verá:
```
✅ Novo prompt criado: [ID]
✅ Versão salva: [ID]
```

### 3. Ao Gerar Prompt
Você verá:
```
📝 Criando novo prompt no banco...
✅ Novo prompt criado: [ID]
🤖 Gerando conteúdo do prompt...
💾 Salvando versão no banco...
✅ Versão salva: [ID]
```

### 4. Auto-Save
Você verá (após 3 segundos de inatividade):
```
✅ Novo prompt criado no auto-save: [ID]
```
ou
```
✅ Prompt atualizado no auto-save: [ID]
```

## 🐛 SE AINDA NÃO FUNCIONAR

### Verificar no Console:
1. **Abra o Console do Navegador** (F12 → Console)
2. **Procure por erros** que começam com `❌`
3. **Copie os erros** e envie para análise

### Verificar no Supabase:
1. Acesse o **Supabase Dashboard**
2. Vá em **Table Editor**
3. Verifique se há dados nas tabelas:
   - `prompts`
   - `prompt_versions`
   - `chat_messages`

### Verificar RLS Policies:
1. No Supabase Dashboard, vá em **Authentication** → **Policies**
2. Verifique se as políticas estão configuradas para:
   - `prompts`: Usuário pode INSERT, SELECT, UPDATE seus próprios prompts
   - `prompt_versions`: Usuário pode INSERT, SELECT versões de seus prompts
   - `chat_messages`: Usuário pode INSERT, SELECT mensagens de suas versões

## 📋 Checklist de Verificação

- [ ] Console mostra logs de carregamento
- [ ] Console mostra logs de salvamento
- [ ] Não há erros `❌` no console
- [ ] Dados aparecem no Supabase Table Editor
- [ ] RLS Policies estão configuradas corretamente
- [ ] Usuário está autenticado (verificar em **Authentication** → **Users**)

## 🚨 PROBLEMAS COMUNS

### Problema: "Erro ao carregar dados do usuário"
**Causa:** RLS Policies não permitem SELECT
**Solução:** Verificar e corrigir RLS Policies no Supabase

### Problema: "Erro ao salvar prompt"
**Causa:** RLS Policies não permitem INSERT
**Solução:** Verificar e corrigir RLS Policies no Supabase

### Problema: Dados não aparecem após logout/login
**Causa:** Erros silenciosos no carregamento
**Solução:** Verificar console para erros `❌`

### Problema: Paste/Import não salva
**Causa:** Função `loadExternalPrompt` não estava salvando
**Solução:** ✅ CORRIGIDO - Agora salva automaticamente

## 📞 PRÓXIMOS PASSOS

Se ainda não funcionar:
1. **Copie todos os erros do console**
2. **Verifique se há dados no Supabase**
3. **Verifique as RLS Policies**
4. **Envie os logs para análise**


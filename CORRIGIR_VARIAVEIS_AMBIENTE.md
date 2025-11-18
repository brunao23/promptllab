# 🔧 CORREÇÃO CRÍTICA: Variáveis de Ambiente

## ❌ PROBLEMA IDENTIFICADO

O projeto está usando **Vite**, não Next.js. Por isso, as variáveis de ambiente devem ter o prefixo `VITE_`, não `NEXT_PUBLIC_`.

## ✅ CORREÇÃO APLICADA

### 1. Arquivo `.env` Atualizado

**ANTES (ERRADO):**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**AGORA (CORRETO):**
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui

> ⚠️ **IMPORTANTE**: Obtenha as chaves reais em: https://supabase.com/dashboard → Settings → API
```

### 2. Logs de Debug Adicionados

Agora todas as operações de salvamento têm logs detalhados:

- `💾 Tentando salvar prompt no banco...`
- `✅ Prompt salvo com sucesso no banco: [ID]`
- `❌ ERRO ao salvar prompt no banco:` (com detalhes completos)

### 3. Tratamento de Erros Melhorado

Erros agora mostram:
- Mensagem de erro
- Detalhes
- Dica (hint)
- Código de erro

## 🔍 COMO VERIFICAR

### 1. Verificar Console do Navegador (F12)

Ao gerar um prompt, você deve ver:

```
📝 Criando novo prompt no banco...
💾 Tentando salvar prompt no banco...
✅ Prompt salvo com sucesso no banco: [ID]
💾 Salvando versão no banco...
💾 Tentando salvar versão no banco...
✅ Versão salva com sucesso no banco: [ID]
```

### 2. Se Houver Erro

Você verá:

```
❌ ERRO ao salvar prompt no banco: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

### 3. Verificar Variáveis de Ambiente

No console do navegador, verifique se aparece:

```
✅ Supabase configurado: {
  url: "https://zmagqrcymbletqymclig.supabase.co",
  hasKey: true
}
```

## 🚨 SE AINDA NÃO FUNCIONAR

### Verificar RLS Policies no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Policies**
3. Verifique se as políticas estão permitindo:
   - **INSERT** para `prompts`
   - **INSERT** para `prompt_versions`
   - **INSERT** para `chat_messages`
   - **SELECT** para todas as tabelas

### Verificar Erros no Console

1. Abra o Console (F12)
2. Procure por erros que começam com `❌`
3. Copie o erro completo
4. Verifique o código de erro (ex: `42501` = permissão negada)

### Verificar Tabelas no Supabase

1. Acesse **Table Editor** no Supabase
2. Verifique se as tabelas existem:
   - `prompts`
   - `prompt_versions`
   - `chat_messages`
   - `few_shot_examples`
   - etc.

## 📋 CHECKLIST

- [ ] Arquivo `.env` atualizado com `VITE_` prefixo
- [ ] Console mostra "✅ Supabase configurado"
- [ ] Ao gerar prompt, aparecem logs de salvamento
- [ ] Se houver erro, aparece erro detalhado no console
- [ ] RLS Policies permitem INSERT/SELECT
- [ ] Tabelas existem no Supabase

## 🎯 PRÓXIMOS PASSOS

1. **Teste gerar um prompt** e veja os logs no console
2. **Se aparecer erro**, copie o erro completo e verifique:
   - Se as RLS Policies estão corretas
   - Se as tabelas existem
   - Se o usuário está autenticado
3. **Se funcionar**, os dados aparecerão no Supabase Table Editor


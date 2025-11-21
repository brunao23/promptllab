# 🔑 Como Configurar API Key

## ✅ O SISTEMA ESTÁ FUNCIONANDO!

O erro "API_KEY não configurada" é **normal** e esperado. Você só precisa adicionar sua chave da API.

---

## 📋 Duas Opções de Configuração

### Opção 1: API Key Individual (RECOMENDADO para usuários)

Cada usuário pode adicionar sua própria API Key:

1. **No site, clique em "Configurações"** (menu lateral esquerdo)
2. Vá para a seção **"Chaves de API"**
3. Clique em **"Adicionar Nova Chave"**
4. Escolha o provedor: **Google Gemini** ou **OpenAI**
5. Cole sua API Key
6. Clique em **"Salvar"**

#### Como obter a chave:
- **Google Gemini (GRÁTIS)**: https://aistudio.google.com/app/apikey
- **OpenAI (PAGO)**: https://platform.openai.com/api-keys

---

### Opção 2: API Key Global do Sistema (ADMIN)

Como você é ADMIN, pode configurar uma chave global que todos os usuários usarão:

#### Na Vercel (Produção):

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **labprompt**
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Nome**: `GEMINI_API_KEY`
   - **Valor**: Sua chave do Google Gemini
   - **Ambiente**: Production, Preview, Development (marcar todos)
5. Clique em **Save**
6. **Redeploy** o projeto (aba Deployments → ... → Redeploy)

#### Localmente (Desenvolvimento):

1. Crie um arquivo `.env.local` na pasta `labprompt/`
2. Adicione:
   ```
   GEMINI_API_KEY=sua-chave-aqui
   ```
3. Reinicie o servidor: `npm run dev`

---

## 🎯 Qual opção escolher?

| Opção | Vantagem | Desvantagem |
|-------|----------|-------------|
| **Individual** | Cada usuário controla seu uso | Usuários precisam ter chave própria |
| **Global** | Mais fácil para usuários | Você paga por todos os usos |

### Recomendação:

- **Para testes**: Configure a chave global (Opção 2)
- **Para produção**: Deixe usuários configurarem suas próprias chaves (Opção 1)
- **Híbrido**: Configure global E permita que usuários adicionem suas próprias

---

## ✅ Verificar se Funcionou

Depois de configurar:

1. Preencha os campos **Persona** e **Objetivo**
2. Clique em **"Gerar Prompt Mestre"**
3. Deve aparecer o resultado em alguns segundos

Se der erro, verifique:
- A chave está correta?
- A chave do Gemini está ativa?
- Você tem créditos disponíveis? (Gemini é grátis com limite)

---

## 🆘 Precisa de Ajuda?

Se o erro persistir, me envie:
1. Screenshot do erro completo
2. Console do navegador (F12)
3. Qual opção você escolheu (Individual ou Global)

**O SISTEMA ESTÁ FUNCIONANDO! É só configurar a API Key agora.** 🚀


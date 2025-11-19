# ✅ SOLUÇÃO ROOT DIRECTORY - Baseado na Estrutura Real

## 🔍 Análise da Estrutura

Baseado na estrutura local do seu projeto:

### Estrutura Real:
```
LABPROMPT/                    (workspace local)
└── labprompt/                (pasta do projeto)
    ├── package.json          ← AQUI está o package.json
    ├── src/
    ├── components/
    └── ...
```

### No GitHub:
O repositório `brunao23/promptllab` provavelmente tem a mesma estrutura:
```
promptllab/                   (repositório GitHub)
└── labprompt/                (pasta do projeto)
    ├── package.json          ← AQUI está o package.json
    ├── src/
    ├── components/
    └── ...
```

## ✅ SOLUÇÃO CORRETA

### Root Directory na Vercel:

**Deve ser:** `labprompt`

### Por quê?

Se o `package.json` está dentro da pasta `labprompt/` no repositório, a Vercel precisa saber onde procurar.

## 🔧 Como Configurar

### Passo 1: Acessar Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `promptllab` ou `labprompt`
3. Vá em: **Settings** → **General**

### Passo 2: Configurar Root Directory

1. Procure: **Root Directory**
2. **Digite:** `labprompt`
3. **Salve**

### Passo 3: Verificar Build Settings

Na mesma página, verifique:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Framework Preset:** `Vite`

### Passo 4: Fazer Redeploy

1. Vá em: **Deployments**
2. Clique nos **três pontos** do último deploy
3. Selecione: **Redeploy**

## ⚠️ Se Ainda Falhar

### Verificar os Logs do Deploy

1. Vercel → Deployments → Clique no deploy que falhou
2. Veja os logs
3. Procure por:
   - "package.json not found" → Root Directory errado
   - "Cannot find module" → Pode ser problema de dependências
   - Outro erro → Copie a mensagem completa

### Erro Comum: "package.json not found"

Se mesmo com `labprompt` der erro "package.json not found":

1. **Teste:** Root Directory = `(vazio)` ou `.`
2. Isso significa que o repositório no GitHub pode ter estrutura diferente

## 📋 Checklist Final

Antes de fazer deploy:

- [ ] Root Directory = `labprompt`
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `GEMINI_API_KEY`

---

**🎯 CONFIGURAÇÃO RECOMENDADA:**

- **Root Directory:** `labprompt`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Teste isso primeiro!** Se não funcionar, me envie a mensagem de erro completa dos logs da Vercel.


# 🚀 Deploy Automático - Guia Rápido

## ✅ Configuração Inicial

### 1. Variáveis no GitHub Secrets

Acesse: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

### 2. Variáveis no Vercel

Acesse seu projeto no Vercel > **Settings** > **Environment Variables**

Adicione as mesmas variáveis acima para:
- Production
- Preview
- Development

### 3. Conectar ao Vercel

**Opção A - Via Dashboard (Recomendado):**
1. Acesse vercel.com/dashboard
2. Clique em "Add New Project"
3. Importe seu repositório GitHub
4. Configure:
   - Framework: Vite
   - Root Directory: `labprompt`
   - Build Command: `npm run build`
   - Output Directory: `dist`

**Opção B - Via CLI:**
```bash
npm i -g vercel
cd labprompt
vercel login
vercel link
```

## 🔄 Deploy Automático

Após configurar, cada push para `main` ou `master` fará deploy automático!

```bash
git add .
git commit -m "Atualização"
git push origin main
```

## 📋 Arquivos Criados

- ✅ `.github/workflows/deploy-vercel.yml` - Workflow de deploy
- ✅ `.github/workflows/build-check.yml` - Verificação de build
- ✅ `.gitignore` - Arquivos ignorados (incluindo .env)
- ✅ `vercel.json` - Configuração do Vercel
- ✅ `DEPLOY_AUTO_SETUP.md` - Guia completo

## 🔗 Links Úteis

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/[seu-usuario]/[seu-repo]/actions)
- [Documentação Vercel](https://vercel.com/docs)


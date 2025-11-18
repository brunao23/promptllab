# ⚡ Diagnóstico Rápido - Deploy Vercel

## 🔴 Erros Mais Comuns

### 1. "Cannot find module" ou "Module not found"

**Causa:** Root Directory incorreto

**Solução:**
1. Acesse: https://vercel.com/dashboard → Seu Projeto → Settings → General
2. Verifique **Root Directory:**
   - Se `package.json` está na **raiz do repositório** → Deixe **VAZIO**
   - Se `package.json` está em **pasta `labprompt`** → Coloque `labprompt`
3. Salve e faça Redeploy

### 2. "Build Command failed" ou "Build Error"

**Causa:** Variáveis de ambiente faltando ou build local com erro

**Solução:**
1. **Teste build local:**
   ```bash
   npm install
   npm run build
   ```
   
2. **Se build local funciona:**
   - Acesse: Settings → Environment Variables
   - Adicione TODAS as variáveis:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `GEMINI_API_KEY`
   - Marque para: Production, Preview, Development

3. **Se build local falha:**
   - Corrija os erros mostrados
   - Commit e push novamente

### 3. "Deploy não inicia automaticamente"

**Causa:** Repositório não conectado ou branch errada

**Solução:**
1. Settings → Git → Verifique se repositório está conectado
2. Se não estiver, clique em "Connect Git Repository"
3. Settings → Git → Production Branch deve ser `main` ou `master`

### 4. "Site carrega mas mostra erro"

**Causa:** Variáveis de ambiente não estão sendo usadas

**Solução:**
1. Abra Console do navegador (F12)
2. Veja os erros
3. Verifique se variáveis estão configuradas:
   - Settings → Environment Variables
   - Certifique-se que estão marcadas para Production

## ✅ Checklist Rápido

Antes de tudo, verifique:

- [ ] Root Directory configurado? (vazio ou `labprompt`)
- [ ] Build Command = `npm run build`?
- [ ] Output Directory = `dist`?
- [ ] Variáveis de ambiente configuradas?
- [ ] Variáveis marcadas para Production?
- [ ] Repositório conectado no Git?
- [ ] Build local funciona? (`npm run build`)

## 🚀 Solução Rápida (5 minutos)

1. **Acesse Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Vá em Settings → General:**
   - Root Directory: `labprompt` (ou vazio, dependendo da estrutura)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Vá em Settings → Environment Variables:**
   - Adicione `VITE_SUPABASE_URL`
   - Adicione `VITE_SUPABASE_ANON_KEY`
   - Adicione `GEMINI_API_KEY`
   - Marque TODAS para Production, Preview, Development

4. **Vá em Deployments:**
   - Clique nos três pontos (⋯) do último deploy
   - Clique em "Redeploy"

5. **Aguarde 2-3 minutos**

6. **Verifique o resultado**

## 📋 Para Análise Mais Detalhada

Se ainda não funcionar, veja:
- `TROUBLESHOOTING_DEPLOY_VERCEL.md` - Guia completo
- Logs do deploy na Vercel
- Logs do GitHub Actions (se usar)


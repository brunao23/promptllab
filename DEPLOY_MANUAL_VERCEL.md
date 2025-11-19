# 🚀 Deploy Manual na Vercel (Se CLI Não Funcionar)

## ⚠️ Problema com Vercel CLI

Se o `vercel --prod` estiver dando erro de caminho, use o **deploy automático via Git** que é mais confiável!

## ✅ Solução: Deploy Automático via Git Push

### Passo 1: Verificar Configuração na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `labprompt`
3. Vá em: **Settings** → **General**
4. Verifique:
   - ✅ **Root Directory:** `labprompt` (NÃO vazio!)
   - ✅ **Framework Preset:** Vite
   - ✅ **Build Command:** `npm run build`
   - ✅ **Output Directory:** `dist`

### Passo 2: Verificar Variáveis de Ambiente

1. Vá em: **Settings** → **Environment Variables**
2. Verifique se estão configuradas:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `GEMINI_API_KEY`

### Passo 3: Fazer Push no Git

```bash
git add .
git commit -m "Deploy"
git push origin main
```

### Passo 4: Verificar Deploy

1. Acesse: https://vercel.com/dashboard
2. Vá em: **Deployments**
3. O deploy mais recente deve aparecer
4. Clique para ver os logs

## 🔍 Se o Deploy Falhar

### Verificar Logs

1. Vercel Dashboard → Deployments → Clique no deploy que falhou
2. Veja os logs de build
3. Procure por erros como:
   - "package.json not found" → Root Directory errado
   - "VITE_SUPABASE_URL is not defined" → Variável não configurada
   - "Build failed" → Verifique os logs completos

### Correções Comuns

#### Erro: "package.json not found"
**Solução:** Configure Root Directory como `labprompt` na Vercel

#### Erro: "VITE_SUPABASE_URL is not defined"
**Solução:** Adicione a variável `VITE_SUPABASE_URL` na Vercel

#### Erro: "Build timeout"
**Solução:** Verifique se há erros no código que estão travando o build

## 📋 Checklist Final

Antes de fazer push, verifique:

- [ ] Root Directory na Vercel = `labprompt`
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `GEMINI_API_KEY` configurado
- [ ] Build local funciona (`npm run build`)
- [ ] Código commitado e pronto para push

---

**💡 DICA:** O deploy automático via Git é mais confiável que o CLI. Use sempre que possível!


# 🔧 Solução: Deploy Vercel via GitHub Actions

## ⚠️ Problema Atual

O deploy via GitHub Actions está falhando. A melhor solução é usar o **deploy direto da Vercel conectado ao GitHub**.

## ✅ Solução Recomendada (MAIS SIMPLES E CONFIÁVEL)

### **Remover GitHub Actions e usar deploy direto da Vercel:**

1. **Acesse:** https://vercel.com/dashboard
2. **Vá para:** Settings → Git
3. **Conecte o repositório:** `brunao23/promptllab`
4. **Configure:**
   - **Root Directory:** `labprompt`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Adicione variáveis de ambiente:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `API_KEY`
6. **Agora:** Cada push no GitHub faz deploy automático na Vercel

## 📝 Por que isso é melhor?

- ✅ **Mais confiável** - Deploy nativo da Vercel
- ✅ **Mais simples** - Sem necessidade de secrets no GitHub
- ✅ **Mais rápido** - Otimizado pela própria Vercel
- ✅ **Rollback fácil** - Interface visual
- ✅ **Preview automático** - Para Pull Requests

## 🔄 Alternativa: Desabilitar GitHub Actions

Se preferir manter o GitHub Actions (não recomendado), você pode desabilitar o workflow:

```bash
mv .github/workflows/deploy-vercel.yml .github/workflows/deploy-vercel.yml.disabled
```

Mas a melhor solução é usar o deploy direto da Vercel conectado ao GitHub!


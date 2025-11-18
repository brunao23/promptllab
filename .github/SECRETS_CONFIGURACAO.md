# 🔐 Configuração de Secrets para GitHub Actions

Para que o deploy automático funcione via GitHub Actions, você precisa configurar os secrets no GitHub.

## 📋 Secrets Necessários

### Para Deploy Automático via GitHub Actions (Workflow `deploy-vercel.yml`)

1. **VERCEL_TOKEN**
   - Como obter:
     1. Acesse https://vercel.com/dashboard
     2. Vá em **Settings** → **Tokens**
     3. Clique em **Create Token**
     4. Dê um nome (ex: "GitHub Actions Deploy")
     5. Copie o token gerado

2. **VERCEL_ORG_ID**
   - Como obter:
     1. Acesse https://vercel.com/dashboard
     2. Vá em **Settings** → **General**
     3. Copie o **Organization ID**

3. **VERCEL_PROJECT_ID**
   - Como obter:
     1. Acesse https://vercel.com/dashboard
     2. Selecione seu projeto
     3. Vá em **Settings** → **General**
     4. Copie o **Project ID**

### Para Build (Opcional, mas recomendado)

4. **VITE_SUPABASE_URL**
   - URL do seu projeto Supabase
   - Exemplo: `https://abc123xyz.supabase.co`

5. **VITE_SUPABASE_ANON_KEY**
   - Chave pública (anon key) do Supabase
   - Encontre em: Supabase Dashboard → Settings → API

## 🔧 Como Adicionar Secrets no GitHub

### Método 1: Via Interface Web

1. Acesse seu repositório no GitHub: `https://github.com/brunao23/promptllab`
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret:
   - **Name:** Nome do secret (ex: `VERCEL_TOKEN`)
   - **Secret:** Valor do secret
5. Clique em **Add secret**
6. Repita para todos os secrets necessários

### Método 2: Via GitHub CLI

```bash
# Instalar GitHub CLI (se ainda não tiver)
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: sudo apt install gh

# Fazer login
gh auth login

# Adicionar secrets
gh secret set VERCEL_TOKEN --body "seu-token-vercel"
gh secret set VERCEL_ORG_ID --body "seu-org-id"
gh secret set VERCEL_PROJECT_ID --body "seu-project-id"
gh secret set VITE_SUPABASE_URL --body "https://seu-projeto.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "sua-chave-anon"
```

## ✅ Verificar Secrets Configurados

No GitHub:
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Você deve ver todos os secrets listados
3. ⚠️ **Nota:** Você não conseguirá ver os valores, apenas os nomes

## 🚀 Próximos Passos

Após configurar os secrets:

1. **Teste o workflow:**
   ```bash
   git add .
   git commit -m "Teste: Deploy automático"
   git push origin main
   ```

2. **Verifique o status:**
   - GitHub: Vá em **Actions** → Veja o workflow rodando
   - Vercel: Vá em **Deployments** → Veja o novo deploy

## 💡 Método Alternativo (Mais Simples)

**Se preferir não usar GitHub Actions**, você pode usar a integração direta GitHub+Vercel:

1. Acesse https://vercel.com/dashboard
2. Vá em **Add New...** → **Project**
3. Importe o repositório `GenialIa25/labprompt`
4. Configure as variáveis de ambiente na Vercel (não precisa de secrets no GitHub)
5. **Pronto!** Cada push no GitHub fará deploy automaticamente na Vercel

Veja mais detalhes em: `.github/SETUP_VERCEL.md`

## ⚠️ Importante

- **Nunca commite tokens ou secrets no código**
- **Secrets são sensíveis** - compartilhe apenas com membros confiáveis da equipe
- **Use diferentes tokens** para diferentes ambientes (desenvolvimento, produção)
- **Rotacione tokens** periodicamente por segurança

## 🔍 Troubleshooting

### Workflow não executa
- Verifique se os secrets estão configurados
- Verifique se está fazendo push na branch `main` ou `master`
- Verifique se os paths no workflow estão corretos

### Deploy falha
- Verifique se todos os secrets estão corretos
- Verifique os logs do workflow em **Actions** → **Workflow runs**
- Verifique os logs da Vercel no dashboard

### Build falha
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs do build no workflow
- Teste o build localmente primeiro: `npm run build`


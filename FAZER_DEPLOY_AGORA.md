# 🚀 Fazer Deploy Agora - Passo a Passo

## ⚡ Solução Rápida (5 minutos)

### Passo 1: Corrigir Root Directory na Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **Faça login** (se necessário)
3. **Selecione o projeto:** `promptllab`
4. **Clique em:** **Settings** (menu superior)
5. **Clique em:** **General** (menu lateral esquerdo)
6. **Role até:** **Build & Development Settings**
7. **Encontre o campo:** **Root Directory**
8. **ALTERE DE:** `labprompt` 
9. **PARA:** `promptllab`
10. **Clique em:** **Save** (botão no final da página)

### Passo 2: Verificar Variáveis de Ambiente

1. Ainda em **Settings**, clique em **Environment Variables**
2. **Verifique se TODAS estão configuradas:**
   - ☑️ `VITE_SUPABASE_URL`
   - ☑️ `VITE_SUPABASE_ANON_KEY`
   - ☑️ `GEMINI_API_KEY`
3. **Se alguma faltar:**
   - Clique em **Add New**
   - Digite o nome da variável
   - Digite o valor
   - Marque: Production, Preview, Development
   - Clique em **Save**

### Passo 3: Fazer Redeploy

1. **Clique em:** **Deployments** (menu lateral esquerdo)
2. **Encontre o último deploy** (primeiro da lista)
3. **Clique nos três pontos** (⋯) à direita do deploy
4. **Clique em:** **Redeploy**
5. **Confirme** clicando em **Redeploy** novamente
6. **Aguarde 2-3 minutos** enquanto o deploy acontece

### Passo 4: Verificar o Resultado

1. **Após o deploy completar:**
   - O status deve estar **Ready** ✅ (verde)
   - Clique na **URL** que aparece (ex: `promptllab.vercel.app`)
   - O site deve carregar corretamente

## ✅ Checklist Final

Antes de confirmar que funcionou:

- [ ] Root Directory corrigido para `promptllab`
- [ ] Variáveis de ambiente configuradas
- [ ] Redeploy iniciado
- [ ] Status do deploy: **Ready** ✅
- [ ] Site carregando corretamente

## 🆘 Se Ainda Der Erro

### Verificar Logs:

1. **Deployments** → Clique no deploy → **View Build Logs**
2. **Procure por erros** específicos
3. **Se aparecer:**
   - "Root Directory does not exist" → Root Directory ainda está errado
   - "Environment variable not found" → Variável faltando
   - "Build failed" → Problema no código (me envie os logs)

### Verificar Build Local:

```bash
cd labprompt  # ou promptllab, dependendo de onde você está
npm install
npm run build
```

Se build local funciona mas Vercel não:
- Problema está na configuração da Vercel
- Verifique Root Directory e variáveis de ambiente

Se build local também falha:
- Problema está no código
- Me envie os erros para corrigir

## 📞 Enviar Informações

Se precisar de ajuda, me envie:

1. **Screenshot da configuração do Root Directory** (Settings → General)
2. **Screenshot das variáveis de ambiente** (Settings → Environment Variables)
3. **Logs do deploy** (Deployments → Deploy → View Build Logs)
4. **URL do projeto** na Vercel

---

**Agora siga os passos acima e faça o deploy!** 🚀


# 🔧 Troubleshooting - Deploy Vercel

Guia completo para diagnosticar e resolver problemas de deploy na Vercel.

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar Estrutura do Repositório

**No GitHub:**
- Acesse: https://github.com/brunao23/promptllab
- Veja se o `package.json` está na **raiz** ou na pasta `labprompt`

**Estrutura Esperada:**
```
promptllab/
├── package.json          ← Se está aqui, Root Directory = "" (vazio)
├── vite.config.ts
├── vercel.json
└── ...

OU

promptllab/
├── labprompt/
│   ├── package.json      ← Se está aqui, Root Directory = "labprompt"
│   ├── vite.config.ts
│   └── ...
└── ...
```

### 2. Verificar Configuração na Vercel

Acesse: https://vercel.com/dashboard → Seu Projeto → Settings → General

**Verificar:**

1. **Root Directory:**
   - Se `package.json` está na raiz → Deixe **VAZIO** ou `.`
   - Se `package.json` está em subpasta → Coloque `promptllab`

2. **Build Command:**
   - Deve ser: `npm run build`

3. **Output Directory:**
   - Deve ser: `dist`

4. **Install Command:**
   - Deve ser: `npm install`

### 3. Verificar Variáveis de Ambiente

Acesse: Settings → Environment Variables

**Verificar se todas estão configuradas:**

- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `GEMINI_API_KEY`

**Importante:** Marque **todas** para:
- ☑️ Production
- ☑️ Preview
- ☑️ Development

### 4. Verificar Logs de Build

Acesse: Deployments → Clique no último deploy → View Build Logs

**Procurar por:**

#### Erro: "Cannot find module"
- **Causa:** Dependências não instaladas
- **Solução:** Verifique se `package.json` tem todas as dependências

#### Erro: "Command not found: npm"
- **Causa:** Node.js não configurado
- **Solução:** Vercel deve detectar automaticamente, mas verifique Node.js Version nas settings

#### Erro: "dist directory not found"
- **Causa:** Build falhou ou Output Directory errado
- **Solução:** Verifique Output Directory = `dist`

#### Erro: "Environment variable not found"
- **Causa:** Variável de ambiente não configurada
- **Solução:** Adicione todas as variáveis em Settings → Environment Variables

### 5. Problemas Comuns

#### ❌ Problema: Build Falha

**Sintomas:**
- Status: "Build Failed"
- Logs mostram erro de compilação

**Soluções:**

1. **Testar build local:**
   ```bash
   cd labprompt  # ou raiz, dependendo da estrutura
   npm install
   npm run build
   ```

2. **Se build local funciona:**
   - Verifique variáveis de ambiente na Vercel
   - Verifique Root Directory

3. **Se build local falha:**
   - Corrija os erros mostrados
   - Commit e push novamente

#### ❌ Problema: Deploy Não Inicia

**Sintomas:**
- Push no GitHub não gera deploy
- Nenhum deploy aparece na Vercel

**Soluções:**

1. **Verificar integração GitHub:**
   - Settings → Git → Verifique se o repositório está conectado
   - Reconnect se necessário

2. **Verificar branch:**
   - Deploy automático funciona apenas para `main` ou `master`
   - Settings → Git → Production Branch

3. **Verificar permissões:**
   - GitHub → Settings → Actions → Verifique se Actions está habilitado

#### ❌ Problema: Deploy Conclui mas Site Não Funciona

**Sintomas:**
- Status: "Ready"
- Mas site mostra erro ou página em branco

**Soluções:**

1. **Verificar console do navegador (F12):**
   - Erros de JavaScript aparecerão aqui

2. **Verificar variáveis de ambiente:**
   - Certifique-se que todas estão configuradas
   - Especialmente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

3. **Verificar Output Directory:**
   - Deve ser `dist`
   - Verifique se `dist/index.html` existe após o build

#### ❌ Problema: Erro 404 em Rotas

**Sintomas:**
- Página inicial funciona
- Mas rotas dão 404

**Soluções:**

1. **Verificar vercel.json:**
   ```json
   {
     "rewrites": [
       {
         "source": "/((?!api/).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. **Se não existe, crie `vercel.json` na raiz ou em `labprompt/`**

### 6. Checklist Completo

Antes de pedir ajuda, verifique:

- [ ] Root Directory configurado corretamente
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Repositório conectado na Vercel
- [ ] Branch principal configurada (`main` ou `master`)
- [ ] Build local funciona (`npm run build`)
- [ ] Verificou os logs do último deploy
- [ ] `vercel.json` existe e está correto

### 7. Comandos Úteis

**Testar build local:**
```bash
npm install
npm run build
ls -la dist/  # Verificar se dist foi criado
```

**Verificar estrutura:**
```bash
pwd  # Ver onde você está
ls -la  # Ver arquivos na raiz
find . -name "package.json"  # Encontrar package.json
```

**Limpar cache (se necessário):**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 8. Resetar Configuração Vercel

Se nada funcionar:

1. **Vercel Dashboard:**
   - Settings → Danger Zone → Delete Project
   - (Ou apenas desconecte o repositório)

2. **Recriar projeto:**
   - Add New Project
   - Import Git Repository
   - Configure tudo novamente

3. **Verificar configurações:**
   - Use este guia do início

### 9. Contato/Logs para Análise

Quando pedir ajuda, forneça:

1. **URL do último deploy:** (ex: https://vercel.com/...)
2. **Logs de build:** (copie os logs do último deploy)
3. **Estrutura do repositório:** (onde está o package.json?)
4. **Configurações da Vercel:**
   - Root Directory:
   - Build Command:
   - Output Directory:
5. **Variáveis de ambiente:** (nomes, não valores)
6. **Resultado do build local:** (`npm run build` funciona?)

---

## 📞 Links Úteis

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs
- **GitHub Actions:** https://github.com/brunao23/promptllab/actions
- **Vercel Status:** https://www.vercel-status.com/

---

**Última atualização:** Guia de troubleshooting completo para deploy na Vercel


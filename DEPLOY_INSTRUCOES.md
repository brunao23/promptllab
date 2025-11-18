# 🚀 Instruções de Build e Deploy - LabPrompt

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 18 ou superior)
2. **npm** ou **yarn** instalado
3. **Conta Vercel** (ou outra plataforma de deploy)
4. **Variáveis de ambiente configuradas**

## 🔧 Configuração de Variáveis de Ambiente

### No Vercel:
1. Acesse o projeto no dashboard da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

### Localmente (arquivo .env na raiz):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

## 🏗️ Build Local

### Windows (PowerShell):
```powershell
# Instalar dependências
npm install

# Fazer build
npm run build

# Preview local
npm run preview
```

### Linux/Mac:
```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Preview local
npm run preview
```

## 🚀 Deploy

### Opção 1: Deploy Automático via GitHub (Recomendado)

1. **Conecte o repositório na Vercel:**
   - Acesse https://vercel.com
   - Clique em **Add New Project**
   - Conecte seu repositório GitHub
   - Configure as variáveis de ambiente

2. **Configurações do Projeto na Vercel:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** Deixe vazio ou `./labprompt` se o projeto estiver em subpasta

3. **Deploy Automático:**
   - Todo push para a branch `main` faz deploy automaticamente
   - Pull Requests geram deploys de preview automaticamente

### Opção 2: Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy em preview
vercel

# Deploy em produção
vercel --prod
```

### Opção 3: Usando Scripts Fornecidos

#### Windows:
```powershell
.\scripts\build-and-deploy.ps1
```

#### Linux/Mac:
```bash
chmod +x scripts/build-and-deploy.sh
./scripts/build-and-deploy.sh
```

## 🔄 Atualizações e Hot Reload

### Durante Desenvolvimento:
```bash
npm run dev
```

### Após Mudanças:
1. **Git:**
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push origin main
   ```

2. **Deploy Automático:**
   - A Vercel detecta automaticamente o push
   - Faz build e deploy automaticamente
   - Notifica por email quando concluir

## 🐛 Solução de Problemas

### Build Falha

1. **Verifique as variáveis de ambiente:**
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Limpe o cache:**
   ```bash
   rm -rf node_modules
   rm -rf dist
   npm install
   npm run build
   ```

3. **Verifique erros de TypeScript:**
   ```bash
   npx tsc --noEmit
   ```

### Deploy Falha na Vercel

1. **Verifique os logs no dashboard da Vercel**
2. **Verifique se todas as variáveis de ambiente estão configuradas**
3. **Verifique se o `vercel.json` está correto**
4. **Verifique se o diretório `dist` está sendo gerado**

### Erros de CORS ou API

1. **Verifique as configurações do Supabase:**
   - URL correta
   - Anon key correta
   - Políticas RLS configuradas

2. **Verifique o `vercel.json` para headers de CORS**

## 📊 Scripts Disponíveis

```json
{
  "dev": "vite",              // Desenvolvimento local
  "build": "vite build",      // Build para produção
  "preview": "vite preview",  // Preview do build local
  "deploy": "vercel --prod"   // Deploy direto na Vercel
}
```

## ✅ Checklist Antes do Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Testes locais passando
- [ ] Build local funcionando (`npm run build`)
- [ ] Preview local funcionando (`npm run preview`)
- [ ] Código commitado e pushado
- [ ] Deploy automático configurado (se aplicável)

## 🎯 Próximos Passos Após Deploy

1. **Testar a aplicação em produção**
2. **Verificar logs no dashboard da Vercel**
3. **Configurar domínio customizado (opcional)**
4. **Configurar monitoramento e analytics**


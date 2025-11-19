# 🔧 CORRIGIR ROOT DIRECTORY - Solução Definitiva

## ⚠️ Problema

Quando você coloca `labprompt` no Root Directory, o deploy falha.

## 🔍 Diagnóstico

### Informações:
- **Repositório GitHub:** `brunao23/promptllab`
- **Projeto Vercel:** `promptllab`
- **ID do Projeto:** `prj_QhrDTc5yHBp0GEoY9ZZXBaJ9dSCC`

### Possibilidades:

#### Cenário 1: Projeto está na RAIZ do repositório
Se o `package.json` está na raiz do repositório `promptllab`:
- ✅ **Root Directory:** `(vazio)` ou `.`

#### Cenário 2: Projeto está em SUBPASTA `labprompt/`
Se o `package.json` está em `promptllab/labprompt/package.json`:
- ✅ **Root Directory:** `labprompt`

## ✅ Como Descobrir a Estrutura Correta

### Passo 1: Verificar no GitHub

1. Acesse: https://github.com/brunao23/promptllab
2. Veja a estrutura de arquivos:
   - Se `package.json` está na **raiz** → Root Directory = `(vazio)`
   - Se `package.json` está em `labprompt/` → Root Directory = `labprompt`

### Passo 2: Verificar Erro do Deploy

Na Vercel, veja os logs do deploy que falhou:

#### Se o erro for: "package.json not found"
- Significa que o Root Directory está errado
- Tente: `(vazio)` se estava `labprompt`
- Tente: `labprompt` se estava `(vazio)`

#### Se o erro for: "Cannot find module" ou "Build failed"
- Root Directory pode estar correto
- Problema pode ser nas variáveis de ambiente

## 🎯 Solução Baseada no Erro

### Se o Deploy Falha com "package.json not found":

1. **Teste 1:** Root Directory = `(vazio)`
   - Vercel → Settings → General → Root Directory
   - Deixe **VAZIO** ou coloque `.`
   - Salve e faça redeploy

2. **Teste 2:** Root Directory = `labprompt`
   - Se o Teste 1 não funcionar
   - Coloque `labprompt`
   - Salve e faça redeploy

### Se o Deploy Falha com Outro Erro:

1. Verifique os **logs completos** na Vercel
2. Procure pela mensagem de erro específica
3. Veja em qual diretório ele está procurando o `package.json`

## 📋 Checklist de Verificação

Antes de configurar o Root Directory:

- [ ] Acessei o repositório no GitHub: `https://github.com/brunao23/promptllab`
- [ ] Vi onde está o `package.json` (raiz ou subpasta)
- [ ] Configurei o Root Directory baseado na estrutura real
- [ ] Verifiquei as variáveis de ambiente na Vercel
- [ ] Fiz um redeploy após mudar o Root Directory

## 🔧 Configuração Recomendada

Baseado nas informações:

### Se o repositório tem esta estrutura:
```
promptllab/
├── package.json  ← AQUI
├── src/
└── ...
```
**Root Directory:** `(vazio)` ou `.`

### Se o repositório tem esta estrutura:
```
promptllab/
├── labprompt/
│   ├── package.json  ← AQUI
│   └── ...
└── README.md
```
**Root Directory:** `labprompt`

## ⚠️ IMPORTANTE

**O Root Directory deve corresponder EXATAMENTE à estrutura do repositório no GitHub!**

Para descobrir:
1. Acesse: https://github.com/brunao23/promptllab
2. Veja onde está o `package.json`
3. Configure o Root Directory baseado nisso

---

**💡 DICA:** Se ainda não funcionar, copie a mensagem de erro completa dos logs da Vercel para eu poder ajudar melhor!


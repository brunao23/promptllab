# 🔍 Como Verificar a Estrutura do Repositório no GitHub

## 📋 Passo a Passo Simples

### Passo 1: Acessar o Repositório

1. Abra seu navegador
2. Acesse: **https://github.com/brunao23/promptllab**
3. Faça login se necessário

### Passo 2: Ver a Estrutura de Arquivos

Na página do repositório, você verá uma lista de arquivos e pastas.

**Procure por:**

#### Opção A: Se você vê `package.json` logo no início da lista
```
📁 promptllab
  📄 package.json  ← ESTÁ AQUI na raiz
  📄 README.md
  📁 src/
  📁 components/
```
**✅ Root Directory na Vercel:** `(vazio)` ou `.`

#### Opção B: Se você vê uma pasta `labprompt` e dentro dela tem `package.json`
```
📁 promptllab
  📁 labprompt/  ← PASTA
    📄 package.json  ← ESTÁ DENTRO desta pasta
    📄 README.md
  📄 README.md (na raiz)
```
**✅ Root Directory na Vercel:** `labprompt`

### Passo 3: Verificar Dentro da Pasta (se houver)

Se você vê uma pasta `labprompt`:
1. **Clique na pasta** `labprompt`
2. Veja se tem `package.json` dentro
3. Se tiver → Root Directory = `labprompt`
4. Se não tiver → Root Directory = `(vazio)`

## 🎯 Resumo Visual

### Estrutura 1: Projeto na Raiz
```
promptllab/
├── package.json  ← AQUI
├── README.md
├── src/
└── components/
```
**Root Directory:** `(vazio)`

### Estrutura 2: Projeto em Subpasta
```
promptllab/
├── labprompt/
│   ├── package.json  ← AQUI
│   ├── README.md
│   └── src/
└── README.md
```
**Root Directory:** `labprompt`

## ⚠️ Se Não Conseguir Ver

Se não conseguir ver claramente:

1. **Procure por:** `package.json` na busca do GitHub (barra de busca no topo)
2. **Ou:** Clique em "Go to file" e digite `package.json`
3. Veja o caminho completo que aparece:
   - Se aparecer: `promptllab/package.json` → Raiz
   - Se aparecer: `promptllab/labprompt/package.json` → Subpasta

## 📸 O Que Me Enviar

Depois de verificar, me diga:

1. **Onde está o `package.json`?**
   - [ ] Na raiz do repositório (junto com README.md)
   - [ ] Dentro de uma pasta `labprompt/`

2. **Qual é a estrutura que você vê?**
   - Descreva ou tire um print

---

**💡 DICA:** Se você ver `package.json` logo no início da lista (sem estar dentro de nenhuma pasta), então o Root Directory deve ser `(vazio)`.


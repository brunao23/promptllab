# 🔑 Como Obter e Configurar a Chave do Gemini

## 📍 Onde está a chave?

Se você já usou o Google AI Studio anteriormente, a chave pode estar:

1. **No navegador** (localStorage do Google AI Studio)
2. **No Google AI Studio Dashboard** - https://aistudio.google.com/app/apikey
3. **Em algum arquivo .env** que não está sendo detectado

## 🔍 Como Obter a Chave

### Opção 1: Google AI Studio Dashboard

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key" ou veja as chaves existentes
4. Copie a chave (formato: `AIza...`)

### Opção 2: Via navegador (se já selecionou antes)

Se você já selecionou a chave via `window.aistudio` no navegador:
1. Abra o DevTools (F12)
2. Vá para Application > Local Storage
3. Procure por chaves relacionadas ao Google AI Studio
4. Copie o valor da chave

## ⚙️ Configuração Automática

Depois de obter a chave, execute:

```powershell
cd labprompt
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$geminiKey = Read-Host "Cole sua chave do Gemini (AIza...)"
gh secret set GEMINI_API_KEY -b "$geminiKey" -R brunao23/promptllab
```

Ou me forneça a chave e eu configuro automaticamente!


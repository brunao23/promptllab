#!/bin/bash

# Script para configurar secrets no GitHub via GitHub CLI
# Instale o GitHub CLI: https://cli.github.com/

echo "🔐 Configuração de Secrets no GitHub"
echo "====================================="
echo ""

# Verifica se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não está instalado."
    echo "Instale em: https://cli.github.com/"
    exit 1
fi

# Verifica se está autenticado
if ! gh auth status &> /dev/null; then
    echo "❌ Não autenticado no GitHub CLI."
    echo "Execute: gh auth login"
    exit 1
fi

REPO="GenialIa25/labprompt"

echo "📦 Repositório: $REPO"
echo ""

# Secrets do Supabase
echo "🔵 Configurando Supabase secrets..."
gh secret set VITE_SUPABASE_URL -b "https://zmagqrcymbletqymclig.supabase.co" -R $REPO
gh secret set VITE_SUPABASE_ANON_KEY -b "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY" -R $REPO

# Gemini API Key
echo ""
echo "🟣 Configurando Gemini API Key..."
read -sp "Digite sua chave da API Gemini: " GEMINI_KEY
echo ""
gh secret set GEMINI_API_KEY -b "$GEMINI_KEY" -R $REPO

echo ""
echo "✅ Secrets configurados com sucesso!"
echo ""
echo "📋 Secrets configurados:"
gh secret list -R $REPO

echo ""
echo "💡 Para configurar Vercel secrets (opcional):"
echo "   VERCEL_TOKEN: gh secret set VERCEL_TOKEN -b \"seu-token\" -R $REPO"
echo "   VERCEL_ORG_ID: gh secret set VERCEL_ORG_ID -b \"seu-org-id\" -R $REPO"
echo "   VERCEL_PROJECT_ID: gh secret set VERCEL_PROJECT_ID -b \"seu-project-id\" -R $REPO"


# Script PowerShell para configurar secrets no GitHub via GitHub CLI
# Instale o GitHub CLI: https://cli.github.com/

Write-Host "🔐 Configuração de Secrets no GitHub" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se gh CLI está instalado
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "❌ GitHub CLI (gh) não está instalado." -ForegroundColor Red
    Write-Host "Instale em: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Verifica se está autenticado
try {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
} catch {
    Write-Host "❌ Não autenticado no GitHub CLI." -ForegroundColor Red
    Write-Host "Execute: gh auth login" -ForegroundColor Yellow
    exit 1
}

$REPO = "GenialIa25/labprompt"

Write-Host "📦 Repositório: $REPO" -ForegroundColor Green
Write-Host ""

# Secrets do Supabase
Write-Host "🔵 Configurando Supabase secrets..." -ForegroundColor Blue
gh secret set VITE_SUPABASE_URL -b "https://zmagqrcymbletqymclig.supabase.co" -R $REPO
gh secret set VITE_SUPABASE_ANON_KEY -b "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY" -R $REPO

# Gemini API Key
Write-Host ""
Write-Host "🟣 Configurando Gemini API Key..." -ForegroundColor Magenta
$GEMINI_KEY = Read-Host "Digite sua chave da API Gemini" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($GEMINI_KEY)
$GEMINI_KEY_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
gh secret set GEMINI_API_KEY -b "$GEMINI_KEY_PLAIN" -R $REPO

Write-Host ""
Write-Host "✅ Secrets configurados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Secrets configurados:" -ForegroundColor Cyan
gh secret list -R $REPO

Write-Host ""
Write-Host "💡 Para configurar Vercel secrets (opcional):" -ForegroundColor Yellow
Write-Host "   VERCEL_TOKEN: gh secret set VERCEL_TOKEN -b 'seu-token' -R $REPO"
Write-Host "   VERCEL_ORG_ID: gh secret set VERCEL_ORG_ID -b 'seu-org-id' -R $REPO"
Write-Host "   VERCEL_PROJECT_ID: gh secret set VERCEL_PROJECT_ID -b 'seu-project-id' -R $REPO"


# Script para adicionar a chave do Gemini automaticamente
# Execute: .\.github\ADICIONAR_GEMINI_KEY.ps1

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "🔑 Configuração da Chave Gemini API" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se gh está disponível
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "❌ GitHub CLI não está instalado." -ForegroundColor Red
    Write-Host "Instale em: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Verificar autenticação
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

$REPO = "brunao23/promptllab"

Write-Host "📦 Repositório: $REPO" -ForegroundColor Green
Write-Host ""

Write-Host "🔵 Secrets atuais:" -ForegroundColor Blue
gh secret list -R $REPO
Write-Host ""

Write-Host "🟣 Adicionando GEMINI_API_KEY..." -ForegroundColor Magenta
Write-Host ""

# Solicitar a chave do Gemini
Write-Host "Opções:" -ForegroundColor Yellow
Write-Host "1. Se você tem a chave, cole ela abaixo" -ForegroundColor White
Write-Host "2. Se não tem, acesse: https://aistudio.google.com/app/apikey" -ForegroundColor White
Write-Host ""

$geminiKey = Read-Host "Cole sua chave do Gemini (AIza...)" -AsSecureString

if ($geminiKey.Length -eq 0) {
    Write-Host "❌ Chave não fornecida. Operação cancelada." -ForegroundColor Red
    exit 1
}

# Converter SecureString para string
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiKey)
$geminiKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Validar formato (deve começar com AIza)
if (-not $geminiKeyPlain.StartsWith("AIza")) {
    Write-Host "⚠️  Aviso: A chave do Gemini normalmente começa com 'AIza'. Continuando mesmo assim..." -ForegroundColor Yellow
}

# Configurar o secret
Write-Host ""
Write-Host "⏳ Configurando secret no GitHub..." -ForegroundColor Cyan
gh secret set GEMINI_API_KEY -b "$geminiKeyPlain" -R $REPO

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Chave do Gemini configurada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Secrets configurados:" -ForegroundColor Cyan
    gh secret list -R $REPO
    Write-Host ""
    Write-Host "💡 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   - A chave também precisa ser configurada no Vercel" -ForegroundColor White
    Write-Host "   - Acesse: https://vercel.com/dashboard > Seu Projeto > Settings > Environment Variables" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao configurar a chave. Verifique se você tem permissões." -ForegroundColor Red
}


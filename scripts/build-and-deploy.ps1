# =====================================================
# SCRIPT DE BUILD E DEPLOY PARA LABPROMPT (PowerShell)
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando build e deploy do LabPrompt..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto." -ForegroundColor Red
    exit 1
}

# Passo 1: Instalar dependências
Write-Host "`n📦 Passo 1: Instalando dependências..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Passo 2: Verificar variáveis de ambiente
Write-Host "`n🔍 Passo 2: Verificando variáveis de ambiente..." -ForegroundColor Green
if (-not $env:VITE_SUPABASE_URL -and -not (Test-Path ".env")) {
    Write-Host "⚠️  Aviso: VITE_SUPABASE_URL não encontrada nas variáveis de ambiente" -ForegroundColor Yellow
    Write-Host "   Certifique-se de configurar no Vercel ou arquivo .env" -ForegroundColor Yellow
}

if (-not $env:VITE_SUPABASE_ANON_KEY -and -not (Test-Path ".env")) {
    Write-Host "⚠️  Aviso: VITE_SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente" -ForegroundColor Yellow
    Write-Host "   Certifique-se de configurar no Vercel ou arquivo .env" -ForegroundColor Yellow
}

# Passo 3: Build do projeto
Write-Host "`n🔨 Passo 3: Fazendo build do projeto..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Build falhou" -ForegroundColor Red
    exit 1
}

# Verificar se o build foi bem-sucedido
if (-not (Test-Path "dist")) {
    Write-Host "❌ Erro: Diretório dist não foi criado. Build falhou." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green

# Passo 4: Verificar tamanho do build
Write-Host "`n📊 Passo 4: Informações do build:" -ForegroundColor Green
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   Tamanho total: $([math]::Round($distSize, 2)) MB"

# Passo 5: Deploy (se vercel CLI estiver instalado)
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Write-Host "`n🚀 Passo 5: Fazendo deploy na Vercel..." -ForegroundColor Green
    $response = Read-Host "Deseja fazer deploy agora? (s/n)"
    if ($response -match "^[SsYy]") {
        vercel --prod
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deploy concluído!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro no deploy" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Deploy cancelado. Execute 'vercel --prod' manualmente quando quiser." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️  Vercel CLI não encontrado." -ForegroundColor Yellow
    Write-Host "   Para fazer deploy:" -ForegroundColor Yellow
    Write-Host "   1. Instale: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "   2. Execute: vercel --prod" -ForegroundColor Yellow
    Write-Host "   OU configure deploy automático via GitHub na Vercel" -ForegroundColor Yellow
}

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green


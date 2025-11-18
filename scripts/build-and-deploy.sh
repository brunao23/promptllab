#!/bin/bash

# =====================================================
# SCRIPT DE BUILD E DEPLOY PARA LABPROMPT
# =====================================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando build e deploy do LabPrompt..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script na raiz do projeto.${NC}"
    exit 1
fi

# Passo 1: Instalar dependências
echo -e "\n${GREEN}📦 Passo 1: Instalando dependências...${NC}"
npm install

# Passo 2: Verificar variáveis de ambiente
echo -e "\n${GREEN}🔍 Passo 2: Verificando variáveis de ambiente...${NC}"
if [ -z "$VITE_SUPABASE_URL" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Aviso: VITE_SUPABASE_URL não encontrada nas variáveis de ambiente${NC}"
    echo -e "${YELLOW}   Certifique-se de configurar no Vercel ou arquivo .env${NC}"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Aviso: VITE_SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente${NC}"
    echo -e "${YELLOW}   Certifique-se de configurar no Vercel ou arquivo .env${NC}"
fi

# Passo 3: Build do projeto
echo -e "\n${GREEN}🔨 Passo 3: Fazendo build do projeto...${NC}"
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Diretório dist não foi criado. Build falhou.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

# Passo 4: Verificar tamanho do build
echo -e "\n${GREEN}📊 Passo 4: Informações do build:${NC}"
BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "   Tamanho total: ${BUILD_SIZE}"

# Passo 5: Deploy (se vercel CLI estiver instalado)
if command -v vercel &> /dev/null; then
    echo -e "\n${GREEN}🚀 Passo 5: Fazendo deploy na Vercel...${NC}"
    read -p "Deseja fazer deploy agora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        vercel --prod
        echo -e "${GREEN}✅ Deploy concluído!${NC}"
    else
        echo -e "${YELLOW}⚠️  Deploy cancelado. Execute 'vercel --prod' manualmente quando quiser.${NC}"
    fi
else
    echo -e "\n${YELLOW}⚠️  Vercel CLI não encontrado.${NC}"
    echo -e "${YELLOW}   Para fazer deploy:${NC}"
    echo -e "   1. Instale: npm i -g vercel"
    echo -e "   2. Execute: vercel --prod"
    echo -e "   OU configure deploy automático via GitHub na Vercel"
fi

echo -e "\n${GREEN}✅ Processo concluído!${NC}"


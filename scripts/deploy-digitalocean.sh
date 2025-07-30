#!/bin/bash

echo "🚀 Iniciando deploy a DigitalOcean..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Advertencia: No estás en la rama main (actual: $CURRENT_BRANCH)${NC}"
    read -p "¿Deseas continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar cambios no commiteados
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Tienes cambios sin commitear${NC}"
    git status --short
    read -p "¿Deseas continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build local para verificar que todo está OK
echo "📦 Verificando build..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build. Corrige los errores antes de hacer deploy.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build exitoso${NC}"

# Push a GitHub
echo "📤 Subiendo cambios a GitHub..."
git push origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al subir a GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Código subido a GitHub${NC}"
echo -e "${GREEN}🎉 Deploy iniciado en DigitalOcean App Platform${NC}"
echo ""
echo "📊 Puedes ver el progreso en:"
echo "   https://cloud.digitalocean.com/apps"
echo ""
echo "⏱️  El deploy tomará aproximadamente 5-10 minutos"
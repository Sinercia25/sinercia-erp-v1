#!/bin/bash

# Variables - ACTUALIZA ESTOS VALORES
DROPLET_IP="TU_IP_DROPLET"
DROPLET_USER="root"
APP_NAME="sinercia-erp"
DOCKER_IMAGE="$APP_NAME:latest"

echo "🚀 Deploy a DigitalOcean Droplet"

# Build Docker image
echo "📦 Construyendo imagen Docker..."
docker build -t $DOCKER_IMAGE .

# Guardar imagen
echo "💾 Guardando imagen..."
docker save $DOCKER_IMAGE | gzip > ${APP_NAME}.tar.gz

# Copiar al servidor
echo "📤 Copiando al servidor..."
scp ${APP_NAME}.tar.gz ${DROPLET_USER}@${DROPLET_IP}:/tmp/

# Ejecutar comandos en el servidor
echo "🔧 Configurando en el servidor..."
ssh ${DROPLET_USER}@${DROPLET_IP} << 'ENDSSH'
cd /tmp
docker load < sinercia-erp.tar.gz
docker stop sinercia-erp || true
docker rm sinercia-erp || true
docker run -d \
  --name sinercia-erp \
  --restart always \
  -p 80:3000 \
  --env-file /root/.env.production \
  sinercia-erp:latest
rm /tmp/sinercia-erp.tar.gz
ENDSSH

# Limpiar archivo local
rm ${APP_NAME}.tar.gz

echo "✅ Deploy completado!"
echo "🌐 Tu aplicación está en: http://${DROPLET_IP}"
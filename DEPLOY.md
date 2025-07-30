# 🚀 Guía de Deploy a DigitalOcean

## Opción 1: App Platform (RECOMENDADO - Más fácil)

### Pasos:

1. **Preparar tu repositorio GitHub:**
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. **Crear app en DigitalOcean:**
   - Ve a https://cloud.digitalocean.com/apps
   - Click en "Create App"
   - Conecta tu GitHub
   - Selecciona tu repositorio `sinercia-erp-v1`
   - Selecciona la rama `main`

3. **Configurar variables de entorno:**
   En la sección "Environment Variables", agrega:
   - DATABASE_URL
   - OPENAI_API_KEY
   - SUPABASE_HOST, SUPABASE_PORT, etc.
   - DWH_HOST, DWH_PORT, etc.

4. **Deploy automático:**
   ```bash
   ./scripts/deploy-digitalocean.sh
   ```

## Opción 2: Droplet con Docker

### Requisitos previos:
1. Crear un Droplet en DigitalOcean (Ubuntu 22.04)
2. Instalar Docker en el Droplet:
   ```bash
   ssh root@TU_IP_DROPLET
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

### Deploy:
1. **Actualizar el script con tu IP:**
   Edita `scripts/deploy-droplet.sh` y cambia `TU_IP_DROPLET`

2. **Crear archivo de variables en el servidor:**
   ```bash
   ssh root@TU_IP_DROPLET
   nano /root/.env.production
   # Pega tus variables de entorno
   ```

3. **Ejecutar deploy:**
   ```bash
   ./scripts/deploy-droplet.sh
   ```

## Opción 3: Deploy manual con PM2

1. **Conectar al servidor:**
   ```bash
   ssh root@TU_IP_DROPLET
   ```

2. **Instalar Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   apt-get install -y nodejs
   npm install -g pm2
   ```

3. **Clonar y configurar:**
   ```bash
   git clone https://github.com/TU_USUARIO/sinercia-erp-v1.git
   cd sinercia-erp-v1
   npm install
   cp .env.production.example .env.production
   nano .env.production  # Editar con tus valores
   npx prisma generate
   npm run build
   ```

4. **Iniciar con PM2:**
   ```bash
   pm2 start npm --name "sinercia-erp" -- start
   pm2 save
   pm2 startup
   ```

## 🔐 Configurar SSL (HTTPS)

### Para App Platform:
- SSL incluido automáticamente ✅

### Para Droplet:
```bash
# Instalar Nginx y Certbot
apt update
apt install nginx certbot python3-certbot-nginx

# Configurar Nginx
nano /etc/nginx/sites-available/sinercia-erp
```

Contenido:
```nginx
server {
    server_name tu-dominio.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar y obtener certificado
ln -s /etc/nginx/sites-available/sinercia-erp /etc/nginx/sites-enabled/
certbot --nginx -d tu-dominio.com
```

## 📊 Monitoreo

### Ver logs en App Platform:
- Dashboard > Tu App > Runtime Logs

### Ver logs en Droplet:
```bash
# Con Docker
docker logs -f sinercia-erp

# Con PM2
pm2 logs sinercia-erp
```

## 🆘 Troubleshooting

### Error de build:
1. Verificar que `npm run build` funciona localmente
2. Revisar las variables de entorno

### Error de base de datos:
1. Verificar DATABASE_URL
2. Verificar que Prisma puede conectarse:
   ```bash
   npx prisma db push
   ```

### La app no responde:
1. Verificar logs
2. Verificar que el puerto 3000 está expuesto
3. Verificar firewall/security groups
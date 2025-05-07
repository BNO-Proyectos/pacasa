# Sincronización Dynamics-HubSpot

Sistema de sincronización entre Microsoft Dynamics y HubSpot para gestión de contactos y deals.

## Requisitos Previos

- Node.js (v14 o superior)
- SQL Server
- Acceso a las APIs de HubSpot y Dynamics

## Estructura del Proyecto

El proyecto consta de dos partes:
1. **API REST** (raíz del proyecto)
2. **Job de Sincronización** (carpeta `/jobs`)

## Configuración Inicial

1. **Variables de Entorno**
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   # Dynamics
   DB_USER=usuario_sql
   DB_PASSWORD=contraseña_sql
   DB_SERVER=servidor_sql
   DB_DATABASE=nombre_base_datos

   # HubSpot
   HUBSPOT_API_KEY=tu_api_key_hubspot
   HUBSPOT_API_BASE=http://localhost:3000/api

   # Server
   PORT=3000
   ```

2. **Instalación de Dependencias**
   ```bash
   # Instalar dependencias del API
   npm install

   # Instalar dependencias del job de sincronización
   cd jobs
   npm install
   ```

## Ejecución en Desarrollo

1. **Iniciar API**
   ```bash
   # En la raíz del proyecto
   npm run dev
   ```

2. **Iniciar Job de Sincronización**
   ```bash
   # En la carpeta jobs
   cd jobs
   npm run dev
   ```

## Pasos para Producción

1. **Preparar el Código**
   ```bash
   # En la raíz del proyecto (API)
   npm ci --production

   # En la carpeta jobs
   cd jobs
   npm ci --production
   ```

2. **Verificar Configuración**
   - Actualizar las variables de entorno para producción
   - Verificar conexiones a bases de datos
   - Asegurar que los endpoints estén correctamente configurados

3. **Despliegue con PM2 Ecosystem**
   
   a. **Crear archivo de configuración**
   
   Crear `ecosystem.config.js` en la raíz del proyecto con la configuración de ambas aplicaciones.

   b. **Iniciar aplicaciones**
   ```bash
   # Instalar PM2 globalmente si no está instalado
   npm install -g pm2

   # Iniciar todas las aplicaciones
   pm2 start ecosystem.config.js

   # Configurar inicio automático
   pm2 startup
   pm2 save
   ```

   c. **Comandos útiles**
   ```bash
   # Ver estado de las aplicaciones
   pm2 status

   # Reiniciar todas las aplicaciones
   pm2 restart ecosystem.config.js

   # Detener todas las aplicaciones
   pm2 stop ecosystem.config.js

   # Ver logs de todas las aplicaciones
   pm2 logs

   # Ver monitor de recursos
   pm2 monit
   ```

   d. **Ubicación de logs**
   - API: `./logs/api-out.log` y `./logs/api-error.log`
   - Sync Job: `./logs/sync-out.log` y `./logs/sync-error.log`

## Estructura de Archivos

```
/                           # Raíz del proyecto (API)
├── index.js               # Punto de entrada del API
├── src/
│   ├── config/
│   ├── services/
│   │   ├── dynamics/
│   │   └── hubspot/
│   └── utils/
│
└── jobs/                  # Job de sincronización
    ├── index.js          # Punto de entrada del job
    └── src/
        ├── config/
        ├── services/
        └── utils/
```

## Endpoints Disponibles

### Dynamics

- `GET /api/dynamics/unified-v6` - Obtener clientes mayoreo nuevos
- `GET /api/dynamics/unified-v6/updated` - Obtener clientes mayoreo actualizados
- `GET /api/dynamics/cooperativa-v6` - Obtener clientes cooperativa nuevos
- `GET /api/dynamics/cooperativa-v6/updated` - Obtener clientes cooperativa actualizados
- `GET /api/dynamics/licitacion-v6` - Obtener clientes licitación nuevos
- `GET /api/dynamics/licitacion-v6/updated` - Obtener clientes licitación actualizados
- `GET /api/dynamics/fidelidad-v6` - Obtener clientes fidelidad

## Mantenimiento

- Revisar logs regularmente
- Monitorear uso de memoria y CPU
- Verificar sincronización periódicamente
- Mantener actualizadas las dependencias

## Soporte

Para reportar problemas o solicitar soporte, contactar al equipo de desarrollo.

## Gestión con PM2

1. **Primera Instalación**
   ```bash
   # Crear carpeta de logs si no existe
   mkdir logs

   # Instalar PM2 globalmente si no está instalado
   npm install -g pm2
   ```

2. **Iniciar/Reiniciar Aplicaciones**
   ```bash
   # Eliminar instancias previas si existen
   pm2 delete all

   # Iniciar aplicaciones con ecosystem
   pm2 start ecosystem.config.js

   # Guardar configuración para inicio automático
   pm2 save
   pm2 startup
   ```

3. **Comandos de Monitoreo**
   ```bash
   # Ver lista de aplicaciones y su estado
   pm2 list

   # Ver logs en tiempo real
   pm2 logs                    # Ver todos los logs
   pm2 logs dynamics-hubspot-api    # Ver solo logs del API
   pm2 logs dynamics-hubspot-sync   # Ver solo logs del job

   # Monitor de recursos
   pm2 monit
   ```

4. **Gestión de Aplicaciones**
   ```bash
   # Reiniciar aplicaciones
   pm2 restart all
   pm2 restart dynamics-hubspot-api
   pm2 restart dynamics-hubspot-sync

   # Detener aplicaciones
   pm2 stop all
   
   # Eliminar aplicaciones de PM2
   pm2 delete all

   # Limpiar logs
   pm2 flush
   pm2 reloadLogs
   ```

5. **Ubicación de Logs**
   ```
   ./logs/api-out.log    - Logs de salida del API
   ./logs/api-error.log  - Logs de error del API
   ./logs/sync-out.log   - Logs de salida del job
   ./logs/sync-error.log - Logs de error del job
   ```

Nota: Siempre verificar los logs en caso de errores usando `pm2 logs` o revisando los archivos en la carpeta `./logs/`.
# Guía de Instalación y Configuración - HC EMERGENCIA

## 📋 Requisitos Previos

- Node.js instalado (v24.13.0 o superior)
- npm instalado (v11.6.2 o superior)
- Túnel SSH activo para la base de datos:
  - `localhost:3307` → `172.16.1.248:3306` (MariaDB)
  - `localhost:8080` → `172.16.1.248:80` (Web/phpMyAdmin)

## 🗂️ Estructura del Proyecto

```
HC EMERGENCIA/
├── backend/          # Servidor Node.js/Express
└── frontend/        # Aplicación React con Vite
```

**Nota:** No hay `package.json` en la raíz. Cada carpeta tiene su propio `package.json`.

---

## 🔧 Backend

### Ubicación
`HC EMERGENCIA/backend/`

### Scripts Disponibles

| Comando | Script | Descripción |
|---------|--------|-------------|
| `npm start` | `node app.js` | Ejecuta el servidor en producción |
| `npm run dev` | `nodemon app.js` | Ejecuta el servidor en desarrollo (auto-reload) |

### Puerto
- Puerto por defecto: `3001`
- Configurable mediante `process.env.PORT` o variable de entorno

### Punto de Entrada
`app.js`

### Instalación

```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm install
```

### Configuración (.env)

Crear archivo `.env` en `backend/` con:

```env
PORT=3001
JWT_SECRET=TICS@2025
FRONTEND_URL=http://localhost:5173

# Base de datos (usando túnel SSH)
DB_DIALECT=mariadb
DB_USER=administrador
DB_PASSWORD=TICS2025
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=EMERGENCIA

# Correo (opcional)
CORREO_APP=centrodesaludchonetipoc@gmail.com
CORREO_PASS=yqdcjpzabkwoejdc
```

**⚠️ IMPORTANTE:** 
- Usar `DB_HOST=127.0.0.1` y `DB_PORT=3307` (túnel SSH)
- NO usar el puerto 3306 directamente (bloqueado por firewall)

### Iniciar Backend

**Desarrollo:**
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm run dev
```

**Producción:**
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm start
```

El backend quedará disponible en: `http://localhost:3001`

### CORS

El backend acepta peticiones desde:
- `http://localhost:5173` (puerto por defecto del frontend)
- `http://localhost:5174` (puerto alternativo)

Configurado en `backend/app.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

---

## 🎨 Frontend

### Ubicación
`HC EMERGENCIA/frontend/`

### Scripts Disponibles

| Comando | Script | Descripción |
|---------|--------|-------------|
| `npm run dev` | `vite` | Servidor de desarrollo Vite |
| `npm run build` | `vite build --emptyOutDir` | Construir para producción |
| `npm run preview` | `vite preview` | Vista previa de la build |

**Nota:** El frontend NO tiene script `npm start`. Usar `npm run dev` para desarrollo.

### Puerto
- Puerto: `5173` (configurado en `vite.config.js`)
- `strictPort: true` (no permite cambiar el puerto si está ocupado)

### Instalación

```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
npm install
```

### Configuración

El frontend está configurado para llamar siempre a:
- `http://localhost:3001` (backend)

Las URLs están hardcodeadas en los componentes. Si necesitas cambiar la URL del backend:
1. Buscar y reemplazar `http://localhost:3001` en todos los archivos del frontend
2. O mejor: usar variables de entorno con Vite (`VITE_API_URL`)

### Iniciar Frontend

```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
npm run dev
```

El frontend quedará disponible en: `http://localhost:5173`

### ⚠️ Problema Conocido: Error EPERM con esbuild

Si encuentras el error `spawn EPERM` al ejecutar `npm run dev`:

**Solución 1: Ejecutar PowerShell como Administrador**
```powershell
# Abrir PowerShell como Administrador
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
Unblock-File -Path "node_modules\esbuild\esbuild.exe"
npm run dev
```

**Solución 2: Agregar excepción en Antivirus**
- Agregar excepción para: `D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend\node_modules\esbuild`

**Solución 3: Usar script helper**
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
.\fix-esbuild-permissions.ps1
npm run dev
```

Ver `SOLUCION_ERRORES.md` para más detalles.

---

## 🚀 Iniciar Todo el Proyecto

### Orden de Inicio

1. **Asegurar que el túnel SSH esté activo**
   ```powershell
   # Verificar que el túnel esté corriendo
   # localhost:3307 → 172.16.1.248:3306
   ```

2. **Iniciar Backend** (Terminal 1)
   ```powershell
   cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
   npm run dev
   ```
   ✅ Debería mostrar: `🚀 Servidor backend escuchando en http://localhost:3001`
   ✅ Debería mostrar: `✅ Conexión a la base de datos establecida.`

3. **Iniciar Frontend** (Terminal 2)
   ```powershell
   cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
   npm run dev
   ```
   ✅ Debería mostrar: `VITE v5.x.x  ready in xxx ms`
   ✅ Debería mostrar: `➜  Local:   http://localhost:5173/`

### Verificar que Todo Funciona

1. Abrir navegador en: `http://localhost:5173`
2. Deberías ver la página de login
3. El backend debería responder en: `http://localhost:3001`

---

## 📝 Resumen de Comandos

| Ubicación | Desarrollo | Producción |
|-----------|------------|------------|
| **Backend** | `cd backend && npm run dev` | `cd backend && npm start` |
| **Frontend** | `cd frontend && npm run dev` | `cd frontend && npm run build` (luego servir `dist/`) |

---

## 🔍 Verificación de Configuración

### Backend
- ✅ Scripts correctos (`npm start`, `npm run dev`)
- ✅ Puerto 3001 configurado
- ✅ CORS configurado para localhost:5173 y 5174
- ✅ Base de datos configurada con túnel SSH (127.0.0.1:3307)

### Frontend
- ✅ Script `npm run dev` configurado
- ✅ Puerto 5173 con `strictPort: true`
- ✅ URLs del backend apuntan a `http://localhost:3001`
- ⚠️ Error EPERM con esbuild (requiere solución de permisos)

---

## 📚 Dependencias Principales

### Backend
- express
- sequelize
- mariadb
- cors
- jsonwebtoken
- bcryptjs
- nodemailer
- node-cron
- moment-timezone

### Frontend
- react
- react-dom
- react-router-dom
- axios
- vite
- tailwindcss
- date-fns
- moment-timezone

---

## 🆘 Solución de Problemas

Ver archivo `SOLUCION_ERRORES.md` para problemas comunes y sus soluciones.

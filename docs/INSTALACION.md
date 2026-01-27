# Guía de Instalación - Sistema HC Emergencia

## Requisitos Previos

### Software Necesario

1. **Node.js** (versión 18 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version` y `npm --version`

2. **MariaDB** (versión 10.x o superior)
   - Descargar desde: https://mariadb.org/download/
   - **IMPORTANTE**: Configurar en puerto **3307** (no el puerto por defecto 3306)
   - Crear usuario y base de datos según configuración en `.env`

3. **Cursor** (ya lo tienes instalado)

4. **Git** (opcional, para clonar el repositorio)

---

## Pasos de Instalación

### 1. Clonar/Descargar el Proyecto

Si tienes el proyecto en un repositorio Git:
```bash
git clone <url-del-repositorio>
cd "HC EMERGENCIA_act/HC EMERGENCIA"
```

Si tienes el proyecto en una carpeta, simplemente navega a:
```
d:\HC EMERGENCIA_act\HC EMERGENCIA
```

---

### 2. Configurar Base de Datos MariaDB

#### 2.1. Instalar y Configurar MariaDB

1. Instalar MariaDB desde el sitio oficial
2. Durante la instalación, configurar el puerto como **3307** (o cambiarlo después en la configuración)
3. Crear un usuario administrador o usar el root

#### 2.2. Crear Base de Datos y Usuario

Conectarse a MariaDB (puerto 3307):
```bash
mysql -u root -p -P 3307
```

Ejecutar los siguientes comandos SQL:
```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS EMERGENCIA CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (ajustar contraseña según necesidad)
CREATE USER IF NOT EXISTS 'administrador'@'localhost' IDENTIFIED BY 'TICS2025';
GRANT ALL PRIVILEGES ON EMERGENCIA.* TO 'administrador'@'localhost';
FLUSH PRIVILEGES;
```

#### 2.3. Importar Scripts SQL

Ejecutar los scripts SQL necesarios desde la carpeta `backend/scripts/`:
- `create_tables_formulario008.sql` (si existe)
- Cualquier otro script de inicialización de base de datos

**NOTA**: Si tienes un archivo `EMERGENCIA 2026.sql` o similar con la estructura completa de la base de datos, importarlo:
```bash
mysql -u administrador -p -P 3307 EMERGENCIA < "ruta/al/archivo/EMERGENCIA 2026.sql"
```

---

### 3. Configurar Variables de Entorno

#### 3.1. Backend

Crear archivo `.env` en la carpeta `backend/`:

```env
JWT_SECRET=TICS@2025
FRONTEND_URL=http://localhost:5173
CORREO_APP=centrodesaludchonetipoc@gmail.com
CORREO_PASS=yqdcjpzabkwoejdc

DB_DIALECT=mariadb
DB_USER=administrador
DB_PASSWORD=TICS2025
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=EMERGENCIA
```

**IMPORTANTE**: Ajustar las credenciales según tu configuración local de MariaDB.

---

### 4. Instalar Dependencias

#### 4.1. Backend

Abrir terminal en la carpeta `backend/`:
```bash
cd backend
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- express
- sequelize
- mariadb
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- socket.io
- y otras...

#### 4.2. Frontend

Abrir **otra terminal** en la carpeta `frontend/`:
```bash
cd frontend
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- react
- react-dom
- react-router-dom
- axios
- date-fns
- lucide-react
- tailwindcss
- vite
- y otras...

---

### 5. Verificar Configuración

#### 5.1. Verificar Conexión a Base de Datos

Ejecutar un script de verificación (si existe):
```bash
cd backend
node scripts/verificar_conexion.js
```

O probar manualmente conectándose a MariaDB:
```bash
mysql -u administrador -p -P 3307 EMERGENCIA
```

#### 5.2. Verificar Variables de Entorno

Asegurarse de que el archivo `.env` esté en `backend/.env` y tenga todas las variables necesarias.

---

### 6. Ejecutar el Proyecto

#### 6.1. Iniciar Backend

En una terminal, desde `backend/`:
```bash
npm start
```
O para desarrollo con auto-reload:
```bash
npm run dev
```

El backend debería iniciar en: `http://localhost:3001`

#### 6.2. Iniciar Frontend

En **otra terminal**, desde `frontend/`:
```bash
npm run dev
```

El frontend debería iniciar en: `http://localhost:5173`

---

## Resumen de Comandos Rápidos

```bash
# 1. Instalar dependencias backend
cd backend
npm install

# 2. Instalar dependencias frontend
cd ../frontend
npm install

# 3. Crear archivo .env en backend/ con las variables de entorno

# 4. Configurar MariaDB en puerto 3307 y crear base de datos EMERGENCIA

# 5. Iniciar backend (terminal 1)
cd backend
npm start

# 6. Iniciar frontend (terminal 2)
cd frontend
npm run dev
```

---

## Solución de Problemas Comunes

### Error: "Cannot find module"
- Ejecutar `npm install` nuevamente en la carpeta correspondiente

### Error de conexión a base de datos
- Verificar que MariaDB esté corriendo en puerto 3307
- Verificar credenciales en `.env`
- Verificar que la base de datos `EMERGENCIA` exista

### Error: "Port already in use"
- Cambiar el puerto en el código o cerrar la aplicación que está usando ese puerto
- Backend: puerto 3001 (verificar en `backend/app.js`)
- Frontend: puerto 5173 (verificar en `frontend/vite.config.js` si existe)

### Error de autenticación MariaDB
- Verificar usuario y contraseña en `.env`
- Verificar permisos del usuario: `GRANT ALL PRIVILEGES ON EMERGENCIA.* TO 'administrador'@'localhost';`

---

## Estructura del Proyecto

```
HC EMERGENCIA/
├── backend/
│   ├── .env                    # Variables de entorno (CREAR ESTE ARCHIVO)
│   ├── package.json
│   ├── app.js                  # Punto de entrada del backend
│   ├── config/
│   │   └── database.js        # Configuración de Sequelize
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── scripts/               # Scripts SQL
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── config/
│   │   └── main.jsx
│   └── index.html
└── INSTALACION.md             # Este archivo
```

---

## Notas Adicionales

- **Puerto MariaDB**: El proyecto está configurado para usar el puerto **3307** (no el estándar 3306)
- **JWT Secret**: Cambiar `JWT_SECRET` en producción por una clave segura
- **Credenciales de Correo**: Las credenciales en `.env` son para el servicio de correo (Gmail)
- **Base de Datos**: Asegurarse de tener un backup de `EMERGENCIA 2026.sql` o similar antes de trabajar

---

## Contacto y Soporte

Si encuentras problemas durante la instalación, verificar:
1. Versiones de Node.js y npm compatibles
2. Que MariaDB esté corriendo y accesible
3. Que los puertos 3001 (backend) y 5173 (frontend) estén libres
4. Que el archivo `.env` tenga todas las variables necesarias

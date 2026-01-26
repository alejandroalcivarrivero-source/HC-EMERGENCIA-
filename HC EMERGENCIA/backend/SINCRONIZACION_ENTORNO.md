# 🔄 Guía de Sincronización de Entorno

## 📋 Resumen de Cambios Realizados

### ✅ Tarea 1: Actualización de Dependencias

**Estado:** Todas las dependencias críticas están presentes en `package.json`:
- ✅ `dotenv` - Gestión de variables de entorno
- ✅ `sequelize` - ORM para MariaDB
- ✅ `mariadb` - Driver de MariaDB
- ✅ `express` - Framework web
- ✅ `nodemon` - Auto-reload en desarrollo
- ✅ `bcryptjs`, `cors`, `jsonwebtoken`, `socket.io`, etc.

**Comando de Instalación:**

```powershell
cd "c:\PROYECTOS\HC EMERGENCIA\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm install
```

Este comando:
- Instalará todas las dependencias listadas en `package.json`
- Actualizará `package-lock.json` si hay cambios
- Resolverá automáticamente conflictos de versiones
- Instalará dependencias transitivas (como `mysql2` que usa Sequelize internamente)

**Verificación Post-Instalación:**

```powershell
npm list --depth=0
```

---

### ✅ Tarea 2: Configuración de Conexión Dual

**Archivo modificado:** `backend/config/database.js`

**Funcionamiento:**
1. **Prioridad 1:** Intenta conectar a la base de datos de **Oficina** usando variables `DB_WORK_*`
2. **Fallback:** Si falla, intenta conectar a la base de datos de **Casa** vía túnel SSH usando variables `DB_HOME_*` (localhost:3307)

**Características:**
- ✅ Detección automática del entorno
- ✅ Mensajes informativos en consola
- ✅ Manejo de errores robusto
- ✅ Métodos helper: `sequelize.getCurrentConnection()`, `sequelize.isWorkConnection()`, `sequelize.isHomeConnection()`

---

### ✅ Tarea 3: Variables de Entorno

**Archivo actualizado:** `backend/.env`

**Variables configuradas:**

#### Oficina (Prioridad)
```env
DB_WORK_DIALECT=mariadb
DB_WORK_USER=administrador
DB_WORK_PASSWORD=TICS2025
DB_WORK_HOST=172.16.1.248
DB_WORK_PORT=3306
DB_WORK_NAME=EMERGENCIA
```

#### Casa (Fallback vía SSH)
```env
DB_HOME_DIALECT=mariadb
DB_HOME_USER=administrador
DB_HOME_PASSWORD=TICS2025
DB_HOME_HOST=127.0.0.1
DB_HOME_PORT=3307
DB_HOME_NAME=EMERGENCIA
```

**⚠️ IMPORTANTE:** 
- Completa los valores reales de `DB_WORK_*` según tu configuración de oficina
- El túnel SSH debe estar activo cuando trabajes desde casa

---

### ✅ Tarea 4: Script `dev:work`

**Comando disponible:**

```powershell
npm run dev:work
```

**Este script realiza:**

1. ✅ **Verificación de dependencias:**
   - Comprueba que `node_modules` existe
   - Verifica dependencias críticas instaladas
   - Compara `package.json` con `package-lock.json`

2. ✅ **Verificación de configuración:**
   - Comprueba que existe `.env`
   - Verifica variables de entorno críticas

3. ✅ **Verificación de túnel SSH:**
   - Detecta si el túnel SSH está activo en `localhost:3307`
   - Muestra advertencia si no está disponible (pero permite continuar)

4. ✅ **Inicio del servidor:**
   - Si todo está correcto, inicia `nodemon app.js`
   - Si hay errores críticos, detiene la ejecución
   - Si hay advertencias, continúa pero las muestra

---

### ✅ Tarea 5: Script de Sincronización Automática `sync`

**Archivo creado:** `backend/sync_and_run.bat`

**Comando disponible:**

```powershell
npm run sync
```

**Este script automatiza todo el flujo de llegada a la oficina:**

1. ✅ **Git Pull:**
   - Ejecuta `git pull origin main` para traer cambios desde casa
   - Continúa aunque haya errores (puede ser que no haya cambios)

2. ✅ **Instalación de Dependencias:**
   - Ejecuta `npm install` para instalar librerías nuevas
   - Detiene la ejecución si hay errores críticos

3. ✅ **Verificación y Activación de Túnel SSH:**
   - Verifica si el puerto 3307 está ocupado usando `netstat`
   - Si no está ocupado, intenta levantar el túnel SSH en segundo plano
   - Usa `start /b` para ejecutar SSH en background
   - Muestra advertencias si SSH no está disponible o si falla

4. ✅ **Inicio del Servidor:**
   - Ejecuta `npm run dev:work` con todas las verificaciones

**Configuración actual:**
El script `sync_and_run.bat` está configurado con:
```batch
set SSH_USER=TICS
set SSH_HOST=26.223.87.142
set SSH_PORT_LOCAL=3307
set SSH_PORT_REMOTE=3306
set SSH_DEST_HOST=172.16.1.248
```

**Comando SSH ejecutado:** `ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142`

**Arquitectura:**
- **Casa:** Conexión vía túnel SSH (localhost:3307 → PC Puente → Servidor Debian 172.16.1.248:3306)
- **Oficina:** Conexión directa al servidor Debian (172.16.1.248:3306)

---

## 🚀 Uso Rápido

### ⚡ Sincronización Automática (Recomendado)

**Un solo comando para todo:**

```powershell
cd "c:\PROYECTOS\HC EMERGENCIA\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm run sync
```

Este comando ejecuta `sync_and_run.bat` que automatiza:
1. ✅ **Git Pull** - Trae cambios desde casa
2. ✅ **npm install** - Instala dependencias nuevas
3. ✅ **Verifica túnel SSH** - Si no está activo, intenta levantarlo automáticamente
4. ✅ **npm run dev:work** - Inicia el servidor con todas las verificaciones

**✅ Configuración completada:**
El script `sync_and_run.bat` ya está configurado con tus datos:
- Usuario SSH: TICS
- IP del PC Puente: 26.223.87.142
- Servidor Debian: 172.16.1.248:3306
- Comando: `ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142`

### En la Oficina (Manual):

```powershell
cd "c:\PROYECTOS\HC EMERGENCIA\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm run dev:work
```

El sistema intentará conectar directamente a `172.16.1.248:3306`.

### En Casa:

1. **Abrir túnel SSH primero:**
   ```powershell
   ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142
   ```
   
   Este comando crea un túnel que mapea:
   - `localhost:3307` (en tu PC casa) → `172.16.1.248:3306` (Servidor Debian)
   - A través del PC puente (`26.223.87.142`)

2. **Iniciar el servidor:**
   ```powershell
   cd "c:\PROYECTOS\HC EMERGENCIA\HC EMERGENCIA_act\HC EMERGENCIA\backend"
   npm run dev:work
   ```

El sistema intentará conectar a la oficina primero (172.16.1.248:3306 directamente), y si falla, usará el túnel SSH automáticamente (localhost:3307 → PC Puente → 172.16.1.248:3306).

---

## 📝 Notas Importantes

1. **Primera vez:** Ejecuta `npm install` para instalar todas las dependencias
2. **Sincronización diaria:** Usa `npm run sync` al llegar a la oficina para automatizar todo
3. **Actualizaciones:** Si agregas nuevas librerías desde casa, `npm run sync` las instalará automáticamente
4. **Túnel SSH:** Solo necesario cuando trabajas desde casa. El script intenta levantarlo automáticamente
5. **Variables de entorno:** Ajusta `DB_WORK_*` según tu configuración real de oficina
6. **Configuración SSH:** Completa las variables en `sync_and_run.bat` antes de usar `npm run sync`

---

## 🔍 Solución de Problemas

### Error: "No se pudo conectar a ninguna base de datos"

**Solución:**
- Verifica que las credenciales en `.env` sean correctas
- Si estás en casa, verifica que el túnel SSH esté activo
- Si estás en oficina, verifica conectividad de red a `172.16.1.248:3306`

### Advertencia: "No se detecta túnel SSH"

**Solución:**
- Esto es normal si estás en la oficina
- Si estás en casa y necesitas el túnel, ábrelo antes de iniciar el servidor

### Error: "node_modules no encontrado"

**Solución:**
```powershell
npm install
```

---

**✅ Sincronización completada. El sistema está listo para trabajar en ambos entornos.**

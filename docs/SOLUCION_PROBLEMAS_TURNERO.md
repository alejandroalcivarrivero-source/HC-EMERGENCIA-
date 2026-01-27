# SOLUCIÓN DE PROBLEMAS - Turnero Digital Emergencia

## 🔴 Problema 1: Socket.io DESCONECTADO

### Síntomas:
- La pantalla muestra "🔴 DESCONECTADO" en rojo
- No se reciben eventos en tiempo real

### Soluciones:

#### 1. Verificar que el backend esté corriendo

```powershell
# En una terminal, verificar que el backend esté activo
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm run dev
```

**Deberías ver en la consola:**
```
✅ Conexión a la base de datos establecida.
✅ Servidor Socket.io inicializado
🚀 Servidor backend escuchando en http://localhost:3001
📡 Socket.io habilitado para tiempo real
```

#### 2. Verificar que el puerto 3001 esté disponible

Si el puerto está ocupado, cambiar en `.env`:
```env
PORT=3002
```

Y actualizar en `frontend/src/hooks/useSocketEmergencia.js`:
```javascript
const socketInstance = io('http://localhost:3002', {
```

#### 3. Verificar CORS

Si el frontend está en otro puerto, agregar en `backend/app.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  // ...
}));
```

Y en `backend/socket/socketServer.js`:
```javascript
cors: {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  // ...
}
```

---

## 🔴 Problema 2: Error de Base de Datos (ECONNREFUSED 127.0.0.1:3307)

### Síntomas:
- Error: `connect ECONNREFUSED 127.0.0.1:3307`
- El backend no puede conectarse a MariaDB

### Soluciones:

#### 1. Verificar que el túnel SSH esté activo

El puerto 3307 es un túnel SSH que redirige a `172.16.1.248:3306`.

**Verificar túnel SSH:**
```powershell
# Verificar si el puerto 3307 está escuchando
netstat -an | findstr :3307
```

**Si no está activo, activar el túnel SSH:**
```powershell
# Ejemplo de comando SSH (ajustar según tu configuración)
ssh -L 3307:172.16.1.248:3306 usuario@servidor_ssh
```

#### 2. Verificar configuración en `.env`

Asegúrate de que `backend/.env` tenga:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=EMERGENCIA
DB_USER=administrador
DB_PASSWORD=TICS2025
DB_DIALECT=mariadb
```

#### 3. Probar conexión manual

```powershell
# Probar conexión a MariaDB
mysql -h 127.0.0.1 -P 3307 -u administrador -p
# Contraseña: TICS2025
```

---

## ✅ Checklist de Verificación

Antes de usar el Turnero Digital, verifica:

- [ ] **Backend corriendo:**
  ```powershell
  cd backend
  npm run dev
  ```

- [ ] **Túnel SSH activo** (puerto 3307 → 172.16.1.248:3306)

- [ ] **Frontend corriendo:**
  ```powershell
  cd frontend
  npm run dev
  ```

- [ ] **Socket.io conectado:**
  - Abrir `http://localhost:5173/pantalla-turnos-emergencia`
  - Debe mostrar "🟢 EN LÍNEA" en verde

- [ ] **Base de datos accesible:**
  - El backend debe mostrar: `✅ Conexión a la base de datos establecida.`

---

## 🔧 Comandos Rápidos

### Iniciar Backend:
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm run dev
```

### Iniciar Frontend:
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
npm run dev
```

### Verificar Socket.io:
1. Abrir consola del navegador (F12)
2. Ir a `http://localhost:5173/pantalla-turnos-emergencia`
3. Debe aparecer: `✅ Conectado al servidor Socket.io (Emergencia)`

---

## 📝 Notas Importantes

- **El túnel SSH debe estar activo** antes de iniciar el backend
- **El backend debe iniciarse antes** que el frontend para que Socket.io funcione
- Si cambias el puerto del backend, actualiza también el hook `useSocketEmergencia.js`

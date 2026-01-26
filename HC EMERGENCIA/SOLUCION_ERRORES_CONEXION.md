# Solución de Errores de Conexión y Tablas

## 🔴 Errores Detectados

1. **Timeout de Conexión a Base de Datos:**
   ```
   Connection timeout: failed to create socket after 1010ms
   ```

2. **Tabla no existe:**
   ```
   Table 'EMERGENCIA.configuracion_audio_tv' doesn't exist
   ```

## ✅ Soluciones Implementadas

### 1. Manejo de Errores Mejorado

He mejorado los controladores para que manejen correctamente:

- ✅ **Tabla no existe:** Devuelve valores por defecto/arrays vacíos
- ✅ **Timeout de conexión:** Devuelve valores por defecto/arrays vacíos
- ✅ **Otros errores:** Manejo adecuado con mensajes informativos

**Resultado:** El sistema funciona en modo degradado sin romper el frontend.

### 2. Controladores Actualizados

- ✅ `configuracionAudioController.js` - Maneja timeouts y tablas faltantes
- ✅ `multimediaTvController.js` - Maneja timeouts y tablas faltantes

---

## 🔧 Acciones Requeridas

### Paso 1: Verificar Túnel SSH

El error de timeout indica que el túnel SSH no está activo o no está funcionando correctamente.

**Verifica:**
```powershell
# Verificar que el túnel SSH esté activo
# Debería estar corriendo en segundo plano
# Puerto local: 3307 → Servidor remoto: 172.16.1.248:3306
```

**Si el túnel no está activo, actívalo:**
```powershell
# Ejemplo de comando SSH (ajusta según tu configuración)
ssh -L 3307:172.16.1.248:3306 usuario@servidor-ssh
```

### Paso 2: Ejecutar Scripts SQL

Una vez que la conexión funcione, ejecuta estos scripts:

**Script 1:** `scripts/crear_tabla_configuracion_audio.sql`
```sql
CREATE TABLE IF NOT EXISTS configuracion_audio_tv (...);
INSERT INTO configuracion_audio_tv (...) VALUES (...);
```

**Script 2:** `scripts/crear_tabla_multimedia_tv.sql`
```sql
CREATE TABLE IF NOT EXISTS multimedia_tv (...);
```

### Paso 3: Reiniciar Backend

Después de ejecutar los scripts:

```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm start
```

---

## 📊 Estado Actual del Sistema

### ✅ Funcionando (Modo Degradado)

- **Frontend:** Funciona correctamente
- **Socket.io:** Activo y funcionando
- **Backend:** Funciona con valores por defecto
- **Pantalla de TV:** Funciona con valores por defecto

### ⚠️ Limitaciones Actuales

- No se pueden guardar configuraciones personalizadas (tabla no existe)
- No se pueden gestionar videos (tabla no existe o sin conexión)
- Los valores por defecto se usan automáticamente

### ✅ Después de Resolver Conexión

- Podrás guardar configuraciones desde `/admin/videos`
- Podrás gestionar videos educativos
- Las configuraciones se persistirán en la base de datos

---

## 🐛 Diagnóstico de Conexión

### Verificar Conexión a Base de Datos

```powershell
# Probar conexión directa (si tienes acceso)
mysql -h 127.0.0.1 -P 3307 -u administrador -p EMERGENCIA
```

### Verificar Variables de Entorno

Verifica que tu archivo `.env` tenga:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=EMERGENCIA
DB_USER=administrador
DB_PASSWORD=TICS2025
```

---

## 📝 Notas Importantes

1. **El sistema funciona sin base de datos:** Los valores por defecto permiten que todo funcione
2. **Los errores son informativos:** No rompen la aplicación, solo muestran warnings
3. **Socket.io funciona independientemente:** No depende de la base de datos
4. **Frontend funciona:** Recibe valores por defecto y funciona normalmente

---

## ✅ Checklist de Resolución

- [ ] Verificar túnel SSH activo
- [ ] Probar conexión a base de datos
- [ ] Ejecutar script `crear_tabla_configuracion_audio.sql`
- [ ] Ejecutar script `crear_tabla_multimedia_tv.sql`
- [ ] Reiniciar backend
- [ ] Verificar que no haya errores en consola
- [ ] Probar guardar configuración desde `/admin/videos`
- [ ] Probar agregar video desde `/admin/videos`

---

**El sistema está funcionando en modo degradado. Una vez resuelvas la conexión y ejecutes los scripts SQL, todo funcionará completamente.**

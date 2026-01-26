# Control de Audio Avanzado - SIGEMECH Pantalla de TV

## 📋 Resumen

Se ha implementado un sistema completo de control de audio avanzado para la pantalla de TV de SIGEMECH, permitiendo configurar volúmenes desde el panel de administración y aplicar audio ducking automático durante los anuncios de pacientes.

---

## 🗄️ Base de Datos

### Script SQL

**Archivo:** `scripts/crear_tabla_configuracion_audio.sql`

Ejecuta este script para crear la tabla de configuración:

```sql
-- Crea la tabla configuracion_audio_tv
-- Inserta valores por defecto:
-- - volumen_videos: 15%
-- - volumen_llamado: 100%
-- - volumen_atenuacion: 5%
```

---

## 🔧 Backend

### Archivos Creados

1. **Modelo:** `backend/models/configuracion_audio_tv.js`
   - Modelo Sequelize para la tabla de configuración

2. **Controlador:** `backend/controllers/configuracionAudioController.js`
   - `obtenerConfiguracion()` - Obtiene configuración (público)
   - `actualizarConfiguracion()` - Actualiza configuración (solo admin)

3. **Rutas:** `backend/routes/configuracionAudio.js`
   - `GET /api/configuracion-audio` - Obtener configuración
   - `PUT /api/configuracion-audio` - Actualizar configuración (admin)

### Rutas Agregadas en app.js

```javascript
app.use('/api/configuracion-audio', require('./routes/configuracionAudio'));
```

---

## 🎨 Frontend

### Componentes Modificados

#### 1. AdminVideos.jsx

**Nuevas Funcionalidades:**
- ✅ Sección "Configuración de Audio de la TV"
- ✅ Tres controles deslizantes (sliders) para:
  - Volumen General de Videos (0-100%)
  - Volumen de Llamado (0-100%)
  - Volumen de Atenuación (0-100%)
- ✅ Guardado en tiempo real en la base de datos
- ✅ Valores por defecto: 15%, 100%, 5%

**Ubicación:** Botón "🔊 Configuración de Audio" en la parte superior

#### 2. PantallaTurnosEmergencia.jsx

**Mejoras Implementadas:**

1. **Carga de Configuración:**
   - Carga automática de configuración de audio al iniciar
   - Valores por defecto si no hay configuración

2. **Audio Ducking Avanzado:**
   - ✅ Detecta eventos `paciente-llamado` desde Socket.io
   - ✅ Atenúa video automáticamente al volumen configurado (por defecto 5%)
   - ✅ Reproduce Ding-Dong con volumen configurado (por defecto 100%)
   - ✅ Anuncia con voz sintética usando volumen configurado
   - ✅ Restaura volumen del video automáticamente cuando termina el anuncio (evento `onend`)

3. **Control de Reproducción:**
   - ✅ Videos se cargan con `muted: false` pero volumen inicial bajo
   - ✅ Requiere un clic del usuario para habilitar audio (cumple políticas del navegador)
   - ✅ Aplica volumen configurado automáticamente cuando se habilita el audio

4. **Gestión de Volumen:**
   - ✅ Volumen de videos se actualiza cuando cambia la configuración
   - ✅ Volumen se mantiene consistente al cambiar entre videos
   - ✅ Soporte para videos de YouTube y locales

---

## 🎯 Funcionalidades Clave

### 1. Configuración desde Panel Admin

**Acceso:** `/admin/videos` → Botón "🔊 Configuración de Audio"

**Parámetros Configurables:**
- **Volumen General de Videos:** Controla el volumen normal de reproducción
- **Volumen de Llamado:** Controla el volumen de Ding-Dong y voz sintética
- **Volumen de Atenuación:** Controla a qué volumen baja el video durante anuncios

### 2. Audio Ducking Automático

**Flujo:**
1. Llega evento `paciente-llamado` desde Socket.io
2. Video se atenúa automáticamente (por defecto al 5%)
3. Se reproduce Ding-Dong con volumen configurado
4. Se anuncia con voz sintética usando volumen configurado
5. Cuando termina el anuncio (`onend`), el video restaura su volumen normal

### 3. Políticas del Navegador

- Los videos se cargan con `muted: false` pero volumen bajo
- Se requiere un clic/touch del usuario para habilitar audio
- Una vez habilitado, el audio funciona normalmente

---

## 📝 Valores por Defecto

| Parámetro | Valor por Defecto | Descripción |
|-----------|-------------------|-------------|
| `volumen_videos` | 15% | Volumen normal de videos educativos |
| `volumen_llamado` | 100% | Volumen de Ding-Dong y voz sintética |
| `volumen_atenuacion` | 5% | Volumen durante anuncios de pacientes |

---

## 🔄 Flujo de Audio Ducking

```
1. Video reproduciéndose al 15% (volumen_videos)
   ↓
2. Llega evento paciente-llamado
   ↓
3. Video baja al 5% (volumen_atenuacion)
   ↓
4. Ding-Dong suena al 100% (volumen_llamado)
   ↓
5. Voz sintética anuncia al 100% (volumen_llamado)
   ↓
6. Evento onend de SpeechSynthesis
   ↓
7. Video restaura al 15% (volumen_videos)
```

---

## 🚀 Instrucciones de Uso

### Paso 1: Ejecutar Script SQL

```bash
# Ejecutar en MariaDB:
mysql -u usuario -p nombre_base_datos < scripts/crear_tabla_configuracion_audio.sql
```

### Paso 2: Configurar Audio desde Admin

1. Inicia sesión como administrador
2. Ve a `/admin/videos`
3. Haz clic en "🔊 Configuración de Audio"
4. Ajusta los sliders según tus necesidades
5. Haz clic en "Guardar Configuración"

### Paso 3: Verificar en Pantalla de TV

1. Abre `/pantalla-turnos-emergencia`
2. Haz clic en la pantalla para habilitar audio
3. Los videos deberían reproducirse con el volumen configurado
4. Al recibir un llamado, el video debería atenuarse automáticamente

---

## 🐛 Solución de Problemas

### El audio no se habilita

- **Problema:** Los navegadores requieren interacción del usuario
- **Solución:** Haz clic o toca la pantalla una vez para habilitar audio

### El volumen no se atenúa durante anuncios

- **Verifica:** Que la configuración esté guardada correctamente
- **Verifica:** Que el evento `paciente-llamado` esté llegando desde Socket.io
- **Verifica:** Consola del navegador para errores

### El volumen no se restaura después del anuncio

- **Verifica:** Que el evento `onend` de SpeechSynthesis se esté ejecutando
- **Verifica:** Consola del navegador para errores en `restaurarVolumenVideo()`

### Videos de YouTube no respetan el volumen

- **Nota:** YouTube requiere `enablejsapi=1` en la URL (ya implementado)
- **Verifica:** Que el iframe tenga permisos para recibir mensajes postMessage

---

## ✅ Checklist de Verificación

- [ ] Script SQL ejecutado correctamente
- [ ] Tabla `configuracion_audio_tv` creada
- [ ] Valores por defecto insertados
- [ ] Backend reiniciado
- [ ] Panel de administración muestra controles de audio
- [ ] Configuración se guarda correctamente
- [ ] Pantalla de TV carga configuración al iniciar
- [ ] Videos se reproducen con volumen configurado
- [ ] Audio ducking funciona durante anuncios
- [ ] Volumen se restaura después del anuncio

---

## 📊 API Endpoints

### Obtener Configuración (Público)

```http
GET /api/configuracion-audio
```

**Respuesta:**
```json
{
  "success": true,
  "configuracion": {
    "volumen_videos": 15,
    "volumen_llamado": 100,
    "volumen_atenuacion": 5
  }
}
```

### Actualizar Configuración (Admin)

```http
PUT /api/configuracion-audio
Authorization: Bearer {token}
Content-Type: application/json

{
  "volumen_videos": 20,
  "volumen_llamado": 100,
  "volumen_atenuacion": 5
}
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Configuración actualizada exitosamente",
  "configuracion": {
    "volumen_videos": 20,
    "volumen_llamado": 100,
    "volumen_atenuacion": 5
  }
}
```

---

**¡El sistema de control de audio avanzado está completamente implementado!** 🎉

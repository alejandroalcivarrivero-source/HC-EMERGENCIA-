# CMS de Videos para SIGEMECH - Guía de Instalación y Uso

## 📋 Resumen

Se ha creado un módulo completo de gestión de videos educativos para la pantalla de TV de SIGEMECH. El sistema permite subir videos de YouTube o archivos locales, gestionarlos desde un panel de administración y reproducirlos automáticamente en la pantalla de TV.

---

## 🗄️ Base de Datos

### 1. Ejecutar Script SQL

Ejecuta el script `scripts/crear_tabla_multimedia_tv.sql` en tu base de datos MariaDB:

```sql
-- El script crea la tabla multimedia_tv con todos los campos necesarios
```

**Campos de la tabla:**
- `id`: ID único del video
- `titulo`: Título del video
- `url_video`: URL de YouTube o ruta del archivo local
- `tipo`: 'youtube' o 'local'
- `orden`: Orden de reproducción
- `activo`: Si el video está activo en la rotación
- `usuario_id`: ID del usuario que subió el video
- `fecha_creacion`: Fecha de creación
- `fecha_actualizacion`: Fecha de última actualización

---

## 🔧 Backend

### 2. Dependencias Instaladas

✅ `multer` - Para subida de archivos de video

### 3. Archivos Creados

- **Modelo:** `backend/models/multimedia_tv.js`
- **Controlador:** `backend/controllers/multimediaTvController.js`
- **Rutas:** `backend/routes/multimediaTv.js`

### 4. Rutas API

**Públicas (para la pantalla de TV):**
- `GET /api/multimedia-tv/activos` - Obtener videos activos ordenados

**Protegidas (solo administradores):**
- `GET /api/multimedia-tv` - Obtener todos los videos
- `POST /api/multimedia-tv` - Crear nuevo video (con subida de archivo opcional)
- `PUT /api/multimedia-tv/:id` - Actualizar video
- `DELETE /api/multimedia-tv/:id` - Eliminar video
- `PUT /api/multimedia-tv/orden/actualizar` - Actualizar orden de videos

### 5. Configuración de Archivos Estáticos

El backend está configurado para servir archivos estáticos desde `frontend/public/`. Los videos se guardan en:
```
frontend/public/uploads/videos/
```

---

## 🎨 Frontend

### 6. Componentes Creados

- **AdminVideos.jsx:** Panel de administración de videos
  - Subir videos (YouTube o local)
  - Listar videos con miniaturas
  - Editar videos
  - Eliminar videos
  - Activar/Desactivar videos
  - Reordenar videos (drag & drop)

- **PantallaTurnosEmergencia.jsx:** Modificado para consumir videos desde BD
  - Reproducción continua automática
  - Cambio automático al siguiente video cuando termina
  - Control de volumen (10% durante anuncios, 100% después)

### 7. Rutas Agregadas

- `/admin/videos` - Panel de administración (requiere rol administrador)

---

## 🚀 Instrucciones de Uso

### Paso 1: Ejecutar Script SQL

```bash
# Conectarse a MariaDB y ejecutar:
mysql -u usuario -p nombre_base_datos < scripts/crear_tabla_multimedia_tv.sql
```

### Paso 2: Reiniciar Backend

```bash
cd backend
npm start
# o
npm run dev
```

### Paso 3: Acceder al Panel de Administración

1. Inicia sesión como administrador (rol_id = 5)
2. Navega a `/admin/videos`
3. Haz clic en "Agregar Video"

### Paso 4: Agregar Videos

**Opción A: Video de YouTube**
1. Selecciona "YouTube" como tipo
2. Pega la URL del video (cualquier formato funciona)
3. El sistema convertirá automáticamente al formato embed

**Opción B: Video Local**
1. Selecciona "Archivo Local (MP4)" como tipo
2. Selecciona un archivo de video (máximo 500MB)
3. El archivo se subirá automáticamente

### Paso 5: Configurar Orden

- Arrastra y suelta los videos para cambiar el orden
- O edita cada video y cambia el número de "Orden de Reproducción"
- Menor número = se reproduce primero

### Paso 6: Activar/Desactivar Videos

- Solo los videos marcados como "Activo" aparecerán en la pantalla de TV
- Usa el botón "Activo/Inactivo" para controlar qué videos se muestran

---

## 📺 Pantalla de TV

### Funcionamiento Automático

1. **Carga de Videos:** Al cargar la pantalla, se obtienen automáticamente todos los videos activos ordenados
2. **Reproducción Continua:**
   - Videos de YouTube: Se reproducen en bucle automáticamente
   - Videos locales: Cuando termina uno, pasa automáticamente al siguiente
3. **Control de Volumen:**
   - Durante anuncios de pacientes: Volumen baja al 10%
   - Después del anuncio (4 segundos): Volumen vuelve al 100%

### Acceso

URL: `http://localhost:5173/pantalla-turnos-emergencia`

---

## 🔒 Seguridad

- Todas las rutas de administración están protegidas con `validarAdmin`
- Solo usuarios con `rol_id = 5` pueden acceder
- Los archivos subidos se validan por tipo MIME
- Tamaño máximo de archivo: 500MB

---

## 🐛 Solución de Problemas

### Error: "No se pueden cargar videos"

- Verifica que la tabla `multimedia_tv` existe en la base de datos
- Verifica que el backend está corriendo
- Revisa la consola del navegador para errores

### Error: "No se puede subir archivo"

- Verifica que el directorio `frontend/public/uploads/videos/` existe
- Verifica permisos de escritura en el directorio
- Verifica que el archivo no excede 500MB
- Verifica que el tipo de archivo es compatible (mp4, webm, ogg, mov)

### Los videos no se reproducen en la pantalla de TV

- Verifica que hay videos marcados como "Activo"
- Verifica que los videos tienen un orden válido
- Para videos locales, verifica que la ruta es correcta
- Para videos de YouTube, verifica que la URL es válida

### El volumen no se ajusta durante anuncios

- Para videos de YouTube, requiere que el iframe tenga `enablejsapi=1`
- Para videos locales, el control de volumen funciona automáticamente

---

## 📝 Notas Técnicas

### Formatos de Video Soportados

- **YouTube:** Cualquier URL de YouTube (se convierte automáticamente)
- **Local:** MP4, WebM, OGG, MOV

### Límites

- Tamaño máximo de archivo: 500MB
- Solo administradores pueden gestionar videos
- Los videos se ordenan por el campo `orden` (ascendente)

### Optimizaciones

- Los videos se cargan una vez al iniciar la pantalla de TV
- Los videos locales se reproducen secuencialmente
- Los videos de YouTube se reproducen en bucle individual

---

## ✅ Checklist de Verificación

- [ ] Script SQL ejecutado correctamente
- [ ] Tabla `multimedia_tv` creada en la base de datos
- [ ] Backend reiniciado después de instalar multer
- [ ] Directorio `frontend/public/uploads/videos/` existe
- [ ] Usuario administrador puede acceder a `/admin/videos`
- [ ] Se pueden agregar videos de YouTube
- [ ] Se pueden subir videos locales
- [ ] Los videos aparecen en la pantalla de TV
- [ ] Los videos se reproducen en orden correcto
- [ ] El volumen se ajusta durante anuncios

---

**¡El módulo CMS de Videos está listo para usar!** 🎉

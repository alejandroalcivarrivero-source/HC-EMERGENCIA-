# Solución de Error: Tabla configuracion_audio_tv no existe

## 🔴 Error Detectado

```
Table 'EMERGENCIA.configuracion_audio_tv' doesn't exist
```

## ✅ Solución

### Paso 1: Ejecutar Script SQL

Ejecuta el siguiente script en tu base de datos MariaDB:

**Archivo:** `scripts/crear_tabla_configuracion_audio.sql`

```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS configuracion_audio_tv (
    id INT(11) NOT NULL AUTO_INCREMENT,
    clave VARCHAR(50) NOT NULL UNIQUE COMMENT 'Clave única de configuración',
    valor VARCHAR(255) NOT NULL COMMENT 'Valor de la configuración',
    descripcion VARCHAR(500) NULL COMMENT 'Descripción de la configuración',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración de audio para la pantalla de TV de SIGEMECH';

-- Insertar valores por defecto
INSERT INTO configuracion_audio_tv (clave, valor, descripcion) VALUES
('volumen_videos', '15', 'Volumen general de videos educativos (0-100%)'),
('volumen_llamado', '100', 'Volumen de llamado (Ding-Dong y voz sintética) (0-100%)'),
('volumen_atenuacion', '5', 'Volumen de atenuación durante anuncios (0-100%)')
ON DUPLICATE KEY UPDATE valor = valor;
```

### Paso 2: Verificar Creación

Después de ejecutar el script, verifica que la tabla se creó:

```sql
SELECT * FROM configuracion_audio_tv;
```

Deberías ver 3 filas con los valores por defecto.

### Paso 3: Reiniciar Backend

Reinicia el backend para que cargue la nueva tabla:

```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm start
```

---

## 🛡️ Manejo de Errores Mejorado

He mejorado el controlador para que:

1. **Si la tabla no existe:** Devuelve valores por defecto con `success: true` para que el frontend funcione
2. **Si hay error de conexión:** Devuelve valores por defecto
3. **Si la tabla existe:** Funciona normalmente

**Nota:** El sistema funcionará con valores por defecto aunque la tabla no exista, pero para guardar configuraciones personalizadas necesitas crear la tabla.

---

## 📋 Valores por Defecto

Mientras no exista la tabla, el sistema usará estos valores:

- **volumen_videos:** 15%
- **volumen_llamado:** 100%
- **volumen_atenuacion:** 5%

Estos valores se aplicarán automáticamente en la pantalla de TV.

---

## ✅ Después de Ejecutar el Script

Una vez ejecutado el script SQL:

1. ✅ El error desaparecerá
2. ✅ Podrás guardar configuraciones personalizadas desde `/admin/videos`
3. ✅ Las configuraciones se guardarán en la base de datos
4. ✅ La pantalla de TV usará los valores configurados

---

**Ejecuta el script SQL y reinicia el backend para resolver el error.**

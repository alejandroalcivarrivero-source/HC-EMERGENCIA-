# Verificación: Base de datos EMERGENCIA vs Código del Proyecto

Este documento compara el esquema **real de la BD** (y, en su caso, exportaciones como **EMERGENCIA_ACT.sql**) con los **modelos, controladores y rutas** del proyecto para detectar tablas faltantes, columnas desalineadas y conexiones (FK) rotas o inexistentes.

**Última verificación:** 2025-01-27 — **contra la base de datos en vivo** (conexión directa vía backend).

**Scripts ejecutados (2025-01-27):**  
- `crear_tabla_configuracion_audio.sql`, `diagnosticos_form008_seccion_lm.sql` (vía `npm run ejecutar-sql`).  
- **Migración DROP + recreate:** `scripts/migrar_detalle_log_drop_recreate.sql` (elimina datos de prueba), luego `backend/scripts/create_tables_formulario008.sql` y `scripts/diagnosticos_form008_seccion_lm.sql`. **DETALLE_DIAGNOSTICOS** y **LOG_REASIGNACIONES_MEDICAS** quedan con la estructura que espera el código.

---

## 0. Verificación directa contra la BD (resultados reales)

Se ejecutó `backend/scripts/verificar_bd_directo.js` conectándose a la BD EMERGENCIA. Resumen **tras ejecutar los scripts**:

| Comprobación | Estado |
|--------------|--------|
| **Base de datos** | EMERGENCIA |
| **CERTIFICADOS_FIRMA** | ✅ Existe |
| **configuracion_audio_tv** | ✅ **Existe** (creada con script) |
| **DETALLE_DIAGNOSTICOS** | ✅ **OK** (migración DROP + recreate aplicada): `atencion_emergencia_id`, `codigo_cie10`, `padre_id`, `es_causa_externa`, `ESTADISTICO`, `usuario_id` |
| **LOG_REASIGNACIONES_MEDICAS** | ✅ **OK** (migración DROP + recreate aplicada): `atencion_emergencia_id`, `medico_anterior_id`, `medico_nuevo_id`, `usuario_reasignador_id` |
| **ADMISIONES** | ✅ `fecha_actualizacion` y `fecha_ultima_actividad` presentes |
| **CUMPLIMIENTO_PROCEDIMIENTOS** | ✅ `nombre_procedimiento_libre` presente |
| **Vista v_cie10_completo** | ✅ Existe |

**Conclusión:** Tras la migración DROP + recreate, **DETALLE_DIAGNOSTICOS** y **LOG_REASIGNACIONES_MEDICAS** tienen la estructura que espera el código. El módulo CIE-10 y la reasignación de médicos deberían funcionar correctamente.

**Repetir verificación:** desde `backend`, `npm run verificar-bd`.

---

## 1. Tablas que usa el código pero NO existen en la BD (verificación directa)

| Tabla | Modelo | Uso en código | En BD real | Acción |
|-------|--------|----------------|------------|--------|
| **CERTIFICADOS_FIRMA** | `certificadoFirma.js` | Firma electrónica (P12, Form 008) | ✅ **Existe** | Ninguna |
| **configuracion_audio_tv** | `configuracion_audio_tv.js` | Config. audio pantalla TV | ✅ **Existe** (creada con script) | Ninguna |

**Nota:** `multimedia_tv` existe en la BD. Para recrear **configuracion_audio_tv** si hiciera falta: `scripts/crear_tabla_configuracion_audio.sql`.

---

## 2. Tablas con estructura desfasada (BD real vs código)

Las siguientes discrepancias se **confirmaron en la BD en vivo** (y coinciden con lo que tendría un volcado antiguo tipo EMERGENCIA_ACT).

### 2.1 DETALLE_DIAGNOSTICOS

| Aspecto | BD actual | Código (modelo + controladores) |
|---------|-----------|----------------------------------|
| FK atención | `atencion_id` (int) | `atencion_emergencia_id` |
| FK CIE-10 | `cie10_id` (int → CAT_CIE10.id) | `codigo_cie10` (varchar → CAT_CIE10.codigo) |
| tipo_diagnostico | `PRESUNTIVO`, `DEFINITIVO`, `NO APLICA` | Incluye además **ESTADISTICO** (códigos Z) |
| Columnas extra | `fecha_registro` | `descripcion`, `orden`, `padre_id`, `es_causa_externa`, `usuario_id`, `createdAt`, `updatedAt` |

**Conclusión:** La BD real tiene la estructura antigua. El proyecto espera la estructura de:

1. **`backend/scripts/create_tables_formulario008.sql`** (tabla base con `atencion_emergencia_id`, `codigo_cie10`, etc.)
2. **`scripts/diagnosticos_form008_seccion_lm.sql`** (añade `padre_id`, `es_causa_externa`, `ESTADISTICO`, vista `v_cie10_completo`)

El módulo de diagnósticos CIE-10 **falla** con la estructura actual. Ejecutar los scripts anteriores en el orden indicado en `docs/CHECKLIST_BD_DIAGNOSTICOS_CIE10.md`.

---

### 2.2 LOG_REASIGNACIONES_MEDICAS

| Aspecto | BD actual | Código |
|---------|-----------|--------|
| FK atención | `atencion_id` | `atencion_emergencia_id` |
| Médico origen | `medico_origen_id` | `medico_anterior_id` |
| Médico destino | `medico_destino_id` | `medico_nuevo_id` |
| Motivo | `motivo` | `motivo_reasignacion` |
| Usuario reasignador | **No existe** | `usuario_reasignador_id` (NOT NULL en modelo) |
| Timestamps | `fecha_reasignacion` | `createdAt`, `updatedAt` |

**Conclusión:** La estructura en BD no coincide con el modelo. El proyecto usa la definición de **`create_tables_formulario008.sql`** (LOG_REASIGNACIONES_MEDICAS con `atencion_emergencia_id`, `medico_anterior_id`, `medico_nuevo_id`, `motivo_reasignacion`, `usuario_reasignador_id`). La reasignación de médicos falla con la estructura actual.

---

### 2.3 CUMPLIMIENTO_PROCEDIMIENTOS

| Aspecto | BD actual | Código |
|---------|-----------|--------|
| procedimiento_cat_id | `DEFAULT NULL` + `nombre_procedimiento_libre` | Modelo: `allowNull: false` (siempre catálogo) |
| fecha_hora | `timestamp NULL DEFAULT current_timestamp()` | Modelo usa `fecha_hora` sin problema |
| Resto | Coincide (estado, anulaciones, etc.) | OK |

**Observación:** La BD tiene `nombre_procedimiento_libre`. El modelo no lo define. Si se usan procedimientos libres, ampliar el modelo; si no, se puede dejar como está.

---

### 2.4 ADMISIONES

| Aspecto | BD actual | Código |
|---------|-----------|--------|
| `fecha_creacion` | Sí (NOT NULL, default current_timestamp) | Modelo **no** define |
| `fecha_actualizacion` | Sí (ON UPDATE current_timestamp) | Modelo mapea **fecha_ultima_actividad** → `fecha_actualizacion` |
| `fecha_ultima_actividad` | Sí (nullable) | Se usa en controladores para “última actividad” |
| `triaje_id` | Sí (nullable) | Modelo **no** define (usa triaje_preliminar_id, triaje_definitivo_id) |
| `motivo_consulta_sintoma_id` | NOT NULL | Modelo `allowNull: true` |

**Problema crítico – mapeo de fechas:**  
El modelo Admision define `fecha_ultima_actividad` con `field: 'fecha_actualizacion'`. En la BD existen **dos** columnas distintas:

- **fecha_actualizacion:** automática (ON UPDATE).
- **fecha_ultima_actividad:** “última actividad significativa” (manual).

Al guardar `fecha_ultima_actividad` desde el código, se escribe en `fecha_actualizacion` y nunca en `fecha_ultima_actividad`. **Recomendación:** En el modelo, mapear `fecha_ultima_actividad` → `fecha_ultima_actividad` y, si se usa, definir aparte `fecha_actualizacion` → `fecha_actualizacion`.

---

## 3. Vista v_cie10_completo

- **BD real:** La vista existe (`id`, `codigo`, `descripcion`, `capitulo`). ✅
- **Código:** Se usa en verificaciones y en `scripts/verificar_diagnosticos_cie10_bd.sql`.  
- **Script que la (re)crea:** `diagnosticos_form008_seccion_lm.sql`.

---

## 4. Conexiones / claves foráneas

### 4.1 Correctamente alineadas (modelo ↔ BD)

- **ADMISIONES** → PACIENTES, CAT_FORMAS_LLEGADA, CAT_FUENTES_INFORMACION, CAT_ESTADO_PACIENTE, CAT_TRIAJE (preliminar/definitivo), CAT_MOTIVO_CONSULTA_SINTOMAS (vía `Codigo`), USUARIOS_SISTEMA.
- **ATENCION_EMERGENCIA** → PACIENTES, ADMISIONES, USUARIOS_SISTEMA, `usuario_responsable_id` → USUARIOS_SISTEMA.
- **ATENCION_PACIENTE_ESTADO** → ADMISIONES, USUARIOS_SISTEMA (usuario responsable y usuario registro), ROLES, CAT_ESTADO_PACIENTE (`estado_id`).
- **SIGNOS_VITALES** → ADMISIONES, USUARIOS_SISTEMA.
- **CUMPLIMIENTO_PROCEDIMIENTOS** → ADMISIONES, CAT_PROCEDIMIENTOS_EMERGENCIA, USUARIOS_SISTEMA.
- **multimedia_tv**, **ORDENES_EXAMEN**, **ORDENES_IMAGEN**, **RECETAS_MEDICAS**: estructuras coherentes con el código.

### 4.2 DETALLE_DIAGNOSTICOS (si se usa estructura antigua del volcado)

- El código espera `atencion_emergencia_id` → ATENCION_EMERGENCIA.id y `codigo_cie10` → CAT_CIE10.codigo.
- En la BD actual aparecen `atencion_id` y `cie10_id` → CAT_CIE10.id. **Sin ejecutar los scripts de Form 008, las FK y nombres de columnas no coinciden.**

### 4.3 LOG_REASIGNACIONES_MEDICAS (si se usa estructura antigua)

- El código usa `atencion_emergencia_id`, `medico_anterior_id`, `medico_nuevo_id`, `usuario_reasignador_id`.
- La BD tiene `atencion_id`, `medico_origen_id`, `medico_destino_id` y **no** `usuario_reasignador_id`. Hace falta aplicar `create_tables_formulario008.sql` (o equivalente) para alinear.

---

## 5. Errores en el código detectados durante la verificación

### 5.1 Crear admisión y estado inicial (`admisionesController.createAdmision`)

```js
await AtencionPacienteEstado.create({
  admisionId: nuevaAdmision.id,
  estado: 'ADMITIDO'
});
```

- La tabla **ATENCION_PACIENTE_ESTADO** tiene `estado_id` (FK a CAT_ESTADO_PACIENTE), **no** `estado` (string).
- Además son obligatorios `usuario_id` y `rol_id`.

**Consecuencia:** El `create` fallará o violará NOT NULL. En otros flujos (p. ej. registro completo de paciente) se usa `createOrUpdateAtencionPacienteEstado(admision, 'ADMITIDO', usuarioId, rolId, ...)`, que sí rellena `estado_id`, `usuario_id` y `rol_id`.

**Recomendación:** En `createAdmision`, usar `createOrUpdateAtencionPacienteEstado` en lugar de crear directamente con `estado: 'ADMITIDO'`, y pasar siempre `usuarioId` y `rolId` (p. ej. desde `req.userId` y `req.rolId`).

---

## 6. Resumen de acciones recomendadas

| Prioridad | Acción |
|-----------|--------|
| ~~**Alta**~~ | ~~`crear_tabla_configuracion_audio.sql`~~ — **Hecho.** |
| ~~**Alta**~~ | ~~Migrar **DETALLE_DIAGNOSTICOS** y **LOG_REASIGNACIONES_MEDICAS**~~ — **Hecho** (DROP + recreate con `migrar_detalle_log_drop_recreate.sql` + `create_tables_formulario008` + `diagnosticos_form008_seccion_lm`). |
| **Alta** | Corregir **createAdmision**: dejar de usar `AtencionPacienteEstado.create` con `estado: 'ADMITIDO'`; usar `createOrUpdateAtencionPacienteEstado` con usuario y rol. |
| **Media** | Corregir mapeo en modelo **Admision**: `fecha_ultima_actividad` → columna `fecha_ultima_actividad`; no mapear a `fecha_actualizacion`. |
| **Media** | Revisar si **CUMPLIMIENTO_PROCEDIMIENTOS** debe soportar procedimientos libres (`nombre_procedimiento_libre`) y, en caso afirmativo, añadir el campo al modelo. |
| **Baja** | Decidir uso de `triaje_id` y `fecha_creacion` en ADMISIONES; si el código los usa, añadirlos al modelo. |

---

## 7. Scripts de verificación

- **`backend/scripts/verificar_bd_directo.js`**: Conecta a la BD y comprueba tablas/columnas en vivo. Desde `backend`: `npm run verificar-bd` (requiere red y `.env`).
- **`backend/scripts/ejecutar_sql_bd.js`**: Ejecuta scripts SQL contra la BD. Por defecto: `crear_tabla_configuracion_audio.sql` y `diagnosticos_form008_seccion_lm.sql`. Desde `backend`: `npm run ejecutar-sql` o `node scripts/ejecutar_sql_bd.js [ruta1] [ruta2] ...`.
- **`scripts/migrar_detalle_log_drop_recreate.sql`**: Elimina **DETALLE_DIAGNOSTICOS** y **LOG_REASIGNACIONES_MEDICAS** (solo datos de prueba). Ejecutar antes de `create_tables_formulario008` + `diagnosticos_form008_seccion_lm` para recrearlas con la estructura nueva.
- **`scripts/verificar_diagnosticos_cie10_bd.sql`**: Comprueba tablas y columnas del módulo CIE-10 (incl. `v_cie10_completo`).
- **`docs/CHECKLIST_BD_DIAGNOSTICOS_CIE10.md`**: Orden de ejecución de scripts para el módulo CIE-10.

Ejecutar la verificación directa tras aplicar los scripts de migración para confirmar que la BD queda alineada con el código.

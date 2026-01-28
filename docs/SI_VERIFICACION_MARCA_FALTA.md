# Si la verificación marca FALTA en todas las tablas

Cuando al ejecutar `scripts/verificar_diagnosticos_cie10_bd.sql` obtienes **FALTA** en **ATENCION_EMERGENCIA**, **DETALLE_DIAGNOSTICOS** y **CAT_CIE10**, suele ocurrir por una de estas causas:

---

## 1. Estás en otra base de datos

La **primera consulta** del script muestra la base actual: `SELECT DATABASE() AS base_de_datos_actual;`

- La aplicación usa la base indicada en **`backend/.env`** en la variable **`DB_NAME`** (por ejemplo `EMERGENCIA`).
- En phpMyAdmin/HeidiSQL/DBeaver: elige en el selector de bases la **misma** base que usa la app (`DB_NAME`).
- Vuelve a ejecutar el script de verificación sobre esa base.

---

## 2. La base existe pero está vacía (nunca se ejecutó el esquema)

Si ya estás en la base correcta (ej. `EMERGENCIA`) y aun así todo marca FALTA, hay que crear las tablas en este orden:

### Paso A — Crear el esquema principal

Ejecuta el script que crea las tablas de tu sistema. Ese script debe crear, entre otras:

- **ATENCION_EMERGENCIA**
- **CAT_CIE10**
- **PACIENTES**, **ADMISIONES**, **USUARIOS_SISTEMA**, etc.

En este proyecto suele ser:

- **`scripts/EMERGENCIA.sql`**

Ábrelo en tu cliente SQL y ejecútalo **sobre la base que usa la app** (la misma que tienes en `DB_NAME`).  
Si tu esquema viene de otro archivo (por ejemplo un dump o un script distinto), ejecuta ese.

### Paso B — Crear DETALLE_DIAGNOSTICOS

Cuando **ATENCION_EMERGENCIA** y **CAT_CIE10** ya existan:

- Ejecuta **`backend/scripts/create_tables_formulario008.sql`** sobre la misma base.

Ese script crea la tabla **DETALLE_DIAGNOSTICOS** con las columnas base y las claves foráneas necesarias.

### Paso C — Ajustes para el módulo CIE-10

Para que el módulo de Diagnósticos CIE-10 funcione correctamente:

- Ejecuta **`scripts/diagnosticos_form008_seccion_lm.sql`** sobre la misma base.

Ese script agrega **padre_id**, **es_causa_externa**, amplía **tipo_diagnostico** con **ESTADISTICO** y crea la vista **v_cie10_completo**.

---

## 3. Resumen de archivos y orden

| Orden | Archivo | Qué hace |
|-------|---------|----------|
| 1 | `scripts/EMERGENCIA.sql` | Crea ATENCION_EMERGENCIA, CAT_CIE10 y el resto del esquema (si es tu script principal). |
| 2 | `backend/scripts/create_tables_formulario008.sql` | Crea DETALLE_DIAGNOSTICOS y sus FKs. |
| 3 | `scripts/diagnosticos_form008_seccion_lm.sql` | Añade padre_id, es_causa_externa, ESTADISTICO y vista v_cie10_completo. |

Ejecuta siempre sobre la **misma base** que configuraste en **`DB_NAME`** del backend.

---

## 4. Sobre el mensaje “La selección actual no contiene una columna única”

Ese aviso lo muestra **phpMyAdmin** (o el cliente que uses) cuando el resultado de una consulta no tiene una fila/columna que identifique cada fila de forma única. No es un error de la base de datos ni del script: es solo que la herramienta no permite editar esa grilla.  
Puedes ignorarlo para estas consultas de verificación; lo importante son los valores **OK** / **FALTA** que devuelve cada consulta.

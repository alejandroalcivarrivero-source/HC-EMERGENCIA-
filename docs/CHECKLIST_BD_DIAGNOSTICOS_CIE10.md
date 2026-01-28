# Checklist BD — Módulo Diagnósticos CIE-10

Para que la pestaña **Diagnósticos** muestre el formulario CIE y la tabla "Diagnósticos registrados", la base de datos debe tener creadas las tablas y columnas que usa el backend.

## 1. Orden de scripts a ejecutar

| Orden | Script | Cuándo |
|-------|--------|--------|
| 1 | `scripts/EMERGENCIA.sql` (o el script que crea tu BD) | Si la base está recién creada. Debe existir `ATENCION_EMERGENCIA` y `CAT_CIE10`. |
| 2 | `backend/scripts/create_tables_formulario008.sql` | Si **no** existe la tabla `DETALLE_DIAGNOSTICOS`. Crea la tabla con columnas base. |
| 3 | **`scripts/diagnosticos_form008_seccion_lm.sql`** | **Obligatorio** para el módulo CIE-10. Añade `padre_id`, `es_causa_externa` y amplía `tipo_diagnostico` con `ESTADISTICO`. Crea la vista `v_cie10_completo`. |
| 4 | `scripts/estados_atencion_formulario008.sql` | Si usas estados de firma BORRADOR / PENDIENTE_FIRMA / FINALIZADO_FIRMADO en `ATENCION_EMERGENCIA`. |
| 5 | `backend/scripts/agregar_columna_usuario_responsable.sql` | Opcional. Para `usuario_responsable_id` en atención. |
| 6 | Columna `usuario_id` en DETALLE_DIAGNOSTICOS | Opcional. Comentada en `diagnosticos_form008_seccion_lm.sql` (sección 2.4). Si la usas: `ALTER TABLE DETALLE_DIAGNOSTICOS ADD COLUMN usuario_id INT(11) DEFAULT NULL;` y FK a USUARIOS_SISTEMA si aplica. |

## 2. Verificación

Ejecuta en tu base de datos:

```bash
# Desde la raíz del proyecto, o abriendo el archivo en tu cliente SQL:
scripts/verificar_diagnosticos_cie10_bd.sql
```

Ese script comprueba:

- Existencia de `ATENCION_EMERGENCIA`, `DETALLE_DIAGNOSTICOS`, `CAT_CIE10`
- Que `DETALLE_DIAGNOSTICOS` tenga `padre_id` y `es_causa_externa`
- Que `tipo_diagnostico` incluya el valor `ESTADISTICO`

Si algo falla, vuelve a ejecutar los scripts indicados en el orden anterior.

## 3. Asociaciones importantes

- **DETALLE_DIAGNOSTICOS.atencion_emergencia_id** → **ATENCION_EMERGENCIA.id** (ya definida en `create_tables_formulario008.sql`).
- **DETALLE_DIAGNOSTICOS.codigo_cie10** → **CAT_CIE10.codigo** (ya definida en `create_tables_formulario008.sql`).
- **DETALLE_DIAGNOSTICOS.padre_id** → **DETALLE_DIAGNOSTICOS.id** (se crea en `diagnosticos_form008_seccion_lm.sql`).

## 4. "Guarde la atención primero"

Ese mensaje aparece cuando **aún no existe** un registro en `ATENCION_EMERGENCIA` para la admisión actual. El registro se crea cuando:

1. Se **autoguarda** el formulario (por ejemplo, al escribir en Atención Inicial y esperar ~2 segundos), o  
2. Se hace **Guardar** en el formulario.

Si ya guardaste o autoguardaste y sigues viendo el mensaje, recarga la página o cambia de pestaña y vuelve a Diagnósticos; con el último cambio, tras el autoguardado la pestaña debería mostrar el módulo CIE sin recargar.

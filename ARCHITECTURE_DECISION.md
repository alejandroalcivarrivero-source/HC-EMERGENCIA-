# Decisión de Arquitectura: Guardado de Formulario Médico

## Decisión: Guardado Automático por Sección (Auto-Save)

### Estructura de Base de Datos
**Mantener una sola tabla `ATENCION_EMERGENCIA`** con todos los campos.

### Estrategia de Guardado

#### 1. **Guardado Automático (Auto-Save)**
- Cada vez que el usuario completa una sección y cambia de pestaña, guardar automáticamente
- Guardar también después de X segundos de inactividad (debounce)
- Guardar al cerrar/recargar la página (beforeunload)

#### 2. **Estado en Frontend**
- Mantener estado local (`atencionEmergenciaData`) para edición rápida
- Sincronizar con backend periódicamente
- Indicador visual de "Guardando..." / "Guardado"

#### 3. **Backend**
- Endpoint PUT `/api/atencion-emergencia/:id` para actualizaciones parciales
- Si no existe registro, crear uno con `estado: 'BORRADOR'`
- Al finalizar, marcar como `estado: 'COMPLETADO'`

### Flujo de Usuario

```
1. Usuario abre formulario → Cargar datos existentes (si hay)
2. Usuario completa Sección C → Auto-guardar después de 2 segundos
3. Usuario cambia a Sección D → Auto-guardar inmediatamente
4. Usuario completa Sección D → Auto-guardar después de 2 segundos
5. ... (continúa para todas las secciones)
6. Usuario hace clic en "Guardar Atención Completa" → Marcar como COMPLETADO
```

### Campos Adicionales Sugeridos

```sql
ALTER TABLE ATENCION_EMERGENCIA ADD COLUMN estado ENUM('BORRADOR', 'COMPLETADO') DEFAULT 'BORRADOR';
ALTER TABLE ATENCION_EMERGENCIA ADD COLUMN fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE ATENCION_EMERGENCIA ADD COLUMN secciones_completadas JSON; -- ['C', 'D', 'E'] para tracking
```

### Ventajas de este Enfoque

✅ **No requiere cambios en estructura de BD** (ya existe la tabla)
✅ **Mejor UX** - El usuario no pierde trabajo
✅ **Auditoría completa** - Se puede ver qué se guardó y cuándo
✅ **Recuperación fácil** - Si hay error, los datos ya están guardados
✅ **Escalable** - Fácil agregar más secciones

### Desventajas de Tablas Separadas

❌ **Complejidad innecesaria** - Más JOINs, más queries
❌ **Transacciones complejas** - Necesitas asegurar integridad entre múltiples tablas
❌ **Más código** - Más modelos, más controladores
❌ **No aporta valor** - Las secciones son parte de una sola atención médica

### Implementación Técnica

#### Frontend (React)
- `useEffect` con debounce para auto-save
- `beforeunload` event listener para guardar al salir
- Indicador de estado de guardado
- Manejo de errores con retry

#### Backend (Node.js/Express)
- Endpoint PUT que acepta actualizaciones parciales
- Validación de campos requeridos solo al finalizar
- Logging de cambios para auditoría

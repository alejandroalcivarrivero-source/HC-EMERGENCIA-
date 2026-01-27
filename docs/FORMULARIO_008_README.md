# Implementación del Formulario 008 - Sistema de Emergencia

## 📋 Descripción

Este documento describe la implementación completa del flujo médico del Formulario 008 (Emergencia) con las siguientes funcionalidades:

1. **Dashboard de Pendientes**: Bandeja de atenciones pendientes de firma
2. **Formulario 008 con Inteligencia Clínica**: Pre-llenado automático desde admisiones
3. **Diagnósticos CIE-10**: Gestión con regla de la letra Z
4. **Reasignación de Pacientes**: Transferencia entre médicos
5. **Firma Electrónica**: Motor de firma con certificados .p12

## 🗄️ Base de Datos

### Tablas Nuevas

1. **DETALLE_DIAGNOSTICOS**: Almacena los diagnósticos CIE-10 asociados a cada atención
2. **LOG_REASIGNACIONES_MEDICAS**: Registra el historial de reasignaciones

### Modificaciones a Tablas Existentes

- **ATENCION_EMERGENCIA**: Se agregaron los campos `estado_firma` y `usuario_responsable_id`

### Script SQL

Ejecutar el script `backend/scripts/create_tables_formulario008.sql` en la base de datos para crear las tablas necesarias.

## 🔧 Instalación

### Backend

1. Navegar a la carpeta del backend:
```bash
cd "HC EMERGENCIA/backend"
```

2. Instalar dependencias:
```bash
npm install
```

Las nuevas dependencias incluyen:
- `pdfkit`: Para generar PDFs
- `pdf-lib`: Para manipular PDFs
- `node-forge`: Para procesar certificados .p12

3. Ejecutar el script SQL para crear las tablas:
```sql
-- Ejecutar en la base de datos EMERGENCIA
source backend/scripts/create_tables_formulario008.sql
```

### Frontend

Las dependencias ya están instaladas. No se requieren nuevas dependencias.

## 🚀 Uso

### Dashboard de Pendientes

**Ruta**: `/pendientes-firma`

- **Médicos**: Ven solo sus atenciones pendientes (filtradas por `usuario_responsable_id`)
- **Admin**: Ven todas las pendientes con filtro opcional por médico
- **Alertas**: Muestra alertas visuales para atenciones pendientes por más de 24 horas
- **Acciones**: 
  - "Continuar Atención": Abre el formulario para editar
  - "Firmar Directamente": Valida y redirige a la página de firma

### Formulario 008

**Ruta**: `/atencion-emergencia-page/:admisionId`

**Características**:
- Pre-llenado automático del motivo de consulta desde `ADMISIONES`
- Visualización del historial de signos vitales en componente cronológico
- Integración con el componente de diagnósticos CIE-10
- Botón de reasignación disponible

### Diagnósticos CIE-10

**Componente**: `DiagnosticosCIE10`

**Regla de la Letra Z**:
- Si el código CIE-10 empieza con 'Z', el tipo de diagnóstico se establece automáticamente como 'NO APLICA'
- El selector de tipo se deshabilita para códigos Z
- Para otros códigos, permite seleccionar 'PRESUNTIVO' o 'DEFINITIVO'

**Funcionalidades**:
- Búsqueda de códigos CIE-10
- Agregar, editar y eliminar diagnósticos
- Validación antes de permitir la firma

### Reasignación de Pacientes

**Componente**: `ReasignarPacienteModal`

**Características**:
- Lista de médicos disponibles
- Campo de motivo de reasignación obligatorio
- Registro en `LOG_REASIGNACIONES_MEDICAS`
- Actualización automática de `usuario_responsable_id`

### Firma Electrónica

**Ruta**: `/firmar-atencion/:atencionId`

**Proceso**:
1. Validación: Verifica que exista al menos un diagnóstico DEFINITIVO (excepto códigos Z)
2. Carga de certificado: Solicita archivo .p12 y contraseña
3. Generación de PDF: Crea el Formulario 008 en formato PDF
4. Firma digital: Firma el PDF con el certificado (procesado en memoria)
5. Bloqueo: Cambia `estado_firma` a 'FIRMADO' y bloquea el registro (Read Only)

**Nota**: El certificado .p12 se procesa en memoria y no se almacena en el servidor.

## 📡 API Endpoints

### Pendientes de Firma
- `GET /api/pendientes-firma` - Obtener atenciones pendientes
- `GET /api/pendientes-firma/prellenado/:admisionId` - Datos para pre-llenado

### Diagnósticos
- `GET /api/diagnosticos/atencion/:atencionId` - Obtener diagnósticos
- `POST /api/diagnosticos/atencion/:atencionId` - Agregar diagnóstico
- `PUT /api/diagnosticos/:diagnosticoId` - Actualizar diagnóstico
- `DELETE /api/diagnosticos/:diagnosticoId` - Eliminar diagnóstico
- `GET /api/diagnosticos/validar-firma/:atencionId` - Validar si puede firmar

### Reasignación
- `POST /api/reasignacion/atencion/:atencionId` - Reasignar atención
- `GET /api/reasignacion/historial/:atencionId` - Historial de reasignaciones
- `GET /api/reasignacion/medicos` - Lista de médicos disponibles

### Firma Electrónica
- `POST /api/firma-electronica/firmar/:atencionId` - Firmar atención (multipart/form-data con certificado)
- `GET /api/firma-electronica/preview/:atencionId` - Vista previa del PDF

## 🔒 Seguridad

- Los certificados .p12 se procesan en memoria y nunca se almacenan
- Validación de token JWT en todas las rutas
- Validación de permisos según rol (médico vs admin)
- Bloqueo de edición después de la firma

## ⚠️ Notas Importantes

1. **Firma Digital**: La implementación actual de firma digital es básica. Para producción, se recomienda usar bibliotecas especializadas como `pdf-signer` o servicios de firma digital certificados.

2. **Rol de Admin**: El código asume que el rol_id 5 es admin. Ajustar según tu sistema de roles.

3. **Rol de Médico**: El código asume que el rol_id 1 es médico. Ajustar según tu sistema de roles.

4. **Validación de Firma**: Se requiere al menos un diagnóstico DEFINITIVO, excepto cuando todos los diagnósticos son códigos Z (que se marcan como 'NO APLICA').

## 🐛 Solución de Problemas

### Error al instalar dependencias
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de conexión a base de datos
- Verificar que el túnel SSH esté activo
- Verificar credenciales en `.env`

### Error al firmar PDF
- Verificar que el certificado .p12 sea válido
- Verificar que la contraseña sea correcta
- Verificar que existan diagnósticos DEFINITIVOS

## 📝 Próximos Pasos

1. Implementar firma digital robusta con biblioteca especializada
2. Agregar notificaciones cuando hay pendientes por más de 24 horas
3. Implementar reportes de atenciones firmadas
4. Agregar auditoría completa de cambios

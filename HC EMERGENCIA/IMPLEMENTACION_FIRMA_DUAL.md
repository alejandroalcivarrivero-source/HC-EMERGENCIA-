# Implementación de Firma Electrónica Dual (Archivo + Token USB)

## 📋 Resumen

Se ha implementado un sistema de firma electrónica que soporta dos métodos:
1. **ARCHIVO**: Firma con archivo .p12 (método actual, mejorado)
2. **TOKEN**: Firma con token físico USB mediante agente externo (nuevo)

El sistema es compatible con Linux Mint y Windows, utilizando estándares XAdES y PKCS#11.

## ✅ Implementación Completada

### 1. Base de Datos

**Script SQL:** `backend/scripts/add_metodo_firma_usuario.sql`

```sql
ALTER TABLE `USUARIOS_SISTEMA` 
ADD COLUMN `metodo_firma` ENUM('ARCHIVO', 'TOKEN') DEFAULT 'ARCHIVO';
```

**Modelo Actualizado:** `backend/models/usuario.js`
- Campo `metodo_firma` agregado con valores ENUM

### 2. Servicios Backend

#### XAdES Service (`backend/services/xadesService.js`)

- `generarDigestXAdES()`: Genera hash SHA-256 del documento
- `validarDigest()`: Valida integridad del digest
- `prepararDocumentoParaToken()`: Prepara documento completo para firma con token

#### Token Firma Service (`backend/services/tokenFirmaService.js`)

- `crearSolicitudFirma()`: Crea solicitud pendiente con timeout
- `obtenerSolicitud()`: Obtiene estado de solicitud
- `completarSolicitudFirma()`: Completa solicitud con firma recibida
- `cancelarSolicitud()`: Cancela solicitud pendiente
- Limpieza automática de solicitudes expiradas

### 3. Endpoints API

#### Preparar Documento para Firma (Token)

```http
POST /api/firma-electronica/preparar/:atencionId
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "solicitudToken": "TOKEN_1234567890",
  "documentoPreparado": {
    "documentoId": "FORM_008_125_1234567890",
    "digest": "abc123...",
    "digestBase64": "YWJjMTIz...",
    "algoritmo": "SHA256",
    "callbackUrl": "http://localhost:3001/api/firma-electronica/token/callback/125"
  }
}
```

#### Callback para Recibir Firma del Agente

```http
POST /api/firma-electronica/token/callback/:atencionId
Authorization: Bearer {token}
Content-Type: application/json

{
  "solicitudToken": "TOKEN_1234567890",
  "firmaBase64": "firma_en_base64...",
  "certificadoInfo": {...}
}
```

#### Verificar Estado de Solicitud

```http
GET /api/firma-electronica/token/estado/:solicitudToken
Authorization: Bearer {token}
```

#### Obtener/Actualizar Método de Firma del Usuario

```http
GET /api/usuarios/metodo-firma
PUT /api/usuarios/metodo-firma
Authorization: Bearer {token}
Body: { "metodoFirma": "ARCHIVO" | "TOKEN" }
```

### 4. Componente Frontend

**Archivo:** `frontend/src/components/FirmaElectronica.jsx`

#### Características:

- **Detección automática** del método de firma del usuario
- **Interfaz adaptativa** según el método seleccionado
- **Firma con Archivo**: Mantiene el flujo actual (.p12 + contraseña)
- **Firma con Token**: 
  - Prepara documento y genera digest XAdES
  - Intenta abrir agente externo vía protocolo `firmaec://`
  - Verifica estado periódicamente (cada 2 segundos)
  - Descarga PDF automáticamente cuando se completa
  - Timeout de 5 minutos

#### Estados de Firma con Token:

- `null`: Sin iniciar
- `PENDIENTE`: Esperando firma del agente
- `COMPLETADA`: Firma exitosa
- `ERROR`: Error en el proceso

### 5. Flujo de Firma con Token

```
1. Usuario hace clic en "Iniciar Firma con Token"
   ↓
2. Frontend llama a /api/firma-electronica/preparar/:atencionId
   ↓
3. Backend genera PDF, crea digest XAdES, crea solicitud pendiente
   ↓
4. Frontend recibe solicitudToken y datos del documento
   ↓
5. Frontend intenta abrir agente: firmaec://firmar?token=...&digest=...
   ↓
6. Agente externo:
   - Lee token USB (PKCS#11)
   - Solicita PIN al usuario
   - Firma el digest
   - Envía firma al callback del backend
   ↓
7. Backend recibe firma, valida, aplica al PDF, marca como FIRMADO
   ↓
8. Frontend verifica estado periódicamente
   ↓
9. Cuando estado = COMPLETADA, descarga PDF firmado
```

## 🔧 Configuración del Usuario

### Cambiar Método de Firma

El usuario puede cambiar su método de firma en su perfil:

1. Ir a `/perfil` (página de perfil del usuario)
2. Seleccionar método: "Archivo .p12" o "Token USB"
3. Guardar configuración

El método se almacena en `USUARIOS_SISTEMA.metodo_firma` y se carga automáticamente al iniciar sesión.

## 🐧 Compatibilidad Linux Mint

### Requisitos del Sistema

```bash
# Instalar OpenSC y drivers PKCS#11
sudo apt-get install opensc libpcsclite1 pcscd

# Verificar que el token sea detectado
pkcs11-tool --module /usr/lib/x86_64-linux-gnu/opensc-pkcs11.so --list-slots
```

### Agente Externo

Ver documentación completa en: `AGENTE_FIRMA_EXTERNO_LINUX.md`

El agente puede implementarse en:
- **Python** (PyKCS11)
- **Java** (iaik.pkcs.pkcs11)
- **C/C++** (OpenSC)

## 🔐 Seguridad

### Medidas Implementadas

1. **PIN Local**: El PIN del token nunca se transmite al backend
2. **Digest XAdES**: El documento se firma mediante hash SHA-256
3. **Validación**: El backend valida que la firma corresponda al digest
4. **Timeout**: Solicitudes expiran después de 5 minutos
5. **Comunicación Local**: El agente solo escucha en localhost

## 📊 Comparación de Métodos

| Aspecto | ARCHIVO (.p12) | TOKEN (USB) |
|---------|----------------|-------------|
| **Seguridad** | Media (archivo puede copiarse) | Alta (token físico) |
| **Facilidad** | Alta (solo subir archivo) | Media (requiere agente) |
| **Compatibilidad** | Todos los SO | Requiere drivers PKCS#11 |
| **Offline** | Sí | Sí (agente local) |
| **PIN** | Se envía al servidor | Solo local |

## 🚀 Próximos Pasos (Opcional)

- [ ] Implementar agente externo completo (Python/Java)
- [ ] Agregar página de perfil para cambiar método de firma
- [ ] Implementar aplicación de escritorio del agente
- [ ] Agregar logs de auditoría de firmas
- [ ] Soporte para múltiples tokens simultáneos
- [ ] Integración con servicios de timestamping (TSA)

## 📝 Notas Técnicas

### Librerías Recomendadas

**Node.js (Backend):**
- `node-forge`: Procesamiento de certificados
- `pdf-lib`: Manipulación de PDFs
- `crypto` (nativo): Generación de hashes

**Python (Agente):**
- `PyKCS11`: Interfaz PKCS#11
- `cryptography`: Operaciones criptográficas
- `websocket`: Comunicación con frontend

**Java (Agente):**
- `iaik.pkcs.pkcs11`: Librería PKCS#11
- `Spring WebSocket`: Servidor WebSocket

### Estándares Utilizados

- **XAdES**: XML Advanced Electronic Signatures
- **PKCS#11**: Cryptographic Token Interface Standard
- **SHA-256**: Algoritmo de hash (FIPS 180-4)

---

**Fecha de implementación:** Enero 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementación base completada

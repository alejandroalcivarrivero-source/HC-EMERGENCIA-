# Firma Electrónica con Certificado Guardado (Multiplataforma)

## Resumen

El sistema permite que médicos en **Linux Mint, Windows y macOS** firmen el Formulario 008 (y futuras evoluciones como 005) sin instalar software local. Opciones:

1. **Certificado guardado**: El médico sube el .p12 una vez en **Ajustes > Firma Electrónica**. Se almacena cifrado (AES-256) en servidor. Al firmar, solo se solicita la **clave de firma** (contraseña del certificado) en un modal. La contraseña **nunca se guarda** (cumplimiento normativo).
2. **Certificado en el momento**: Flujo legado: subir .p12 y contraseña en la propia pantalla de firma.

En ambos casos se genera un **Sello Digital** (nombre, CI, entidad emisora, fecha de firma, digest SHA-256, firma RSA) que se guarda en la atención y se incluye en el PDF en formato legal MSP.

---

## Arquitectura de seguridad

- **Cifrado en reposo**: El archivo .p12 se cifra con **AES-256-GCM** antes de guardarlo en la base de datos. La clave de cifrado se deriva de `FERME_ENCRYPTION_KEY` (variable de entorno, mínimo 16 caracteres).
- **Contraseña del certificado**: Solo se usa en memoria para (1) validar/extraer metadatos al subir y (2) descifrar el .p12 al firmar. **No se persiste en BD ni en logs.**
- **Metadatos guardados**: Nombre del titular, CI, entidad emisora y fecha de expiración (solo para mostrar en UI y validaciones).

---

## Compatibilidad multiplataforma (Linux / Windows / macOS)

Todas las librerías usadas son **agnósticas al sistema operativo**:

| Componente              | Librería      | Tipo              | SO                       |
|-------------------------|---------------|-------------------|--------------------------|
| Cifrado AES-256-GCM      | Node `crypto` | Built-in          | Linux, Windows, macOS    |
| Lectura/metadatos .p12   | `node-forge`  | JavaScript puro   | Linux, Windows, macOS    |
| Firma RSA-SHA256        | `node-forge`  | JavaScript puro   | Linux, Windows, macOS    |
| Digest SHA-256          | Node `crypto` | Built-in          | Linux, Windows, macOS    |
| Generación PDF          | `pdfkit`      | JS/Node           | Linux, Windows, macOS    |

No hay dependencias nativas (PKCS#11, drivers de token, etc.) en este flujo. El resultado (PDF con sello) es el mismo en todas las plataformas.

---

## API Backend

Base: `/api/firma-electronica`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | `/validar-p12` | Multipart: `certificado` (.p12), `password`. Devuelve solo metadatos (nombre, ci, entidadEmisora, fechaExpiracion). No guarda nada. |
| POST   | `/guardar-certificado` | Multipart: `certificado`, `password`. Valida, cifra con AES-256 y guarda/actualiza el certificado del usuario. |
| GET    | `/certificado/info` | Devuelve `{ tieneCertificado, metadatos }` del usuario autenticado. |
| POST   | `/firmar-con-certificado/:atencionId` | Body JSON: `{ password }`. Descifra .p12, firma contenido, guarda sello, actualiza atención. Responde `{ ok, sello }`. |
| POST   | `/firmar/:atencionId` | Multipart: `certificado`, `password`. Flujo legado: firma con .p12 subido en el momento y devuelve PDF. |
| GET    | `/preview/:atencionId` | PDF del Formulario 008 (con sección de sello digital si ya está firmado). |

---

## Base de datos

1. **Tabla `CERTIFICADOS_FIRMA`**  
   Script: `scripts/crear_tabla_certificados_firma.sql`  
   - Un registro por usuario (`usuario_id` único).  
   - Campos: `p12_cifrado` (LONGBLOB), `iv`, `algoritmo_cifrado`, `nombre_titular`, `ci_titular`, `entidad_emisora`, `fecha_expiracion`.

2. **Columna `sello_digital` en `ATENCION_EMERGENCIA`**  
   - TEXT, JSON del sello: `{ nombre, ci, entidadEmisora, fechaFirma, digestBase64, firmaBase64, algoritmo }`.  
   - El generador de PDF la usa para imprimir la sección "Firma electrónica / Sello digital (MSP)".

---

## Configuración

En `backend/.env`:

```env
FERME_ENCRYPTION_KEY=unaClaveSecretaDeAlMenos16Caracteres
```

Recomendado en producción: clave de 32 bytes (por ejemplo, 32 caracteres o hex de 64 caracteres) y gestionada de forma segura.

---

## Flujo de uso (certificado guardado)

1. El médico entra en **Ajustes > Firma Electrónica**.
2. Sube el archivo .p12 e ingresa la contraseña.
3. El sistema valida y muestra metadatos; el médico confirma y pulsa **Guardar certificado cifrado**.
4. Al firmar un Formulario 008, pulsa **Finalizar y Firmar**.
5. Se abre el **modal de clave de firma**: solo escribe la contraseña del certificado y confirma.
6. El backend descifra el .p12, firma el contenido (JSON canónico de la atención), genera el sello y actualiza la atención.
7. El frontend descarga el PDF (que ya incluye el sello en formato legal MSP).

---

## Formulario 005 (evoluciones futuras)

El diseño permite reutilizar el mismo flujo para Form 005 u otros formularios: el contenido a firmar sería el párrafo de evolución (o el JSON equivalente). Los endpoints de certificado guardado y de firma con modal de clave son independientes del tipo de formulario; solo hay que definir el “contenido canónico” a firmar y guardar el sello en el registro correspondiente.

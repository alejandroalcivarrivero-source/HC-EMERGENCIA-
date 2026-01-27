# Agente de Firma Externa - Compatibilidad Linux Mint

## 📋 Descripción

Este documento describe la implementación del **Agente de Firma Externa** para soportar tokens físicos USB en estaciones de trabajo Linux Mint. El agente actúa como puente entre el navegador web (que no puede acceder directamente al token) y el sistema de firma electrónica.

## 🏗️ Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Navegador  │         │   Backend    │         │   Agente    │
│   (React)   │ ──────> │   (Node.js)  │ <────── │   Externo   │
│             │         │              │         │  (Java/Python)│
└─────────────┘         └──────────────┘         └─────────────┘
     │                        │                        │
     │                        │                        │
     │                        │                        │
     └────────────────────────┴────────────────────────┘
                    Token USB (PKCS#11)
```

## 🔌 Protocolo de Comunicación

### Opción 1: Protocolo Personalizado (firmaec://)

El sistema web intenta abrir el agente mediante un protocolo personalizado:

```
firmaec://firmar?token=TOKEN_SOLICITUD&digest=DIGEST_BASE64&callback=CALLBACK_URL
```

**Ventajas:**
- Integración nativa con el sistema operativo
- No requiere servidor adicional
- Funciona offline

**Desventajas:**
- Requiere registro del protocolo en el SO
- Configuración inicial más compleja

### Opción 2: WebSocket Local

El agente escucha en un puerto local (ej: `localhost:8765`) y el frontend se conecta directamente.

**Ventajas:**
- Más flexible
- Permite comunicación bidireccional en tiempo real
- Fácil de depurar

**Desventajas:**
- Requiere que el agente esté siempre ejecutándose
- Posibles conflictos de puertos

## 📦 Implementación del Agente

### Requisitos

#### Linux Mint

```bash
# Instalar dependencias PKCS#11
sudo apt-get update
sudo apt-get install opensc libpcsclite1 pcscd

# Instalar librerías Java (si se usa Java)
sudo apt-get install default-jdk

# O Python (si se usa Python)
sudo apt-get install python3 python3-pip
pip3 install PyKCS11 cryptography requests
```

#### Windows

```bash
# Instalar drivers del token (proporcionados por el fabricante)
# Instalar Java o Python según corresponda
```

### Estructura del Agente

```
agente-firma/
├── src/
│   ├── main.py (o Main.java)
│   ├── pkcs11_handler.py
│   └── websocket_server.py
├── config/
│   └── config.json
├── README.md
└── requirements.txt (o pom.xml)
```

### Ejemplo: Agente en Python

```python
# agente-firma/src/main.py
import json
import base64
import requests
from PyKCS11 import PyKCS11Lib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
import websocket
import threading

class AgenteFirma:
    def __init__(self):
        self.pkcs11_lib = PyKCS11Lib()
        self.pkcs11_lib.load('/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so')  # Ruta del driver PKCS#11
        
    def firmar_digest(self, digest_base64, pin):
        """Firma un digest usando el token USB"""
        try:
            # Conectar al token
            session = self.pkcs11_lib.openSession(0)
            session.login(pin)
            
            # Obtener clave privada
            private_key = session.findObjects([(PyKCS11.CKA_CLASS, PyKCS11.CKO_PRIVATE_KEY)])[0]
            
            # Convertir digest de Base64 a bytes
            digest_bytes = base64.b64decode(digest_base64)
            
            # Firmar
            signature = session.sign(private_key, digest_bytes, PyKCS11.Mechanism(PyKCS11.CKM_SHA256_RSA_PKCS))
            
            # Cerrar sesión
            session.logout()
            session.closeSession()
            
            # Retornar firma en Base64
            return base64.b64encode(signature).decode('utf-8')
            
        except Exception as e:
            raise Exception(f"Error al firmar: {str(e)}")
    
    def enviar_firma_al_backend(self, solicitud_token, firma_base64, callback_url):
        """Envía la firma completada al backend"""
        try:
            response = requests.post(
                callback_url,
                json={
                    'solicitudToken': solicitud_token,
                    'firmaBase64': firma_base64,
                    'certificadoInfo': {
                        'algoritmo': 'SHA256',
                        'timestamp': datetime.now().isoformat()
                    }
                },
                headers={'Content-Type': 'application/json'}
            )
            return response.status_code == 200
        except Exception as e:
            raise Exception(f"Error al enviar firma: {str(e)}")

# Servidor WebSocket local
def on_message(ws, message):
    data = json.loads(message)
    if data['action'] == 'firmar':
        agente = AgenteFirma()
        firma = agente.firmar_digest(data['digest'], data['pin'])
        agente.enviar_firma_al_backend(
            data['solicitudToken'],
            firma,
            data['callbackUrl']
        )
        ws.send(json.dumps({'status': 'success', 'firma': firma}))

if __name__ == '__main__':
    ws = websocket.WebSocketServer('localhost', 8765, on_message)
    ws.run_forever()
```

### Ejemplo: Agente en Java

```java
// AgenteFirma.java
import iaik.pkcs.pkcs11.*;
import iaik.pkcs.pkcs11.objects.*;
import java.util.Base64;

public class AgenteFirma {
    private Module pkcs11Module;
    
    public AgenteFirma(String driverPath) {
        pkcs11Module = Module.getInstance(driverPath);
        pkcs11Module.initialize(null);
    }
    
    public String firmarDigest(String digestBase64, char[] pin) throws TokenException {
        Session session = pkcs11Module.getSlot(0).openSession(
            Token.SessionType.SERIAL_SESSION,
            Token.SessionReadWriteBehavior.RO_SESSION,
            null, null
        );
        
        session.login(Session.UserType.USER, pin);
        
        // Buscar clave privada
        PrivateKey privateKey = findPrivateKey(session);
        
        // Firmar
        Mechanism signatureMechanism = Mechanism.get(PKCS11Constants.CKM_SHA256_RSA_PKCS);
        byte[] digest = Base64.getDecoder().decode(digestBase64);
        byte[] signature = session.sign(signatureMechanism, privateKey, digest);
        
        session.logout();
        session.closeSession();
        
        return Base64.getEncoder().encodeToString(signature);
    }
}
```

## 🔧 Configuración del Sistema

### Linux Mint - Registro del Protocolo

Crear archivo `.desktop` para registrar el protocolo:

```ini
# ~/.local/share/applications/firmaec.desktop
[Desktop Entry]
Name=Agente de Firma Electrónica
Exec=/usr/local/bin/agente-firma %u
Type=Application
MimeType=x-scheme-handler/firmaec;
NoDisplay=true
```

Registrar el MIME type:

```bash
xdg-mime default firmaec.desktop x-scheme-handler/firmaec
```

### Windows - Registro del Protocolo

Crear entrada en el registro:

```reg
[HKEY_CLASSES_ROOT\firmaec]
@="URL:Firma Electrónica"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\firmaec\shell]

[HKEY_CLASSES_ROOT\firmaec\shell\open]

[HKEY_CLASSES_ROOT\firmaec\shell\open\command]
@="\"C:\\Program Files\\AgenteFirma\\agente-firma.exe\" \"%1\""
```

## 🔐 Seguridad

### Consideraciones

1. **PIN del Token**: El PIN nunca se transmite al backend. Solo se usa localmente en el agente.
2. **Comunicación Local**: El agente solo escucha en `localhost` (127.0.0.1).
3. **Validación de Certificado**: El backend valida que la firma corresponda al digest original.
4. **Timeout**: Las solicitudes de firma expiran después de 5 minutos.

## 📡 API del Backend

### Preparar Documento

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
  },
  "instrucciones": {
    "metodo": "TOKEN",
    "protocolo": "firmaec://"
  }
}
```

### Callback (Recibir Firma)

```http
POST /api/firma-electronica/token/callback/:atencionId
Authorization: Bearer {token}
Content-Type: application/json

{
  "solicitudToken": "TOKEN_1234567890",
  "firmaBase64": "firma_en_base64...",
  "certificadoInfo": {
    "algoritmo": "SHA256",
    "timestamp": "2026-01-26T10:30:00Z"
  }
}
```

### Verificar Estado

```http
GET /api/firma-electronica/token/estado/:solicitudToken
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "estado": "COMPLETADA",
  "completada": true,
  "tieneFirma": true,
  "fechaCreacion": "2026-01-26T10:25:00Z",
  "fechaExpiracion": "2026-01-26T10:30:00Z"
}
```

## 🚀 Instalación del Agente

### Linux Mint

```bash
# 1. Clonar o descargar el agente
cd ~/Downloads
git clone https://github.com/tu-repo/agente-firma.git
cd agente-firma

# 2. Instalar dependencias
pip3 install -r requirements.txt

# 3. Configurar driver PKCS#11
# Editar config/config.json con la ruta del driver:
# {
#   "pkcs11_driver": "/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so",
#   "websocket_port": 8765
# }

# 4. Instalar como servicio del sistema
sudo cp agente-firma.service /etc/systemd/system/
sudo systemctl enable agente-firma
sudo systemctl start agente-firma

# 5. Registrar protocolo
xdg-mime default firmaec.desktop x-scheme-handler/firmaec
```

### Windows

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Ejecutar instalador
python setup.py install

# 3. Registrar protocolo (ejecutar como administrador)
regedit firmaec.reg
```

## 🧪 Pruebas

### Probar Conexión al Token

```python
from PyKCS11 import PyKCS11Lib

lib = PyKCS11Lib()
lib.load('/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so')
slots = lib.getSlotList()
print(f"Tokens encontrados: {len(slots)}")
```

### Probar Firma

```bash
# Ejecutar agente en modo debug
python3 agente-firma/src/main.py --debug

# En otra terminal, probar WebSocket
wscat -c ws://localhost:8765
```

## 📝 Notas Técnicas

### Drivers PKCS#11 Comunes

- **OpenSC**: `/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so`
- **eToken**: `/usr/lib/libeToken.so`
- **SafeNet**: `/usr/lib/libaetpkss1.so`

### Compatibilidad

- ✅ Linux Mint 20.x / 21.x
- ✅ Ubuntu 20.04+
- ✅ Windows 10/11
- ✅ Tokens compatibles con PKCS#11

## 🔗 Referencias

- [PKCS#11 Standard](https://docs.oasis-open.org/pkcs11/pkcs11-base/v2.40/pkcs11-base-v2.40.html)
- [XAdES Standard](https://www.etsi.org/deliver/etsi_ts/101900_101999/101903/01.04.02_60/ts_101903v010402p.pdf)
- [OpenSC Documentation](https://github.com/OpenSC/OpenSC/wiki)

---

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Autor:** Sistema HC Emergencia - Centro de Salud Chone

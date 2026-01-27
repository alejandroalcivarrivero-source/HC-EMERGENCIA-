# TURNERO DIGITAL - Guía de Instalación y Configuración

## 📋 Resumen

Se ha implementado un **Turnero Digital** con actualización en tiempo real usando **Socket.io** para mostrar pacientes en turno en una pantalla de TV.

---

## 🚀 Instalación

### Backend

```bash
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm install socket.io
```

### Frontend

```bash
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
npm install socket.io-client
```

---

## 📁 Archivos Creados/Modificados

### Backend

1. **`backend/socket/socketServer.js`**
   - Inicializa el servidor Socket.io
   - Maneja conexiones y salas de turnero digital

2. **`backend/socket/socketEvents.js`**
   - Funciones para emitir eventos:
     - `emitEstadoCambiado()`: Cuando un paciente cambia a EN_ATENCION o SIGNOS_VITALES
     - `emitPacienteLlamado()`: Cuando se presiona el botón "Llamar"

3. **`backend/app.js`** (Modificado)
   - Integrado servidor HTTP para Socket.io
   - Inicializa Socket.io al arrancar

4. **`backend/controllers/atencionPacienteEstadoController.js`** (Modificado)
   - Emite eventos cuando cambia el estado del paciente

5. **`backend/controllers/admisionesController.js`** (Modificado)
   - Emite eventos cuando se incrementan intentos de llamado

### Frontend

1. **`frontend/src/hooks/useSocket.js`**
   - Hook personalizado para manejar conexión Socket.io
   - Escucha eventos y actualiza estado

2. **`frontend/src/pages/PantallaTurnos.jsx`**
   - Componente de pantalla de TV optimizado
   - Muestra pacientes en turno con efectos visuales
   - Reproduce audio y anuncios de voz

3. **`frontend/src/App.jsx`** (Modificado)
   - Agregada ruta `/pantalla-turnos` (pública)

---

## 🎯 Funcionalidades

### 1. Actualización en Tiempo Real

- **Eventos emitidos automáticamente:**
  - Cuando un paciente cambia a estado `EN_ATENCION` o `SIGNOS_VITALES`
  - Cuando se presiona el botón "Llamar" (incrementa `intentos_llamado`)

### 2. Interfaz de TV

- **Diseño optimizado para Smart TV:**
  - Pantalla completa sin menús
  - Fuentes grandes y legibles
  - Colores contrastantes (azul oscuro, amarillo, verde)
  - Indicador de conexión en tiempo real

- **Tabla de dos columnas:**
  - **PACIENTE**: Nombre + inicial del apellido (ej: "JUAN P.")
  - **ÁREA/CONSULTORIO**: Área asignada (ej: "Emergencia", "Médico")

### 3. Efectos Visuales

- **Parpadeo y resaltado:**
  - Cuando llega un evento de llamado, el paciente parpadea
  - Color verde intenso con borde resaltado
  - Duración: 15 segundos
  - Animación de pulso continua

- **Indicador de "No responde":**
  - Si `intentos_llamado >= 3`, muestra alerta roja
  - Muestra número de intentos

### 4. Audio

- **Sonido de campana:**
  - Se reproduce automáticamente al recibir evento de llamado
  - Dos tonos (Ding-Dong) usando Web Audio API

- **Voz sintética:**
  - Usa `SpeechSynthesis` del navegador
  - Anuncia: "Paciente [Nombre], por favor acercarse a [Área/Consultorio]"
  - Configurado para español (es-ES)
  - Se reproduce después del sonido de campana

---

## 🔧 Configuración

### CORS

El servidor Socket.io ya está configurado para aceptar conexiones desde:
- `http://localhost:5173`
- `http://localhost:5174`

Si necesitas agregar más orígenes, modifica `backend/app.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'TU_IP_TV'],
  // ...
}));
```

Y en `backend/socket/socketServer.js`:

```javascript
cors: {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'TU_IP_TV'],
  // ...
}
```

---

## 📺 Uso

### Acceder a la Pantalla de Turnos

1. **Abrir en navegador de TV:**
   ```
   http://localhost:5173/pantalla-turnos
   ```

2. **O en la red local:**
   ```
   http://TU_IP_SERVIDOR:5173/pantalla-turnos
   ```

### Activar Modo Pantalla Completa

En la mayoría de navegadores de TV o navegadores modernos:
- Presionar `F11` (Windows/Linux)
- O usar el modo pantalla completa del navegador

---

## 🔍 Eventos Socket.io

### Eventos Emitidos por el Servidor

1. **`paciente-estado-cambiado`**
   ```javascript
   {
     admisionId: number,
     pacienteId: number,
     nombrePaciente: string,
     estadoAnterior: string,
     estadoNuevo: 'EN_ATENCION' | 'SIGNOS_VITALES',
     areaConsultorio: string,
     timestamp: string
   }
   ```

2. **`paciente-llamado`**
   ```javascript
   {
     admisionId: number,
     pacienteId: number,
     nombrePaciente: string,
     intentosLlamado: number,
     areaConsultorio: string,
     timestamp: string
   }
   ```

### Eventos Emitidos por el Cliente

1. **`join-turnero`**
   - El cliente se une a la sala de turnero digital
   - Se emite automáticamente al conectar

---

## 🐛 Solución de Problemas

### La pantalla no se actualiza

1. Verificar que el servidor Socket.io esté corriendo:
   ```bash
   # Deberías ver en la consola del backend:
   ✅ Servidor Socket.io inicializado
   ✅ Cliente Socket.io conectado: [socket-id]
   ```

2. Verificar conexión en la pantalla:
   - Debe mostrar "🟢 EN LÍNEA" en verde
   - Si muestra "🔴 DESCONECTADO", revisar:
     - URL del servidor en `useSocket.js`
     - CORS configurado correctamente
     - Firewall no bloqueando conexiones

### No se reproduce el audio

1. **Verificar permisos del navegador:**
   - Algunos navegadores requieren interacción del usuario antes de reproducir audio
   - Hacer clic en la pantalla una vez para activar audio

2. **Verificar soporte de SpeechSynthesis:**
   - Abrir consola del navegador
   - Ejecutar: `'speechSynthesis' in window`
   - Debe retornar `true`

### Los pacientes no aparecen

1. Verificar que los eventos se estén emitiendo:
   - Revisar consola del backend
   - Debe aparecer: `📢 Evento emitido: paciente-estado-cambiado`

2. Verificar que el paciente esté en estado correcto:
   - Solo se muestran pacientes en `EN_ATENCION` o `SIGNOS_VITALES`

---

## 📝 Notas Adicionales

- **Ruta pública:** La ruta `/pantalla-turnos` es pública (no requiere autenticación) para facilitar el acceso desde la TV
- **Persistencia:** Los pacientes se mantienen en la lista hasta que cambien de estado o se recargue la página
- **Rendimiento:** Optimizado para Smart TV con actualizaciones eficientes usando Socket.io
- **Compatibilidad:** Funciona en navegadores modernos con soporte para WebSockets, Web Audio API y SpeechSynthesis

---

## 🎨 Personalización

### Cambiar colores

Editar `frontend/src/pages/PantallaTurnos.jsx`:
- Cambiar clases de Tailwind CSS según preferencias
- Modificar gradiente de fondo en línea 1 del componente

### Cambiar duración del efecto

Modificar timeout en `PantallaTurnos.jsx`:
```javascript
setTimeout(() => {
  // Cambiar 15000 (15 segundos) a otro valor
}, 15000);
```

### Cambiar mensaje de voz

Modificar en `PantallaTurnos.jsx`:
```javascript
const mensaje = `TU_MENSAJE_PERSONALIZADO ${nombrePaciente}, ${areaConsultorio}`;
```

---

## ✅ Checklist de Instalación

- [ ] Instalar `socket.io` en backend
- [ ] Instalar `socket.io-client` en frontend
- [ ] Verificar que el servidor inicie correctamente
- [ ] Abrir `/pantalla-turnos` en navegador
- [ ] Verificar conexión (debe mostrar "🟢 EN LÍNEA")
- [ ] Probar cambio de estado de paciente
- [ ] Probar botón "Llamar" en lista de pacientes
- [ ] Verificar audio y voz sintética

---

**¡Listo! El Turnero Digital está configurado y funcionando.** 🎉

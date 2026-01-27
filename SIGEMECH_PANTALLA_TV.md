# SIGEMECH - Pantalla de Llamado de Pacientes - Guía de Configuración

## 📺 Interfaz de TV Implementada

Se ha creado una interfaz profesional para Smart TV con diseño 70/30 optimizado para sistemas hospitalarios.

---

## 🎨 Características del Diseño

### Layout 70/30

- **Lado Izquierdo (70%):** Área principal de llamados
  - Nombre del paciente en letras grandes (text-7xl)
  - Área/Consultorio destacado
  - Animaciones de entrada (zoom-in + pulse)
  - Cambio de color de fondo cuando hay llamado activo

- **Lado Derecho (30%):** Videos educativos
  - Reproductor de video en bucle
  - Se silencia automáticamente durante anuncios
  - No interrumpe el audio de los llamados

### Header

- **Izquierda:** "SIGEMECH - EMERGENCIA"
- **Derecha:** 
  - Hora actual (formato 12 horas: "5:25 p. m.")
  - Fecha actual (formato: "25 Enero 2026")
  - Indicador de conexión Socket.io (🟢 EN LÍNEA / 🔴 DESCONECTADO)

### Footer

- Información del sistema
- Contador de pacientes en turno

---

## 🔊 Sistema de Audio

### Sonido de Campana (Ding-Dong)

- Se reproduce automáticamente al recibir evento `paciente-llamado`
- Dos tonos secuenciales (800Hz → 600Hz)
- Duración total: ~0.7 segundos

### Voz Sintética

- **Mensaje:** "Paciente [Nombre], por favor dirigirse a [Área]"
- **Idioma:** Español (es-ES)
- **Velocidad:** 0.85 (ligeramente más lenta para claridad)
- Se reproduce después del sonido de campana (500ms delay)

### Gestión de Video

- El video se **silencia automáticamente** durante el anuncio
- Se **restaura el volumen** después de 4 segundos
- El video continúa reproduciéndose en bucle sin interrumpirse

---

## 🎬 Animaciones

### Al recibir llamado:

1. **Animación de entrada (zoomIn):**
   - Escala de 0.5 → 1.05 → 1.0
   - Duración: 0.8 segundos
   - Efecto fade-in simultáneo

2. **Animación continua (pulse):**
   - Pulso suave mientras está activo
   - Duración: 2 segundos por ciclo
   - Se repite mientras el llamado está activo (15 segundos)

3. **Cambio de fondo:**
   - Fondo cambia de azul a verde durante el llamado
   - Transición suave (1 segundo)
   - Vuelve a azul después de 15 segundos

---

## 📱 Responsive Design

### Unidades utilizadas:

- **vh/vw:** Para altura y ancho de pantalla completa
- **flex:** Para distribución 70/30
- **text-7xl, text-5xl:** Fuentes escalables según tamaño de TV
- **max-w-5xl:** Limita el ancho máximo del contenido principal

### Adaptabilidad:

- **TV 32 pulgadas:** Funciona perfectamente
- **Pantalla 4K:** Escala automáticamente aprovechando todo el espacio
- **Sin bordes vacíos:** El contenido ocupa 100% de la pantalla

---

## 🎥 Configuración de Video

### Opción 1: YouTube (Actual)

```jsx
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&loop=1&playlist=VIDEO_ID&mute=0&controls=0&enablejsapi=1"
/>
```

**Para cambiar el video:**
1. Reemplazar `VIDEO_ID` con el ID de tu video de YouTube
2. El video debe permitir embedding (configuración de YouTube)

### Opción 2: Video Local

1. Colocar video en `frontend/public/videos/educativo.mp4`
2. Descomentar la sección de video local en el componente
3. Comentar el iframe de YouTube

```jsx
<video
  ref={videoRef}
  className="w-full h-full object-cover"
  autoPlay
  loop
  muted={false}
  playsInline
  volume={0.3}
>
  <source src="/videos/educativo.mp4" type="video/mp4" />
</video>
```

---

## 🔧 Personalización

### Cambiar colores:

Editar clases de Tailwind en `PantallaTurnosEmergencia.jsx`:

```jsx
// Fondo normal
bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900

// Fondo durante llamado
bg-gradient-to-br from-green-900 via-green-800 to-blue-900

// Borde de tarjeta
border-8 border-green-400
```

### Cambiar tamaño de fuentes:

```jsx
// Nombre del paciente
text-7xl  // Cambiar a text-8xl para más grande

// Área/Consultorio
text-5xl  // Cambiar a text-6xl para más grande
```

### Cambiar duración del efecto:

```jsx
// En el useEffect de pacienteLlamado, cambiar:
setTimeout(() => {
  // ...
}, 15000); // Cambiar 15000 (15 segundos) a otro valor
```

---

## 📋 Checklist de Verificación

- [ ] Backend corriendo en puerto 3001
- [ ] Socket.io conectado (debe mostrar "🟢 EN LÍNEA")
- [ ] Video educativo cargando correctamente
- [ ] Sonido de campana funcionando
- [ ] Voz sintética anunciando correctamente
- [ ] Animaciones visibles al recibir llamado
- [ ] Video se silencia durante anuncios
- [ ] Pantalla ocupa 100% del espacio (sin bordes)

---

## 🎯 Pruebas Recomendadas

1. **Probar llamado:**
   - Presionar "Llamar" en la lista de pacientes
   - Verificar que aparezca la animación
   - Verificar sonido y voz

2. **Probar video:**
   - Verificar que el video se reproduce automáticamente
   - Verificar que se silencia durante anuncios
   - Verificar que continúa después del anuncio

3. **Probar responsive:**
   - Abrir en diferentes tamaños de pantalla
   - Verificar que el contenido se ajusta correctamente

---

## 🚀 Acceso

**URL:** `http://localhost:5173/pantalla-turnos-emergencia`

**Modo Pantalla Completa:**
- Presionar `F11` en el navegador
- O usar el modo pantalla completa del navegador

---

## 📝 Notas Técnicas

- El componente usa `useSocketEmergencia` para recibir eventos en tiempo real
- Los eventos `paciente-llamado` y `paciente-estado-cambiado` se reciben automáticamente
- El video usa `enablejsapi=1` para controlar volumen desde JavaScript
- Las animaciones CSS están optimizadas para rendimiento en TV

---

**¡La interfaz SIGEMECH está lista para usar!** 🎉

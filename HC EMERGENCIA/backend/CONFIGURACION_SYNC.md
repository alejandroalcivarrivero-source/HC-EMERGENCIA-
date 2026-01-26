# ⚙️ Configuración del Script de Sincronización

## ✅ Configuración Completada

El script `sync_and_run.bat` ya está configurado con tus datos de conexión:

```batch
set SSH_USER=TICS
set SSH_HOST=26.223.87.142
set SSH_PORT_LOCAL=3307
set SSH_PORT_REMOTE=3306
set SSH_DEST_HOST=172.16.1.248
```

**Comando SSH utilizado:** `ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142`

El túnel SSH se ejecuta en segundo plano usando `start /b` para no bloquear la terminal.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│    Casa    │  SSH    │  PC Puente    │  Red    │   Servidor   │
│            │ ──────> │ (26.223.87.142)│ ──────> │   Debian     │
│            │         │  (Radmin VPN) │         │ (172.16.1.248)│
└─────────────┘         └──────────────┘         └──────────────┘
     │                        │                          │
     │                        │                          │
  localhost:3307          Túnel SSH              MariaDB :3306
```

**Flujo de conexión desde casa:**
1. Tu PC casa se conecta vía SSH al PC puente (26.223.87.142)
2. El PC puente (con Radmin VPN) actúa como puente hacia la red interna
3. El túnel SSH mapea `localhost:3307` → `172.16.1.248:3306` (Servidor Debian)
4. La aplicación se conecta a `localhost:3307` que redirige al servidor Debian

**Flujo de conexión desde oficina:**
1. Conexión directa a `172.16.1.248:3306` (Servidor Debian)
2. No requiere túnel SSH

---

## 🚀 Uso Rápido

Simplemente ejecuta:

```powershell
npm run sync
```

Este comando automatiza todo el proceso de sincronización y arranque.

---

## 📋 Detalles de Configuración

### Configuración SSH Actual

- **Usuario SSH:** TICS
- **IP del PC Puente:** 26.223.87.142
- **Puerto Local (Túnel):** 3307
- **Puerto Remoto (MariaDB):** 3306
- **Destino Final:** 172.16.1.248 (Servidor Debian)

### Comando SSH Ejecutado

El script ejecuta automáticamente:
```powershell
ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142
```

Este comando crea un túnel SSH que redirige:
- Puerto local `3307` en tu PC casa → Puerto `3306` del servidor Debian (`172.16.1.248`)
- El túnel pasa a través del PC puente (`26.223.87.142`)
- El túnel se ejecuta en segundo plano (`start /b`) para no bloquear la terminal

### Paso 3: Autenticación SSH

El script intentará levantar el túnel SSH automáticamente. Asegúrate de tener configurada una de estas opciones:

**Opción A: Autenticación por Clave SSH (Recomendado)**
- Configura una clave SSH sin contraseña
- El túnel se levantará automáticamente sin intervención

**Opción B: Autenticación por Contraseña**
- El script mostrará una ventana pidiendo la contraseña
- Deberás ingresarla manualmente la primera vez

**Opción C: Túnel Manual**
- Si prefieres levantar el túnel manualmente, simplemente ignora las advertencias del script
- El sistema intentará conectar a la oficina primero, luego a casa

---

## 🔍 Verificación

### Verificar que el script funciona:

1. **Ejecuta el script:**
   ```powershell
   npm run sync
   ```

2. **Verifica la salida:**
   - Debe mostrar `[1/4] Sincronizando con repositorio remoto...`
   - Debe mostrar `[2/4] Instalando dependencias...`
   - Debe mostrar `[3/4] Verificando tunel SSH...`
   - Debe mostrar `[4/4] Iniciando servidor de desarrollo...`

3. **Si hay errores:**
   - Revisa que Git esté configurado correctamente
   - Revisa que npm esté funcionando
   - Revisa que las variables SSH estén correctas

---

## 🛠️ Solución de Problemas

### Error: "SSH no encontrado en PATH"

**Solución:**
- Instala OpenSSH en Windows (normalmente viene preinstalado)
- O agrega la ruta de tu cliente SSH al PATH del sistema

### Error: "No se puede verificar el túnel SSH"

**Solución:**
- Esto es normal si es la primera vez o si el túnel tarda en establecerse
- El sistema intentará conectar a la oficina primero
- Si estás en casa y necesitas el túnel, levántalo manualmente antes

### Error: "Git pull falló"

**Solución:**
- Verifica que tengas conexión a internet
- Verifica que el repositorio remoto esté configurado: `git remote -v`
- Si no hay cambios, el script continuará de todas formas

### El túnel SSH no se levanta automáticamente

**Solución:**
- Verifica que las credenciales SSH sean correctas
- Prueba el comando manualmente:
  ```powershell
  ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142
  ```
- Si funciona manualmente, el script debería funcionar también
- El túnel se ejecuta en segundo plano usando `start /b`, por lo que no verás salida en la consola
- Verifica que el PC puente (26.223.87.142) tenga acceso al servidor Debian (172.16.1.248)

---

## 📝 Notas

- El script está diseñado para ser robusto: continúa aunque algunos pasos fallen
- El túnel SSH se levanta en segundo plano (`start /b`)
- Si el túnel ya está activo, el script lo detecta y no intenta levantarlo de nuevo
- El script cambia automáticamente al directorio del backend, puedes ejecutarlo desde cualquier lugar

---

**✅ Una vez configurado, tu flujo diario será simplemente: `npm run sync`**

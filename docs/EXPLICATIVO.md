# 📘 Explicación del sistema — TikTok LIVE Vertical

Este PR documenta el sistema completo que construimos: una **plataforma de emisión vertical** desde el celular hacia una página web, con emojis en vivo y delay configurable.

---

## 🧠 ¿Qué problema resuelve?

Necesitábamos mostrar en una página web un video **vertical** (9:16) emitido desde un celular, con:
- **Emojis animados encima** del video (en vivo).
- **Delay configurable** (el video puede ir atrasado respecto al directo).
- **Sin marca de agua** ni apps de pago.

El camino original (vdo.ninja en iframe) fallaba por límites de autoplay y por no poder acceder a los pixeles del video. La solución: montar nuestro propio **servidor de medios local**.

---

## 🏗️ Arquitectura

```
celular ──► MediaMTX ──► HLS ──► Página web (visor)
   │           │                      │
   └─ WebRTC/WHIP                     └─ hls.js + emojis + delay
```

| Componente | Rol |
|-----------|-----|
| **MediaMTX** | Servidor de medios. Recibe el video (RTMP o WebRTC/WHIP) y lo redistribuye a HLS. |
| **broadcast.html** | "App de emisión": la cámara del celular se publica por WebRTC (WHIP) con H264. |
| **serve.js** | Servidor web local: sirve páginas, hace de **proxy WHIP** y guarda logs. |
| **index.html** | Visor: reproduce HLS con hls.js, dibuja la lluvia de emojis y aplica el delay. |
| **reactions.js** | **Bus de eventos** + **manejador de reacciones** (desacoplado). |

---

## 🔄 Flujo de una transmisión

1. El celular abre `broadcast.html`, pide permiso de cámara/mic (`getUserMedia`).
2. Crea una conexión WebRTC con **H264 Baseline** forzado (necesario para HLS).
3. Envía la oferta SDP por **WHIP** (`POST /whip`) a través del proxy de serve.js.
4. MediaMTX acepta (201) y recibe el media por **UDP (ICE)**.
5. MediaMTX lo convierte a **HLS** (segmentos fMP4).
6. El visor (`index.html`) reproduce el HLS con **hls.js**.
7. Un **bus de eventos** recibe eventos `reaction` y dispara la **lluvia de emojis**.

---

## ⚙️ Piezas clave

### Proxy WHIP (por qué existe)
El navegador no puede hablar WebRTC a un puerto distinto del que sirve la página. Por eso serve.js recibe el `POST /whip` (y los `PATCH` de trickle-ICE) en el **mismo origen** (`:3000`) y los reenvía a MediaMTX (`:8889`).

### H264 Baseline (por qué es obligatorio)
- Chrome por defecto emite **VP8**, y MediaMTX **no convierte VP8 a HLS**.
- Se fuerza H264 con `transceiver.setCodecPreferences()` (filtrando por `profile-level-id=42e01f`).
- El perfil **Baseline** no usa B-frames → MediaMTX puede extraer el DTS sin errores (los 500 desaparecen).

### Bus de eventos + Reacciones
```js
EventBus.emit('reaction', { type: 'emoji', count: 3 });   // gatilla desde cualquier parte
Reactions.register('miReaccion', (data) => { ... });      // define una reaccion nueva
```
Hoy la fuente es **aleatoria**; mañana puede ser el chat de TikTok, un socket, etc.

---

## 🚀 Cómo correr

1. Doble clic en **`iniciar.cmd`** (levanta MediaMTX + web en ventanas propias).
2. Celular (Chrome): activar el flag `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   y agregar `http://<IP-PC>:3000`.
3. Abrir `http://<IP-PC>:3000/broadcast` y tocar **TRANSMITIR**.
4. En la PC: `http://localhost:3000` para ver.

Configuración en **`.env`** (copy de `.env.example`).

---

## 📂 Archivos

| Archivo | Descripción |
|---------|-------------|
| `mediamtx.yml` | Config de MediaMTX (RTMP:1935, HLS:8888, WebRTC:8889) |
| `serve.js` | Servidor web + proxy WHIP + `/config` + logs |
| `index.html` | Visor: HLS + emojis + delay |
| `broadcast.html` | App de emisión (cámara + WHIP + controles flotantes) |
| `reactions.js` | Bus de eventos y manejador de reacciones |
| `publisher.js` | Cliente WHIP oficial de MediaMTX (referencia) |
| `*.cmd` | Scripts de gestión (iniciar/detener/puertos/web) |

---

## 📈 Lecciones clave

1. **vdo.ninja/WebRTC en iframe** no sirve de fondo: autoplay bloqueado y sin acceso a pixeles → servidor de medios propio.
2. **VP8 no viaja a HLS** → forzar H264 en el cliente WebRTC.
3. **WebRTC + HLS → B-frames rompen el muxer** → perfil Baseline.
4. **Señalización WHIP en otro puerto** no funciona desde el navegador → proxy en el mismo origen.
5. **El navegador exige contexto seguro** para cámara/mic → flag de Chrome (o HTTPS).

Diagramas completos en `docs/arquitectura.png` y `docs/secuencia.png`.

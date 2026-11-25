# Misión: Señal Full

Videojuego educativo 3D de cobertura Wi-Fi (React + Three.js / React Three Fiber). Sin backend, funciona offline.

## Uso
- Desarrollo: `npm install` y `npm run dev` → http://localhost:5174
- Producción: doble clic en `iniciar.bat` (arma `dist/` y sirve en http://localhost:4174, también accesible desde la red).

## Rendimiento
- Menú → "Calidad: Liviana / Alta". Liviana (por defecto): sin sombras.
- Usa la resolución real de la pantalla (nítido en táctiles con escalado) y baja sola hasta 1x si caen los FPS.
- La simulación de señal tarda ~5 ms por cálculo (CPU), se recalcula en vivo al arrastrar.

## Estructura
- `src/game/` lógica pura (sin dependencias de la vista):
  - `maps.js` plano del colegio (salas, paredes con material, obstáculos, interferencias)
  - `materials.js` atenuación por material · `devices.js` potencia de cada equipo y umbrales
  - `signal.js` simulación (log-distancia + paredes atravesadas + interferencias) y cobertura por sector
  - `network.js` cables ONT → Router → Switch → AP con largo máximo
  - `advice.js` mensajes educativos · `score.js` puntuación · `levels.js` niveles · `store.js` estado
- `src/three/` vista 3D: colegio, mapa de calor, rayos de señal, equipos, arrastre.
- `src/ui/` pantallas y paneles · `src/data/learn.js` textos del modo aprendizaje.

## Ajustes rápidos
- Tiempo, equipos disponibles y largo de cables por nivel: `src/game/levels.js`.
- Alcance de cada equipo (`p0`) y umbrales de color: `src/game/devices.js`.

## Niveles (`src/game/levels.js`)
1. **Principiante** – colegio 24×22 m, 7 sectores, 2 AP + 1 AP exterior, 80% de señal, 90 s, con ayudas.
2. **Técnico** – colegio 32×24 m, 9 sectores, paredes de hormigón/ladrillo/durlock/vidrio, 3 AP + 1 exterior, 80%, 100 s, ayudas opcionales.
3. **Experto** – edificio completo 36×26 m, 10 sectores, gimnasio con gradas metálicas, microondas del buffet y red Wi-Fi vecina, 4 AP + 1 exterior, 85%, 80 s, sin ayudas.

Los planos están en `src/game/maps.js`. Cada nivel se verificó con un optimizador: tiene solución, pero amontonar equipos no alcanza.

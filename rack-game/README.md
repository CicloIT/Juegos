# Armá el Rack del Colegio

Videojuego educativo 3D (React + Three.js / React Three Fiber). Sin backend, funciona offline.

## Uso
- Desarrollo: `npm install` y `npm run dev` → abrir http://localhost:5173
- Producción: `npm run build` → carpeta `dist/`. Servir con `npm run preview` (o doble clic en `iniciar.bat`).

## Rendimiento
- Menú → "Calidad: Liviana / Alta". Liviana (por defecto): sin sombras, resolución 1x.
- La resolución baja sola si caen los FPS. Botón "FPS" muestra el contador.

## Estructura
- `src/game/` lógica pura: red (`network.js`), reglas y mensajes (`rules.js`), niveles (`levels.js`), puntaje (`score.js`), estado (`store.js`).
- `src/three/` vista 3D: layout, equipos, puertos, cables, escena.
- `src/ui/` pantallas y paneles.
- `src/data/components.js` textos del modo aprendizaje.

La lógica no depende de la vista: para una versión 2D sólo se reemplaza `src/three/`.
Tiempo del nivel: `src/game/levels.js` (`time`).

## Niveles (`src/game/levels.js`)
1. **Principiante** – 1 switch, 6 sectores, 9 conexiones, 90 s, con ayudas.
2. **Técnico** – 2 switches en cascada, 9 sectores, 13 conexiones, 120 s, ayudas opcionales.
3. **Experto** – igual que el 2, pero arranca con 3 cables mal conectados (rojos) que hay que quitar; 105 s, sin ayudas.

Cada nivel define equipos (`devices`), sectores, tiempo y cables precargados (`prewired`). El selector aparece al tocar JUGAR.

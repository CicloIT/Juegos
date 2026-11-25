# Juegos de redes · Electromecánica

Dos videojuegos educativos web (React + Three.js), sin servidor ni base de datos:

- **Armá el Rack del Colegio** (`rack-game/`): armar y conectar un rack de comunicaciones. Diseño: `Rack.md`.
- **Misión: Señal Full** (`senal-full/`): planificar la cobertura Wi-Fi de un colegio. Diseño: `Señalfull.md`.

## Publicación
Cada `push` a `main` arma ambos juegos y los publica en GitHub Pages (`.github/workflows/publicar.yml`):
- `/` portada (`portada/index.html`)
- `/rack/` y `/senal/`

## Uso local
En cada carpeta: `npm install` y `npm run dev`, o doble clic en `iniciar.bat`.

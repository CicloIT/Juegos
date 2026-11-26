# Graph Report - Gorreti  (2026-11-26)

## Corpus Check
- 52 files · ~31,271 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 415 nodes · 815 edges · 16 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3f2dacb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Devices.jsx
- store.js
- store.js
- School.jsx
- useGame
- useGame
- package.json
- package.json
- Videojuego educativo 3D de infraestructura de redes y cobertura Wi-Fi
- Videojuego educativo 3D interactivo de redes y electromecánica
- maps.js
- Misión: Señal Full
- Armá el Rack del Colegio
- Juegos de redes · Electromecánica

## God Nodes (most connected - your core abstractions)
1. `useGame` - 38 edges
2. `useGame` - 34 edges
3. `sfx()` - 19 edges
4. `Videojuego educativo 3D de infraestructura de redes y cobertura Wi-Fi` - 19 edges
5. `toWorld()` - 18 edges
6. `Videojuego educativo 3D interactivo de redes y electromecánica` - 18 edges
7. `sfx()` - 13 edges
8. `validateConnection()` - 10 edges
9. `useInteraction` - 9 edges
10. `adviceFor()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `alreadyConnected()` --indirect_call--> `m()`  [INFERRED]
  rack-game/src/game/rules.js → senal-full/src/game/advice.js
- `computeConnectivity()` --indirect_call--> `m()`  [INFERRED]
  rack-game/src/game/rules.js → senal-full/src/game/advice.js
- `Desks()` --indirect_call--> `m()`  [INFERRED]
  senal-full/src/three/School.jsx → senal-full/src/game/advice.js
- `Floors()` --indirect_call--> `w()`  [INFERRED]
  senal-full/src/three/School.jsx → senal-full/src/game/maps.js
- `Cable()` --calls--> `sfx()`  [EXTRACTED]
  rack-game/src/three/Cables.jsx → rack-game/src/audio/sound.js

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "Devices.jsx"
Cohesion: 0.06
Nodes (47): PORTS, buildCurve(), Cable(), Cables(), DEVICE_OF, DragCable(), hitMat, ORDER (+39 more)

### Community 1 - "store.js"
Cohesion: 0.08
Nodes (38): ALL_SECTORS, BASE_DEVICES, BASE_SECTORS, levelById(), LEVELS, DEVICES, MEDIUM, PORT_BY_ID (+30 more)

### Community 2 - "store.js"
Cohesion: 0.08
Nodes (37): adviceFor(), info(), m(), ok(), overlappingPairs(), roomAt(), warn(), DEVICE_TYPES (+29 more)

### Community 3 - "School.jsx"
Cohesion: 0.08
Nodes (34): CABLE_COLORS, Cables(), Ghost(), MOUNT, PlacedDevice(), PlacedDevices(), begin(), ground (+26 more)

### Community 4 - "useGame"
Cohesion: 0.11
Nodes (32): App(), useStageScale(), ac(), sfx(), SOUNDS, tone(), LEARN_ITEMS, LEVELS (+24 more)

### Community 5 - "useGame"
Cohesion: 0.11
Nodes (30): App(), useStageScale(), ac(), sfx(), SOUNDS, tone(), LEARN_ITEMS, useGame (+22 more)

### Community 6 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, three, zustand, devDependencies (+18 more)

### Community 7 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, three, zustand, devDependencies (+18 more)

### Community 8 - "Videojuego educativo 3D de infraestructura de redes y cobertura Wi-Fi"
Cohesion: 0.10
Nodes (20): 10. SISTEMA DE DESAFÍOS, 11. SISTEMA EDUCATIVO DE ERRORES, 12. PUNTUACIÓN, 13. FINALIZACIÓN, 14. DIFICULTAD PROGRESIVA, 15. EXPERIENCIA DE USUARIO, 16. ARQUITECTURA DEL CÓDIGO, 17. REQUISITOS DE CALIDAD (+12 more)

### Community 9 - "Videojuego educativo 3D interactivo de redes y electromecánica"
Cohesion: 0.10
Nodes (19): 10. SISTEMA VISUAL DE CONECTIVIDAD, 11. TEMPORIZADOR Y PUNTUACIÓN, 12. FINALIZACIÓN, 13. DIFICULTAD PROGRESIVA, 14. EXPERIENCIA DE USUARIO, 15. ARQUITECTURA DEL CÓDIGO, 16. REQUISITOS DE CALIDAD, 17. ENTREGA (+11 more)

### Community 10 - "maps.js"
Cohesion: 0.18
Nodes (8): levelById(), SCHOOL_L1, SCHOOL_L2, SCHOOL_L3, SCHOOL_LEARN, seg(), w(), wallLine()

### Community 11 - "Misión: Señal Full"
Cohesion: 0.29
Nodes (6): Ajustes rápidos, Estructura, Misión: Señal Full, Niveles (`src/game/levels.js`), Rendimiento, Uso

### Community 12 - "Armá el Rack del Colegio"
Cohesion: 0.33
Nodes (5): Armá el Rack del Colegio, Estructura, Niveles (`src/game/levels.js`), Rendimiento, Uso

### Community 13 - "Juegos de redes · Electromecánica"
Cohesion: 0.50
Nodes (3): Juegos de redes · Electromecánica, Publicación, Uso local

## Knowledge Gaps
- **122 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `m()` connect `store.js` to `store.js`, `School.jsx`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Why does `computeConnectivity()` connect `store.js` to `store.js`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Devices.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06352087114337568 - nodes in this community are weakly interconnected._
- **Should `store.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08081632653061224 - nodes in this community are weakly interconnected._
- **Should `store.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07755102040816327 - nodes in this community are weakly interconnected._
- **Should `School.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08139534883720931 - nodes in this community are weakly interconnected._
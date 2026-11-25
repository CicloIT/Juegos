# PROYECTO: MISIÓN SEÑAL FULL
## Videojuego educativo 3D de infraestructura de redes y cobertura Wi-Fi

### 1. OBJETIVO GENERAL

Desarrollar un videojuego educativo web llamado "Misión: Señal Full", destinado a alumnos de una institución educativa con orientación en electromecánica.

El objetivo es que los participantes aprendan cómo funciona una red inalámbrica, cómo se distribuye la señal Wi-Fi y qué factores afectan su cobertura.

El jugador deberá diseñar y completar la instalación de una red inalámbrica dentro de un colegio, colocando estratégicamente routers y puntos de acceso para lograr que todos los sectores tengan cobertura.

El juego debe combinar:
- Estrategia.
- Resolución de problemas.
- Aprendizaje de redes.
- Distribución de equipos.
- Planificación de infraestructura.
- Desafíos contrarreloj.

No debe sentirse como una aplicación administrativa ni como un ejercicio escolar tradicional, sino como un videojuego de estrategia.

### 2. TECNOLOGÍAS

Desarrollar como aplicación web utilizando:

- React para la interfaz.
- Three.js para los escenarios tridimensionales.
- React Three Fiber para integrar los modelos 3D con React.
- Drei para cámaras y controles.
- CSS para interfaces y animaciones.
- JavaScript para la lógica del juego.
- Howler.js para efectos de sonido, si resulta necesario.

No utilizar backend ni base de datos en esta primera versión.

El juego debe poder ejecutarse localmente desde un navegador sin depender de servicios externos.

### 3. COMPATIBILIDAD

Diseñar para:
- Computadoras de escritorio.
- Televisores conectados a una computadora.
- Pantallas táctiles.
- Resolución principal de 1920x1080.
- Relación de aspecto 16:9.
- Adaptación a diferentes resoluciones.

Todas las interacciones deben funcionar tanto con mouse como con pantalla táctil.

Evitar scroll durante la partida.

### 4. DISEÑO VISUAL

Crear un escenario 3D de un colegio visto desde arriba, con una perspectiva isométrica.

El escenario debe contener:
- Aulas.
- Laboratorio de electromecánica.
- Biblioteca.
- Dirección.
- Sala de informática.
- Patio.
- Pasillos.
- Paredes y divisiones.

El edificio debe verse como una maqueta arquitectónica tridimensional.

Los espacios deben estar claramente diferenciados y tener nombres visibles.

Incorporar:
- Iluminación ambiental.
- Sombras.
- Materiales realistas.
- Animaciones.
- Indicadores de señal.
- Efectos de cobertura inalámbrica.

La estética debe ser moderna, tecnológica y atractiva para estudiantes de secundaria.

### 5. PANTALLA DE INICIO

Crear una pantalla inicial con:

Título: MISIÓN: SEÑAL FULL.

Subtítulo: "El colegio se quedó sin Wi-Fi. ¡Necesitamos recuperar la conexión!"

Mostrar una maqueta 3D del colegio con diferentes sectores sin cobertura.

Incluir:
- JUGAR.
- MODO APRENDIZAJE.
- CÓMO JUGAR.
- CRÉDITOS.

### 6. MODO APRENDIZAJE

Incorporar una sección educativa donde los alumnos puedan conocer los dispositivos y conceptos relacionados con redes inalámbricas.

Al seleccionar cada elemento, mostrar su nombre, descripción, función y un ejemplo visual.

Elementos:

**Router**
Explicar su función como dispositivo que conecta redes y gestiona el tráfico.

**Access Point**
Explicar que permite proporcionar conectividad Wi-Fi a los dispositivos y ampliar la cobertura inalámbrica.

**Switch**
Explicar que conecta diferentes dispositivos dentro de una red local y permite distribuir las conexiones Ethernet.

**Cable Ethernet**
Explicar su función en la conexión física entre los equipos.

**Fibra óptica**
Explicar que transmite información mediante señales luminosas.

**Cobertura Wi-Fi**
Explicar que es el área en la que los dispositivos pueden recibir la señal inalámbrica.

**Interferencias**
Explicar que otros dispositivos, obstáculos y redes pueden afectar la calidad de la conexión.

**Paredes y obstáculos**
Mostrar cómo los materiales y las estructuras del edificio pueden atenuar la señal.

Agregar animaciones que permitan visualizar cómo se propaga una señal desde un punto de acceso.

### 7. MECÁNICA PRINCIPAL

El jugador tendrá un presupuesto limitado de equipos para instalar una red inalámbrica en el colegio.

Por ejemplo:
- 1 router principal.
- 3 puntos de acceso.
- 1 switch.
- Cables Ethernet según el nivel.

El objetivo será ubicar correctamente los dispositivos para conseguir que todos los sectores del colegio tengan una cobertura adecuada.

El jugador podrá:
- Seleccionar equipos.
- Arrastrarlos por el escenario.
- Colocarlos en diferentes ubicaciones.
- Moverlos.
- Retirarlos.
- Consultar la cobertura generada.

Cada equipo debe tener características de cobertura propias.

### 8. SISTEMA DE COBERTURA WI-FI

Implementar un sistema de simulación de cobertura inalámbrica en tiempo real.

Cuando el jugador coloque o mueva un dispositivo, actualizar inmediatamente la representación de la señal.

Utilizar un mapa de calor:

- VERDE: señal excelente.
- AMARILLO: señal intermedia.
- NARANJA: señal débil.
- ROJO: sin cobertura.

La simulación debe contemplar:

- Distancia entre el punto de acceso y los sectores.
- Atenuación de la señal por paredes.
- Diferentes materiales y espesores.
- Obstáculos.
- Ubicación de los equipos.
- Superposición de zonas de cobertura.

La señal debe representarse visualmente mediante una capa de colores sobre el plano tridimensional.

No utilizar círculos perfectos de cobertura que atraviesen las paredes sin modificación.

Crear un modelo de simulación simplificado, pero coherente, que permita observar cómo los obstáculos afectan la propagación de la señal.

### 9. SISTEMA DE CONEXIONES FÍSICAS

Los puntos de acceso deben conectarse a la infraestructura cableada del colegio.

La instalación debe respetar una topología coherente:

1. La fibra óptica ingresa al ONT.
2. El ONT se conecta al router.
3. El router se conecta al switch principal.
4. Los puntos de acceso se conectan a la infraestructura mediante Ethernet.
5. Cada punto de acceso proporciona cobertura a los sectores cercanos.

En esta primera versión, la instalación de los cables puede estar simplificada, pero debe respetar las relaciones entre equipos.

### 10. SISTEMA DE DESAFÍOS

Cada partida debe comenzar con sectores del colegio que tengan problemas de conectividad.

El jugador dispondrá de un tiempo limitado para distribuir los equipos.

Duración inicial: 60 segundos.

Mostrar:
- Tiempo restante.
- Cantidad de equipos disponibles.
- Porcentaje de cobertura.
- Sectores conectados.
- Puntuación.

El jugador deberá conseguir que todos los sectores alcancen un nivel mínimo de señal para completar la misión.

### 11. SISTEMA EDUCATIVO DE ERRORES

Cuando el jugador coloque un dispositivo en una ubicación poco conveniente, mostrar explicaciones educativas.

Ejemplos:

- "Este punto de acceso está demasiado lejos del laboratorio".
- "Las paredes gruesas reducen la intensidad de la señal".
- "Colocar dos puntos de acceso demasiado cerca puede generar una distribución poco eficiente".
- "El patio necesita un punto de acceso con cobertura adecuada".
- "La señal no atraviesa todos los materiales con la misma intensidad".

No limitarse a mostrar mensajes de error.

Explicar brevemente qué está ocurriendo y permitir que el jugador corrija su estrategia.

### 12. PUNTUACIÓN

El sistema de puntuación debe considerar:

- Porcentaje total de cobertura.
- Cantidad de sectores correctamente cubiertos.
- Uso eficiente de los equipos disponibles.
- Distribución estratégica.
- Tiempo utilizado.

Premiar las instalaciones eficientes.

No premiar simplemente colocar muchos equipos en cualquier ubicación.

### 13. FINALIZACIÓN

Cuando todos los sectores alcancen el nivel de cobertura requerido:

Mostrar una animación donde el colegio recupera la conectividad.

Todos los sectores deben cambiar visualmente a verde.

Mostrar un mensaje:

"¡MISIÓN CUMPLIDA! ¡TODO EL COLEGIO TIENE SEÑAL!"

Presentar:
- Porcentaje de cobertura total.
- Sectores conectados.
- Equipos utilizados.
- Tiempo empleado.
- Puntuación final.

Si termina el tiempo antes de completar la misión, mostrar el porcentaje alcanzado y permitir volver a intentarlo.

### 14. DIFICULTAD PROGRESIVA

Preparar tres niveles:

**NIVEL 1 - PRINCIPIANTE**
- Edificio pequeño.
- Pocas paredes.
- Pocos sectores.
- Mayor cantidad de ayudas.
- Menor dificultad.

**NIVEL 2 - TÉCNICO**
- Colegio más grande.
- Paredes de diferentes materiales.
- Más sectores.
- Menor cantidad de equipos disponibles.

**NIVEL 3 - EXPERTO**
- Edificio completo.
- Obstáculos complejos.
- Presupuesto limitado.
- Mayor exigencia de cobertura.
- Menos tiempo.
- Sin ayudas automáticas.

En la primera versión desarrollar completamente el nivel principiante.

### 15. EXPERIENCIA DE USUARIO

La interfaz debe ser sencilla y visual.

El jugador debe comprender rápidamente qué tiene que hacer.

Incorporar:
- Indicaciones visuales.
- Tutorial inicial.
- Selección intuitiva de dispositivos.
- Arrastrar y soltar.
- Mapa de calor.
- Animaciones de señal.
- Mensajes educativos.
- Botones grandes.
- Sonidos opcionales.

Permitir reiniciar una partida y regresar al menú sin recargar el navegador.

### 16. ARQUITECTURA DEL CÓDIGO

Separar el proyecto en módulos independientes:

- Pantallas y navegación.
- Escenario 3D del colegio.
- Modelo de aulas y sectores.
- Modelos de dispositivos.
- Sistema de colocación de equipos.
- Simulación de propagación de señal.
- Cálculo de cobertura.
- Sistema de puntuación.
- Temporizador.
- Modo aprendizaje.
- Explicaciones educativas.
- Efectos de sonido.

Mantener la lógica de simulación independiente de los componentes visuales.

### 17. REQUISITOS DE CALIDAD

- Desarrollar un juego completamente funcional.
- No entregar solamente una maqueta.
- Los dispositivos deben poder moverse realmente.
- La cobertura debe actualizarse al mover los equipos.
- Las paredes deben afectar la señal.
- Los sectores deben mostrar su nivel de conectividad.
- El temporizador debe funcionar correctamente.
- La puntuación debe ser coherente.
- El juego debe funcionar con mouse y pantalla táctil.
- Optimizar los modelos 3D.
- Evitar dependencias innecesarias.
- No depender de servicios externos.

### 18. ENTREGA FINAL

Desarrollar una primera versión completa del videojuego.

Priorizar:

1. Maqueta 3D del colegio.
2. Equipos de red 3D.
3. Sistema de colocación y movimiento.
4. Simulación de cobertura Wi-Fi.
5. Influencia de paredes y obstáculos.
6. Modo aprendizaje.
7. Sistema de puntuación.
8. Temporizador.
9. Pantalla de resultados.

Antes de desarrollar, revisar la estructura del proyecto existente y respetar sus tecnologías y convenciones.

No modificar funcionalidades ajenas al juego.

El resultado esperado es un videojuego educativo 3D, atractivo y completamente interactivo que permita a los alumnos comprender cómo se planifica y distribuye una red inalámbrica en un edificio real.
# PROYECTO: ARMÁ EL RACK DEL COLEGIO
## Videojuego educativo 3D interactivo de redes y electromecánica

### 1. OBJETIVO GENERAL

Desarrollar un videojuego educativo web llamado "Armá el Rack del Colegio", destinado a alumnos de una institución educativa con orientación en electromecánica.

El objetivo es que los participantes aprendan los conceptos básicos de infraestructura de redes, telecomunicaciones y conectividad mediante una experiencia interactiva en la que deberán montar y conectar correctamente un rack de comunicaciones para devolverle Internet a toda la escuela.

El juego debe sentirse como un videojuego real, no como una aplicación administrativa ni como un cuestionario escolar.

La experiencia debe combinar:
- Entretenimiento.
- Aprendizaje práctico.
- Reconocimiento de componentes.
- Resolución de problemas.
- Lógica de conexiones.
- Desafíos contrarreloj.

### 2. TECNOLOGÍAS

Desarrollar como aplicación web utilizando:

- React para la interfaz.
- Three.js para los escenarios y modelos 3D.
- React Three Fiber para integrar Three.js con React.
- Drei para cámaras y elementos auxiliares 3D.
- CSS para interfaces, animaciones y efectos.
- JavaScript para la lógica del juego.
- Una biblioteca de audio como Howler.js, si resulta necesaria.

No utilizar backend ni base de datos en esta primera versión.

El juego debe poder ejecutarse localmente desde un navegador y no depender de servicios externos para funcionar.

### 3. COMPATIBILIDAD

Diseñar para:
- Computadoras de escritorio.
- Televisores conectados a una computadora.
- Pantallas táctiles.
- Resolución principal de 1920x1080.
- Relación de aspecto 16:9.
- Adaptación a diferentes resoluciones.

Todas las interacciones deben funcionar tanto con mouse como con pantalla táctil.

Implementar controles cómodos, objetivos táctiles grandes y una interfaz legible desde una distancia considerable.

Evitar scroll durante las partidas.

### 4. DISEÑO VISUAL

Crear una estética tecnológica de alta calidad, inspirada en centros de datos, laboratorios de electrónica y salas de telecomunicaciones.

El elemento principal será un rack de comunicaciones representado en 3D.

Características visuales:
- Rack metálico con profundidad y perspectiva.
- Equipos 3D detallados.
- Router, switch, patch panel y ONT.
- Puertos Ethernet claramente identificables.
- Cables de fibra óptica y Ethernet.
- Cables con colores diferenciados.
- Indicadores LED animados.
- Animaciones de transmisión de datos.
- Efectos de conexión y desconexión.
- Iluminación ambiental.
- Sombras y materiales realistas.
- Cámara con perspectiva frontal y posibilidad de acercamiento moderado.

Utilizar modelos 3D optimizados para garantizar un rendimiento fluido.

No utilizar imágenes estáticas como sustituto de los componentes interactivos.

### 5. PANTALLA DE INICIO

Crear una pantalla inicial atractiva con:

Título: ARMÁ EL RACK DEL COLEGIO.

Subtítulo: "Tenés una misión: devolverle Internet a toda la escuela".

Mostrar un rack 3D con iluminación y animaciones sutiles.

Incluir los siguientes botones:

- JUGAR.
- MODO APRENDIZAJE.
- CÓMO JUGAR.
- CRÉDITOS.

El botón JUGAR inicia directamente el desafío.

El MODO APRENDIZAJE permite conocer los equipos y comprender cómo funciona una instalación de red antes de comenzar.

### 6. MODO APRENDIZAJE: CONOCÉ LOS COMPONENTES

Esta funcionalidad es fundamental.

Antes de jugar, los alumnos deben poder explorar los diferentes elementos del rack.

Crear una sección interactiva donde se pueda seleccionar cada componente 3D.

Al seleccionar un equipo:
- Resaltar visualmente el componente.
- Mostrar su nombre.
- Mostrar una descripción sencilla.
- Explicar para qué sirve.
- Indicar dónde se utiliza.
- Mostrar sus conexiones principales.
- Incorporar una pequeña animación que ejemplifique su funcionamiento.

Componentes que deben estar disponibles:

**ONT / Conversor de fibra óptica**
Explicar que recibe la señal óptica y la convierte en una conexión Ethernet.

**Router**
Explicar que permite gestionar el tráfico entre redes y proporcionar conectividad a los dispositivos.

**Switch**
Explicar que conecta diferentes dispositivos dentro de una red local y distribuye el tráfico entre sus puertos.

**Patch panel**
Explicar que organiza las conexiones físicas de los distintos sectores del edificio y facilita el mantenimiento del cableado.

**Cable de fibra óptica**
Explicar que transmite información mediante señales luminosas.

**Cable Ethernet**
Explicar que permite transmitir datos entre equipos de red.

**Punto de acceso Wi-Fi**
Explicar que permite conectar dispositivos inalámbricos a la red cableada.

**Rack de comunicaciones**
Explicar que es la estructura que organiza y protege los equipos de telecomunicaciones.

Las explicaciones deben ser breves, visuales y adecuadas para estudiantes de secundaria.

Agregar un botón para regresar al menú y otro para comenzar el juego.

### 7. MECÁNICA PRINCIPAL DEL JUEGO

El participante tendrá 60 segundos para completar la instalación de red.

La pantalla principal de juego debe dividirse en tres sectores:

**SECTOR IZQUIERDO: COMPONENTES Y CABLES**

Mostrar los cables disponibles y los componentes que deberá conectar.

**SECTOR CENTRAL: RACK 3D**

Mostrar el rack completo, con los equipos instalados y sus puertos interactivos.

**SECTOR DERECHO: COLEGIO**

Mostrar los sectores que necesitan recuperar conectividad:

- Aula 1.
- Aula 2.
- Laboratorio de electromecánica.
- Biblioteca.
- Administración.
- Wi-Fi del patio.

Cada sector tendrá un indicador visual de conexión.

### 8. SISTEMA DE CONEXIONES

El jugador deberá conectar los cables entre los puertos correspondientes.

Permitir:
- Seleccionar cables.
- Arrastrar extremos.
- Conectar puertos.
- Desconectar cables.
- Corregir errores.
- Identificar visualmente los puertos disponibles.

La instalación debe respetar una topología coherente:

1. La fibra óptica ingresa al ONT.
2. La salida Ethernet del ONT se conecta al puerto WAN del router.
3. La salida LAN del router se conecta al switch principal.
4. Los puertos del switch se conectan mediante enlaces Ethernet al patch panel.
5. El patch panel representa las terminaciones del cableado estructurado que llega a los distintos sectores.
6. El punto de acceso Wi-Fi se conecta a la infraestructura de red mediante Ethernet.

Cada puerto debe tener una función definida y conexiones compatibles.

Validar cada conexión mediante reglas internas.

No permitir conexiones duplicadas o incompatibles.

### 9. SISTEMA EDUCATIVO DE ERRORES

No limitarse a mostrar una cruz roja cuando el participante se equivoca.

El juego debe aprovechar los errores para enseñar.

Cuando el participante conecte un cable incorrectamente:

1. Mostrar una animación de error.
2. Encender el indicador correspondiente en rojo.
3. Deshacer o rechazar la conexión incorrecta.
4. Mostrar una explicación breve del motivo.
5. Indicar cuál sería el componente o puerto correcto.
6. Permitir volver a intentarlo.

Ejemplos de mensajes:

- "¡Atención! La fibra óptica debe conectarse al ONT, que convierte la señal óptica en Ethernet".
- "El router tiene una entrada WAN y salidas LAN. Revisá qué conexión estás realizando".
- "El switch permite distribuir la conexión hacia diferentes equipos".
- "El patch panel organiza las conexiones físicas, pero no distribuye por sí mismo la señal".
- "El punto de acceso Wi-Fi necesita una conexión a la infraestructura de red".

Las explicaciones deben aparecer en ventanas o paneles pequeños sin interrumpir demasiado la partida.

El objetivo es que el alumno aprenda por qué se equivocó.

Agregar una opción para activar o desactivar las ayudas durante la partida.

### 10. SISTEMA VISUAL DE CONECTIVIDAD

Cada conexión debe producir una respuesta visual.

Conexión correcta:
- Animación del cable.
- LED verde en los puertos correspondientes.
- Animación de datos circulando.
- Sonido opcional de confirmación.
- Actualización del progreso.

Conexión incorrecta:
- LED rojo.
- Animación breve de error.
- Mensaje educativo.
- Permitir corregir.

Estados de los sectores del colegio:

- ROJO: sin conexión.
- AMARILLO: instalación incompleta.
- VERDE: conexión establecida.

Cuando todos los enlaces estén correctamente instalados, activar visualmente toda la red.

### 11. TEMPORIZADOR Y PUNTUACIÓN

Mostrar permanentemente:

- Tiempo restante.
- Porcentaje de instalación.
- Conexiones correctas.
- Errores cometidos.
- Puntuación.

La puntuación debe premiar:
- Conexiones correctas.
- Rapidez.
- Pocos errores.
- Completar la instalación.

No penalizar excesivamente los errores, ya que el objetivo principal es educativo.

### 12. FINALIZACIÓN

Cuando todas las conexiones sean correctas:

- Activar una animación general del rack.
- Encender todos los LED en verde.
- Mostrar los sectores del colegio conectados.
- Animar el flujo de datos.
- Mostrar una celebración visual.

Mensaje principal:

"¡MISIÓN CUMPLIDA! ¡EL COLEGIO ESTÁ CONECTADO!"

Mostrar:
- Tiempo utilizado.
- Conexiones correctas.
- Errores cometidos.
- Puntuación final.
- Velocidad de enlace simulada de 1000 Mbps.

Si termina el tiempo antes de completar la instalación, mostrar una pantalla de desafío incompleto y ofrecer la posibilidad de intentarlo nuevamente.

### 13. DIFICULTAD PROGRESIVA

Preparar la arquitectura para incorporar tres niveles:

**Nivel 1 - PRINCIPIANTE**
- Menos componentes.
- Pocas conexiones.
- Ayudas visuales.
- Explicaciones educativas.
- Tiempo más amplio.

**Nivel 2 - TÉCNICO**
- Más sectores.
- Mayor cantidad de cables.
- Más puertos.
- Menos ayudas.

**Nivel 3 - EXPERTO**
- Instalación completa.
- Mayor complejidad.
- Conexiones inicialmente incorrectas.
- Menos tiempo.
- Sin indicaciones automáticas.

En esta primera versión desarrollar completamente el nivel principiante y dejar preparados los otros niveles para futuras ampliaciones.

### 14. EXPERIENCIA DE USUARIO

El juego debe ser intuitivo.

No obligar al alumno a leer instrucciones extensas.

Utilizar:
- Indicaciones visuales.
- Animaciones explicativas.
- Iconografía.
- Mensajes cortos.
- Botones grandes.
- Efectos de sonido opcionales.

Incorporar una pequeña guía inicial que explique cómo seleccionar y conectar los cables.

El juego debe permitir volver al menú sin necesidad de recargar la página.

### 15. ARQUITECTURA DEL CÓDIGO

Organizar el desarrollo en componentes independientes.

Separar:
- Pantallas y navegación.
- Escenario 3D.
- Modelos de equipos.
- Puertos interactivos.
- Sistema de cables.
- Lógica de conexiones.
- Temporizador.
- Puntuación.
- Modo aprendizaje.
- Sistema de explicaciones.
- Efectos de sonido.

Mantener las reglas de conexión en una estructura de datos independiente de los componentes visuales.

Evitar concentrar toda la lógica en un único componente.

### 16. REQUISITOS DE CALIDAD

- El juego debe ser funcional, no una maqueta.
- Todas las conexiones deben poder realizarse realmente.
- El arrastre debe funcionar con mouse y táctil.
- Los puertos deben responder correctamente.
- Los indicadores deben actualizarse en tiempo real.
- El temporizador debe detenerse al finalizar.
- La puntuación debe calcularse correctamente.
- Los errores deben generar explicaciones.
- Los modelos 3D deben estar optimizados.
- Evitar dependencias innecesarias.
- No utilizar servicios externos para las funciones principales.
- Mantener un rendimiento fluido.

### 17. ENTREGA

Desarrollar una primera versión completa y funcional del videojuego.

Priorizar en este orden:

1. Escenario 3D y rack de comunicaciones.
2. Equipos y puertos interactivos.
3. Sistema real de conexiones mediante arrastrar y soltar.
4. Validación de conexiones.
5. Modo aprendizaje con identificación de componentes.
6. Sistema educativo de errores.
7. Temporizador y puntuación.
8. Pantalla de resultados.

No entregar solamente diseños, capturas o prototipos estáticos.

Todas las funcionalidades solicitadas deben estar implementadas y probadas.

Antes de comenzar, revisar la estructura del proyecto existente, respetar las tecnologías y convenciones actuales y evitar modificar funcionalidades ajenas al juego.

**RESULTADO ESPERADO: un videojuego 3D educativo, atractivo y completamente interactivo que permita a los alumnos aprender cómo se instala y organiza una red informática mientras resuelven un desafío técnico.**
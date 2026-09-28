import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: '¿Qué es exactamente un modelo de lenguaje?',
    summary: 'Cómo escribe un chatbot, de dónde sale lo que sabe y por qué puede equivocarse.',
    group: 'Lo básico',
    body: `Un modelo de lenguaje es un programa que ha aprendido, a partir de una enorme cantidad de texto, qué palabras suelen ir detrás de cuáles. Si le da el comienzo de una conversación, predice un fragmento de texto probable, luego el siguiente, y así hasta escribir una respuesta. Por eso la respuesta aparece poco a poco y no de golpe.

## De dónde sale lo que sabe

Todo lo que un modelo «sabe» lo absorbió durante su entrenamiento, antes de que usted lo descargara. En Universal AI no tiene conexión a internet propia y no aprende de sus conversaciones: el modelo de su dispositivo sigue exactamente igual que cuando se descargó. Tampoco puede saber nada de lo que ocurrió después de su entrenamiento.

## Modelos grandes y pequeños

El tamaño de un modelo se mide en parámetros, los números que se ajustaron mientras aprendía. Universal AI ofrece tres:

- **Qwen2.5 0.5B**, con unos quinientos millones de parámetros
- **Llama 3.2 1B**, con unos mil millones
- **Llama 3.2 3B**, con unos tres mil millones

Los grandes asistentes que se usan en el navegador son mucho mayores. Los modelos pequeños son rápidos y caben en un móvil, pero saben menos y se equivocan más. Las versiones de esta aplicación están comprimidas, con cada parámetro reducido a unos cuatro bits; así es como un modelo de mil millones de parámetros cabe en una descarga de menos de 1 GB.

## Seguro no significa correcto

Un modelo escribe lo que suena probable, no lo que ha comprobado. Puede afirmar algo falso con el mismo tono seguro que algo cierto, lo que se suele llamar «alucinación», y los modelos pequeños lo hacen más a menudo. Tome las respuestas como un punto de partida y compruebe todo lo importante. El artículo sobre documentos y fuentes explica cómo Universal AI puede basar una respuesta en un texto que usted puede ver.`,
  },
  {
    id: 'running-on-your-device',
    title: '¿Cómo puede funcionar una IA en un móvil?',
    summary: 'WebGPU y el modo CPU, cómo elegir un modelo y qué pasa cuando falta memoria.',
    group: 'Lo básico',
    body: `Cuando envía un mensaje, es su propio móvil u ordenador el que escribe la respuesta. No se envía nada a ningún servidor para que conteste.

## Dos formas de funcionar

**WebGPU.** Si su navegador permite a las páginas web usar el chip gráfico del dispositivo, mediante una función llamada WebGPU, Universal AI ejecuta allí el modelo. Es la forma más rápida y los tres modelos están disponibles.

**Modo CPU.** Si WebGPU no está disponible, la aplicación ejecuta el modelo en el procesador principal. Es más lento, pero funciona casi en cualquier sitio. En este modo no se ofrece Llama 3.2 3B, y la aplicación propone empezar por el modelo más pequeño.

La aplicación comprueba al arrancar qué admite su dispositivo. Usted no tiene que elegir.

## Cómo elegir un modelo

La pestaña Customise presenta los modelos según el tipo de dispositivo al que se adaptan:

- **Older phones:** Qwen2.5 0.5B, una descarga de unos 0,4 GB
- **Most phones:** Llama 3.2 1B, unos 0,9 GB
- **Future phones:** Llama 3.2 3B, unos 2,2 GB, solo con WebGPU

Un modelo mayor da mejores respuestas, pero necesita más memoria mientras funciona.

## Cuando falta memoria

Un modelo tiene que caber en la memoria mientras trabaja. Si no cabe, el sistema puede cerrar la aplicación y volver a cargarla, algo que ocurre sobre todo en iPhone y iPad. Universal AI guarda la conversación sobre la marcha para que sobreviva a un reinicio. Si la carga de un modelo se interrumpió la vez anterior, la aplicación no vuelve a intentarlo por su cuenta al abrirse: se lo indica para que usted pueda volver a intentarlo o elegir uno más pequeño.

## Cuánto ve de la conversación

Para ahorrar memoria, cada vez que envía un mensaje el modelo recibe solo los ocho mensajes más recientes, incluido el que acaba de enviar. Los mensajes anteriores siguen en pantalla, pero el modelo ya no los ve.`,
  },
  {
    id: 'models-download-and-storage',
    title: '¿De dónde salen los modelos?',
    summary: 'La descarga única, dónde se guardan los modelos y cómo eliminarlos.',
    group: 'Cómo funciona',
    body: `Un modelo es demasiado grande para incluirlo en la aplicación, así que cada uno se descarga la primera vez que lo carga. A partir de entonces funciona sin conexión a internet.

## De dónde salen

Los archivos de los modelos proceden de Hugging Face, un sitio web público donde se publican modelos de IA. En el modo WebGPU, un pequeño fragmento de código de cada modelo procede también de GitHub. Son descargas de archivos corrientes: no se envía nada de sus conversaciones para obtenerlos, aunque, como en cualquier descarga, esos sitios ven que su dispositivo pidió los archivos.

## Dónde se guardan

En el almacenamiento que su navegador, o la aplicación instalada, reserva para Universal AI en este dispositivo. Al abrirse, la aplicación carga un modelo que ya esté allí, de modo que queda lista sin volver a descargarlo.

Su dispositivo puede vaciar este almacenamiento, por ejemplo si se queda casi sin espacio o si usted borra los datos del sitio de la aplicación en el navegador. En ese caso, basta con volver a descargar el modelo.

## Eliminar un modelo

Customise ▸ AI model muestra los modelos descargados en este dispositivo. El botón de la papelera elimina uno y libera el espacio. Puede volver a descargarlo cuando quiera.

## El segundo modelo, más pequeño

Si usa documentos, paquetes de conocimiento o la búsqueda en la web, la aplicación necesita además un modelo mucho más pequeño, de unos 23 MB, que descarga de Hugging Face la primera vez, junto con el código que lo hace funcionar. Este no escribe respuestas. Convierte el texto en listas de números para que la aplicación pueda encontrar los fragmentos que coinciden con su pregunta. El siguiente artículo explica cómo.`,
  },
  {
    id: 'documents-and-sources',
    title: '¿Cómo usa los documentos y los paquetes de conocimiento?',
    summary: 'Buscar antes de responder, las fuentes numeradas y qué significa el punto de confianza.',
    group: 'Cómo funciona',
    body: `Un modelo pequeño no puede retener mucho. Universal AI le ayuda buscando primero la información y pasándole lo que encuentra. Esta técnica se llama recuperación (retrieval).

## Qué ocurre cuando pregunta

1. El pequeño modelo de búsqueda convierte su pregunta en una lista de números que recoge su significado.
2. La aplicación la compara con cada fragmento de las bases de conocimiento que haya activado en la pestaña Knowledge.
3. Hasta cuatro fragmentos que coincidan lo suficiente se añaden, numerados, a las instrucciones que recibe el modelo.
4. Se pide al modelo que responda y que marque con su número, como [1] o [2], lo que saque de un fragmento.

Todo esto ocurre en su dispositivo.

## Sus propios documentos

En la pestaña Knowledge puede pegar texto o añadir archivos .txt y .md. La aplicación divide el texto en fragmentos de unos 700 caracteres, calcula los números de cada uno y guarda ambas cosas en su almacenamiento en este dispositivo. No se sube nada.

## Paquetes ya preparados

La pestaña Knowledge ofrece también paquetes ya preparados: conocimiento general de Simple Wikipedia (25 000 artículos, unos 17 MB) y un paquete sobre vino. Cada personaje tiene además su propio paquete. Los paquetes llegan del sitio web de Universal AI cuando los descarga, o del interior de la aplicación en las versiones para móvil, y se consultan en su dispositivo.

## Cómo leer el resultado

Toque un número en una respuesta para ver el fragmento del que procede. El punto de confianza de color indica cuánto se parecía el mejor fragmento a su pregunta. No dice si la respuesta es correcta: un modelo puede interpretar mal un buen fragmento, y los modelos pequeños a veces omiten los números. Si no se encuentra nada relevante, el modelo responde solo con lo que aprendió en su entrenamiento, sin fuentes.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: '¿Qué hacen realmente los personajes y el Safe mode?',
    summary: 'Ambos son instrucciones para el modelo, y eso marca hasta dónde puede fiarse de ellos.',
    group: 'Cómo funciona',
    body: `Cada conversación empieza con unas instrucciones que usted no ve y que le dicen al modelo cómo comportarse. Es lo que suele llamarse «prompt de sistema». Los personajes, el Safe mode y sus nombres funcionan añadiendo algo a esas instrucciones.

## Los personajes

Elegir un personaje, como Luigi the Chef o Sherlock Holmes, añade una descripción de su personalidad y de su tema. Si ha descargado el paquete de conocimiento de ese personaje, también se activa, y solo puede haber un personaje activo a la vez. Un nombre fijado en Customise ▸ Names sustituye al del personaje.

El modelo está interpretando un papel. No es la persona real y no se ha leído el libro entero.

## El Safe mode

El Safe mode está activado salvo que usted active 21+ en Customise. Añade una instrucción para rechazar contenido sexual o para adultos, juegos de azar, violencia, actividades ilegales y otros temas dañinos.

Es una instrucción, no un filtro. La aplicación no revisa las respuestas después, y un modelo pequeño no siempre sigue las instrucciones, así que el Safe mode hace menos probables las respuestas inadecuadas, pero no puede descartarlas. En un dispositivo que usen niños, conviene vigilarlo.

## Sus nombres

Si escribe su nombre, las instrucciones piden al modelo que lo use de vez en cuando. El nombre que le dé al asistente le indica cómo llamarse. Como el resto de las instrucciones, se quedan en su dispositivo, salvo que haga una copia de seguridad de sus ajustes con un Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: '¿Qué sale de su dispositivo, y cuándo?',
    summary: 'Cada vez que la aplicación usa internet y qué envía exactamente.',
    group: 'Privacidad y seguridad',
    body: `Sus conversaciones se responden en su dispositivo. Estas son todas las ocasiones en que Universal AI usa internet, y lo que se envía.

## Descargas

- **La propia aplicación.** En la web se carga desde opensource.unisim.co.uk como cualquier página, y después se guarda para usarla sin conexión.
- **Los modelos de IA.** Desde Hugging Face, más un poco de código desde GitHub en el modo WebGPU, cuando carga un modelo por primera vez.
- **El modelo de búsqueda.** Desde Hugging Face, junto con el código que lo hace funcionar, la primera vez que lo necesitan los documentos, los paquetes o la búsqueda en la web.
- **Los paquetes de conocimiento.** Desde el sitio web de Universal AI cuando toca Download.

Ninguna de estas peticiones contiene sus mensajes ni sus documentos.

## Búsqueda en la web, desactivada por defecto

Si activa Customise ▸ Online web search y su dispositivo tiene conexión, cada mensaje que envía se manda también como búsqueda a la Wikipedia en inglés. Después, los resultados se comparan con su pregunta en su dispositivo. Por tanto, con la búsqueda en la web activada, sus preguntas sí salen de su dispositivo, hacia Wikipedia. Con ella desactivada, nunca.

## Enlaces que abre

Los enlaces de las fuentes y el botón Online abren Wikipedia o DuckDuckGo en su navegador. La aplicación le pregunta antes, salvo que la búsqueda en la web esté activada. Una vez abierta la página, ese sitio ve lo que ha buscado, como en cualquier búsqueda.

## Copia de seguridad con Universal ID, inactiva hasta que inicie sesión

La aplicación no contacta con el servicio Universal ID hasta que usted inicia sesión en la pestaña Customise. Al iniciar sesión se envía su dirección de correo para mandarle un código de un solo uso. Después, Back up settings sube los ajustes de la pestaña Customise a su cuenta de UNI·SIM, donde solo usted puede leerlos: el tema, los nombres que haya escrito, el personaje elegido y los interruptores. Restore backup los recupera.

## Lo que nunca sale

Sus conversaciones, sus respuestas guardadas y sus documentos nunca se suben, con una excepción: cuando la búsqueda en la web está activada, sus preguntas van a Wikipedia como se ha descrito.`,
  },
  {
    id: 'what-is-stored',
    title: '¿Qué se guarda en este dispositivo?',
    summary: 'Conversaciones, respuestas guardadas, documentos y modelos, y cómo borrar cada cosa.',
    group: 'Privacidad y seguridad',
    body: `Todo lo que guarda Universal AI está en el almacenamiento que su navegador, o la aplicación instalada, le reserva en este dispositivo. La aplicación no añade un cifrado propio: este almacenamiento está protegido igual que el resto de su dispositivo, por su bloqueo y porque el navegador mantiene separados los datos de cada sitio web.

## Qué se guarda

- **La conversación actual.** Se guarda sobre la marcha para que sobreviva a un reinicio de la aplicación. Con Clear on close activado, que es lo predeterminado, se borra al cerrar la aplicación. El botón de la papelera de la conversación la borra en cualquier momento.
- **Las respuestas guardadas.** Mantenga pulsada una respuesta, o haga clic derecho, para guardarla. Se conservan hasta que las quite, y Clear on close no las afecta.
- **Sus documentos.** El texto que añadió, dividido en fragmentos, con los números que sirven para buscar en él, hasta que los elimine en la pestaña Knowledge.
- **Los modelos y los paquetes de conocimiento.** Hasta que los elimine en Customise o en la pestaña Knowledge.
- **Sus ajustes.** Tema, nombres, personaje e interruptores.
- **Su sesión de Universal ID.** Si ha iniciado sesión, hasta que la cierre.

## Borrarlo todo

Para eliminarlo todo de una vez, borre los datos del sitio de Universal AI en los ajustes del navegador, o desinstale la aplicación en el móvil. Una copia de seguridad de los ajustes guardada con su Universal ID no se ve afectada.

## En un dispositivo compartido

Cualquiera que pueda abrir Universal AI en este dispositivo puede leer sus respuestas guardadas y, si Clear on close está desactivado, la conversación actual.`,
  },
]

export default articles

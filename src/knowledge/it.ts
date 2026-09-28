import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'Che cos’è davvero un modello linguistico?',
    summary: 'Come scrive un chatbot, da dove vengono le sue conoscenze e perché può sbagliare.',
    group: 'Le basi',
    body: `Un modello linguistico è un programma che ha imparato, da un’enorme quantità di testo, quali parole tendono a seguirne altre. Se gli dai l’inizio di una conversazione, prevede un pezzo di testo probabile, poi il successivo, e così via finché non ha scritto una risposta. Per questo la risposta compare un po’ alla volta invece che tutta insieme.

## Da dove vengono le sue conoscenze

Tutto ciò che un modello «sa» l’ha assorbito durante l’addestramento, prima che tu lo scaricassi. In Universal AI non ha una connessione a Internet propria e non impara dalle tue chat: il modello sul tuo dispositivo resta esattamente com’era quando l’hai scaricato. Non può nemmeno sapere cosa è successo dopo il suo addestramento.

## Modelli grandi e piccoli

La dimensione di un modello si misura in parametri, i numeri regolati mentre imparava. Universal AI ne offre tre:

- **Qwen2.5 0.5B**, con circa mezzo miliardo di parametri
- **Llama 3.2 1B**, con circa un miliardo
- **Llama 3.2 3B**, con circa tre miliardi

I grandi assistenti che usi nel browser sono molto più grandi. I modelli piccoli sono veloci e stanno in un telefono, ma sanno meno cose e sbagliano di più. Le versioni di questa app sono compresse, con ogni parametro ridotto a circa quattro bit: è così che un modello da un miliardo di parametri sta in un download di meno di 1 GB.

## Sicuro non vuol dire corretto

Un modello scrive ciò che sembra probabile, non ciò che ha verificato. Può affermare una cosa falsa con lo stesso tono sicuro di una vera, quella che spesso si chiama «allucinazione», e i modelli piccoli lo fanno più spesso. Prendi le risposte come un punto di partenza e verifica tutto ciò che conta. L’articolo su documenti e fonti spiega come Universal AI può basare una risposta su un testo che puoi vedere.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Come fa un’IA a funzionare su un telefono?',
    summary: 'WebGPU e modalità CPU, come scegliere un modello e cosa succede quando la memoria finisce.',
    group: 'Le basi',
    body: `Quando invii un messaggio, è il tuo telefono o computer a scrivere la risposta. Niente viene inviato a un server perché risponda.

## Due modi di funzionare

**WebGPU.** Se il tuo browser permette alle pagine web di usare il chip grafico del dispositivo, grazie a una funzione chiamata WebGPU, Universal AI fa girare lì il modello. È il modo più veloce e sono disponibili tutti e tre i modelli.

**Modalità CPU.** Se WebGPU non è disponibile, l’app fa girare il modello sul processore principale. È più lento, ma funziona quasi ovunque. In questa modalità Llama 3.2 3B non è disponibile e l’app suggerisce di iniziare dal modello più piccolo.

All’avvio l’app controlla che cosa supporta il tuo dispositivo. Non devi scegliere tu.

## Scegliere un modello

La scheda Customise elenca i modelli in base al tipo di dispositivo a cui sono adatti:

- **Older phones:** Qwen2.5 0.5B, un download di circa 0,4 GB
- **Most phones:** Llama 3.2 1B, circa 0,9 GB
- **Future phones:** Llama 3.2 3B, circa 2,2 GB, solo con WebGPU

Un modello più grande dà risposte migliori, ma richiede più memoria mentre lavora.

## Quando la memoria finisce

Un modello deve stare in memoria mentre lavora. Se non ci sta, il sistema può chiudere l’app e ricaricarla, cosa che succede soprattutto su iPhone e iPad. Universal AI salva la conversazione man mano, così sopravvive a un riavvio. Se l’ultima volta il caricamento di un modello si è interrotto, all’apertura successiva l’app non riprova da sola con quel modello: te lo segnala, così puoi riprovare o sceglierne uno più piccolo.

## Quanto vede della conversazione

Per risparmiare memoria, ogni volta che invii un messaggio il modello riceve solo gli otto messaggi più recenti, compreso quello appena inviato. I messaggi più vecchi restano sullo schermo, ma il modello non li vede più.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'Da dove vengono i modelli?',
    summary: 'Il download una tantum, dove vengono conservati i modelli e come rimuoverli.',
    group: 'Come funziona',
    body: `Un modello è troppo grande per essere incluso nell’app, quindi ognuno viene scaricato la prima volta che lo carichi. Da quel momento funziona senza connessione a Internet.

## Da dove vengono

I file dei modelli provengono da Hugging Face, un sito pubblico dove vengono pubblicati modelli di IA. In modalità WebGPU, anche un piccolo pezzo di codice per ciascun modello proviene da GitHub. Sono normali download di file: per ottenerli non viene inviato nulla delle tue chat, anche se, come per qualsiasi download, quei siti vedono che il tuo dispositivo ha chiesto i file.

## Dove vengono conservati

Nello spazio di archiviazione che il tuo browser, o l’app installata, riserva a Universal AI su questo dispositivo. All’apertura, l’app carica un modello già presente, così è pronta senza scaricarlo di nuovo.

Il dispositivo può svuotare questo spazio, per esempio quando è quasi pieno o quando cancelli i dati del sito dell’app nel browser. In quel caso basta scaricare di nuovo il modello.

## Rimuovere un modello

Customise ▸ AI model elenca i modelli scaricati su questo dispositivo. Il pulsante del cestino ne elimina uno e libera spazio. Puoi scaricarlo di nuovo quando vuoi.

## Il secondo modello, più piccolo

Se usi documenti, pacchetti di conoscenza o la ricerca sul web, l’app ha bisogno anche di un modello molto più piccolo, di circa 23 MB, che scarica da Hugging Face la prima volta, insieme al codice che lo fa funzionare. Questo non scrive risposte. Trasforma il testo in elenchi di numeri, così l’app può trovare i passaggi che corrispondono alla tua domanda. Il prossimo articolo spiega come.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Come usa i documenti e i pacchetti di conoscenza?',
    summary: 'Cercare prima di rispondere, le fonti numerate e che cosa indica il punto di affidabilità.',
    group: 'Come funziona',
    body: `Un modello piccolo non riesce a ricordare molto. Universal AI lo aiuta cercando prima le informazioni e passandogli ciò che ha trovato. Questa tecnica si chiama recupero (retrieval).

## Che cosa succede quando fai una domanda

1. Il piccolo modello di ricerca trasforma la tua domanda in un elenco di numeri che ne cattura il significato.
2. L’app lo confronta con ogni passaggio delle basi di conoscenza che hai attivato nella scheda Knowledge.
3. Fino a quattro passaggi abbastanza simili vengono aggiunti, numerati, alle istruzioni che riceve il modello.
4. Al modello viene chiesto di rispondere e di segnare con il numero, come [1] o [2], le affermazioni prese da un passaggio.

Tutto questo avviene sul tuo dispositivo.

## I tuoi documenti

Nella scheda Knowledge puoi incollare del testo o aggiungere file .txt e .md. L’app divide il testo in passaggi di circa 700 caratteri, calcola i numeri di ciascuno e conserva entrambi nel suo spazio di archiviazione su questo dispositivo. Non viene caricato nulla online.

## Pacchetti già pronti

La scheda Knowledge offre anche pacchetti già preparati: conoscenze generali da Simple Wikipedia (25.000 articoli, circa 17 MB) e un pacchetto sul vino. Ogni personaggio ha anche un pacchetto tutto suo. I pacchetti arrivano dal sito di Universal AI quando li scarichi, o dall’interno dell’app nelle versioni per telefono, e la ricerca avviene sul tuo dispositivo.

## Leggere il risultato

Tocca un numero in una risposta per vedere il passaggio da cui proviene. Il punto colorato di affidabilità indica quanto il passaggio migliore corrispondeva alla tua domanda. Non dice se la risposta è giusta: un modello può fraintendere un buon passaggio e i modelli piccoli a volte tralasciano i numeri. Se non trova nulla di pertinente, il modello risponde solo in base al suo addestramento, senza fonti.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'Che cosa fanno davvero i personaggi e il Safe mode?',
    summary: 'Sono entrambi istruzioni per il modello, e questo dice quanto puoi farci affidamento.',
    group: 'Come funziona',
    body: `Ogni conversazione inizia con istruzioni che non vedi e che dicono al modello come comportarsi. Spesso si chiamano «prompt di sistema». I personaggi, il Safe mode e i tuoi nomi funzionano tutti aggiungendo qualcosa a queste istruzioni.

## I personaggi

Scegliere un personaggio, come Luigi the Chef o Sherlock Holmes, aggiunge una descrizione della sua personalità e della sua materia. Se hai scaricato il pacchetto di conoscenza di quel personaggio, viene attivato anche quello, e può essere attivo un solo personaggio alla volta. Un nome impostato in Customise ▸ Names prende il posto di quello del personaggio.

Il modello sta recitando una parte. Non è la persona reale e non ha letto tutto il libro.

## Il Safe mode

Il Safe mode è attivo finché non attivi 21+ in Customise. Aggiunge un’istruzione che chiede di rifiutare contenuti sessuali o per adulti, gioco d’azzardo, violenza, attività illegali e altri argomenti dannosi.

È un’istruzione, non un filtro. L’app non controlla le risposte dopo, e un modello piccolo non segue sempre le istruzioni: il Safe mode rende meno probabili le risposte inadatte, ma non può escluderle. Su un dispositivo usato da bambini, tienilo d’occhio.

## I tuoi nomi

Se inserisci il tuo nome, le istruzioni chiedono al modello di usarlo ogni tanto. Il nome che dai all’assistente gli dice come chiamarsi. Come il resto delle istruzioni, restano sul tuo dispositivo, a meno che tu non faccia il backup delle impostazioni con un Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'Che cosa lascia il tuo dispositivo, e quando?',
    summary: 'Ogni volta che l’app usa Internet, e che cosa invia esattamente.',
    group: 'Privacy e sicurezza',
    body: `Le tue chat ricevono risposta sul tuo dispositivo. Ecco tutte le occasioni in cui Universal AI usa Internet, e che cosa viene inviato.

## Download

- **L’app stessa.** Sul web si carica da opensource.unisim.co.uk come qualsiasi pagina, e poi viene conservata per l’uso offline.
- **I modelli di IA.** Da Hugging Face, più un po’ di codice da GitHub in modalità WebGPU, quando carichi un modello per la prima volta.
- **Il modello di ricerca.** Da Hugging Face, insieme al codice che lo fa funzionare, la prima volta che servono documenti, pacchetti o la ricerca sul web.
- **I pacchetti di conoscenza.** Dal sito di Universal AI quando tocchi Download.

Nessuna di queste richieste contiene i tuoi messaggi o i tuoi documenti.

## La ricerca sul web, disattivata di default

Se attivi Customise ▸ Online web search e il dispositivo è connesso, ogni messaggio che invii viene mandato anche come ricerca a Wikipedia in inglese. I risultati vengono poi confrontati con la tua domanda sul tuo dispositivo. Quindi, con la ricerca sul web attiva, le tue domande lasciano il dispositivo, dirette a Wikipedia. Con la ricerca disattivata, mai.

## I link che apri

I link delle fonti e il pulsante Online aprono Wikipedia o DuckDuckGo nel browser. L’app te lo chiede prima, a meno che la ricerca sul web non sia attiva. Una volta aperta la pagina, quel sito vede che cosa hai cercato, come per qualsiasi ricerca.

## Il backup con Universal ID, inattivo finché non accedi

L’app non contatta il servizio Universal ID finché non accedi dalla scheda Customise. L’accesso invia il tuo indirizzo email perché ti venga mandato un codice monouso. Dopo, Back up settings carica le impostazioni della scheda Customise nel tuo account UNI·SIM, dove solo tu puoi leggerle: il tema, i nomi che hai inserito, il personaggio scelto e gli interruttori. Restore backup le recupera.

## Che cosa non esce mai

Le tue chat, le risposte salvate e i documenti non vengono mai caricati online, con un’eccezione: quando la ricerca sul web è attiva, le tue domande vanno a Wikipedia come descritto sopra.`,
  },
  {
    id: 'what-is-stored',
    title: 'Che cosa viene conservato su questo dispositivo?',
    summary: 'Chat, risposte salvate, documenti e modelli, e come cancellare ciascuno.',
    group: 'Privacy e sicurezza',
    body: `Tutto ciò che Universal AI conserva si trova nello spazio che il tuo browser, o l’app installata, gli riserva su questo dispositivo. L’app non aggiunge una cifratura propria: questo spazio è protetto come il resto del dispositivo, dal blocco schermo e dal browser, che tiene separati i dati di ogni sito.

## Che cosa viene conservato

- **La chat in corso.** Salvata man mano, così sopravvive a un riavvio dell’app. Con Clear on close attivo, come da impostazione predefinita, viene cancellata quando chiudi l’app. Il pulsante del cestino nella chat la cancella in qualsiasi momento.
- **Le risposte salvate.** Tieni premuta una risposta, o fai clic destro, per salvarla. Restano finché non le rimuovi, e Clear on close non le tocca.
- **I tuoi documenti.** Il testo che hai aggiunto, diviso in passaggi, con i numeri che servono per cercarvi, finché non li elimini nella scheda Knowledge.
- **Modelli e pacchetti di conoscenza.** Finché non li elimini in Customise o nella scheda Knowledge.
- **Le tue impostazioni.** Tema, nomi, personaggio e interruttori.
- **Il tuo accesso Universal ID.** Se hai effettuato l’accesso, finché non esci.

## Cancellare tutto

Per eliminare tutto in una volta, cancella i dati del sito di Universal AI nelle impostazioni del browser, oppure disinstalla l’app sul telefono. Un backup delle impostazioni conservato con il tuo Universal ID non viene toccato.

## Su un dispositivo condiviso

Chiunque possa aprire Universal AI su questo dispositivo può leggere le risposte salvate e, se Clear on close è disattivato, la chat in corso.`,
  },
]

export default articles

import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'Was ist eigentlich ein Sprachmodell?',
    summary: 'Wie ein Chatbot schreibt, woher sein Wissen stammt und warum er sich irren kann.',
    group: 'Grundlagen',
    body: `Ein Sprachmodell ist ein Programm, das aus einer sehr großen Menge Text gelernt hat, welche Wörter üblicherweise auf welche folgen. Geben Sie ihm den Anfang eines Gesprächs, sagt es ein wahrscheinliches nächstes Stück Text voraus, dann das nächste und so weiter, bis eine Antwort entstanden ist. Deshalb erscheint eine Antwort nach und nach statt auf einmal.

## Woher sein Wissen stammt

Alles, was ein Modell „weiß“, hat es während des Trainings aufgenommen, bevor Sie es heruntergeladen haben. In Universal AI hat es keine eigene Internetverbindung und lernt nicht aus Ihren Chats: Das Modell auf Ihrem Gerät bleibt genau so, wie es heruntergeladen wurde. Es kann auch nichts über Ereignisse nach seinem Training wissen.

## Große und kleine Modelle

Die Größe eines Modells wird in Parametern gemessen, den Zahlen, die beim Lernen angepasst wurden. Universal AI bietet drei an:

- **Qwen2.5 0.5B** mit etwa einer halben Milliarde Parametern
- **Llama 3.2 1B** mit etwa einer Milliarde
- **Llama 3.2 3B** mit etwa drei Milliarden

Die großen Assistenten, die Sie im Browser nutzen, sind weit größer. Kleine Modelle sind schnell und passen auf ein Handy, wissen aber weniger und machen mehr Fehler. Die Versionen in dieser App sind komprimiert, jeder Parameter ist auf etwa vier Bit verkleinert. So passt ein Modell mit einer Milliarde Parametern in einen Download von unter 1 GB.

## Überzeugt heißt nicht richtig

Ein Modell schreibt, was wahrscheinlich klingt, nicht, was es geprüft hat. Es kann etwas Falsches im selben sicheren Ton behaupten wie etwas Richtiges, was oft „Halluzination“ genannt wird, und kleine Modelle tun das häufiger. Nehmen Sie Antworten als Ausgangspunkt und prüfen Sie alles, worauf es ankommt. Der Artikel über Dokumente und Quellen erklärt, wie Universal AI eine Antwort auf einen Text stützen kann, den Sie selbst sehen.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Wie kann eine KI auf einem Handy laufen?',
    summary: 'WebGPU und CPU-Modus, die Wahl eines Modells und was passiert, wenn der Speicher knapp wird.',
    group: 'Grundlagen',
    body: `Wenn Sie eine Nachricht senden, schreibt Ihr eigenes Handy oder Ihr eigener Computer die Antwort. Nichts wird an einen Server geschickt, um beantwortet zu werden.

## Zwei Arten zu laufen

**WebGPU.** Wenn Ihr Browser Webseiten über eine Funktion namens WebGPU den Grafikchip des Geräts nutzen lässt, führt Universal AI das Modell dort aus. Das ist der schnellere Weg, und alle drei Modelle stehen zur Verfügung.

**CPU-Modus.** Ist WebGPU nicht verfügbar, führt die App das Modell stattdessen auf dem Hauptprozessor aus. Das ist langsamer, funktioniert aber fast überall. Llama 3.2 3B wird in diesem Modus nicht angeboten, und die App schlägt zum Start das kleinste Modell vor.

Beim Start prüft die App, was Ihr Gerät unterstützt. Sie müssen nichts auswählen.

## Ein Modell wählen

Der Tab Customise ordnet die Modelle nach der Art von Gerät, zu der sie passen:

- **Older phones:** Qwen2.5 0.5B, ein Download von etwa 0,4 GB
- **Most phones:** Llama 3.2 1B, etwa 0,9 GB
- **Future phones:** Llama 3.2 3B, etwa 2,2 GB, nur mit WebGPU

Ein größeres Modell liefert bessere Antworten, braucht aber mehr Arbeitsspeicher, während es läuft.

## Wenn der Speicher nicht reicht

Ein Modell muss in den Arbeitsspeicher passen, während es arbeitet. Passt es nicht, kann das System die App schließen und neu laden, was vor allem auf iPhone und iPad vorkommt. Universal AI speichert das Gespräch laufend, damit es einen Neustart übersteht. Wurde das Laden eines Modells beim letzten Mal abgebrochen, versucht die App dieses Modell beim nächsten Öffnen nicht von selbst erneut, sondern sagt es Ihnen, damit Sie es noch einmal versuchen oder ein kleineres wählen können.

## Wie viel vom Chat es sieht

Um Speicher zu sparen, erhält das Modell bei jeder Nachricht nur die acht neuesten Nachrichten, einschließlich der gerade gesendeten. Ältere Nachrichten bleiben auf dem Bildschirm, aber das Modell sieht sie nicht mehr.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'Woher kommen die Modelle?',
    summary: 'Der einmalige Download, wo die Modelle gespeichert sind und wie Sie sie entfernen.',
    group: 'So funktioniert es',
    body: `Ein Modell ist viel zu groß, um in die App eingebaut zu werden. Deshalb wird jedes beim ersten Laden heruntergeladen. Danach läuft es ohne Internetverbindung.

## Woher sie kommen

Die Modelldateien stammen von Hugging Face, einer öffentlichen Website, auf der KI-Modelle veröffentlicht werden. Im WebGPU-Modus kommt außerdem ein kleines Stück Programmcode für jedes Modell von GitHub. Das sind gewöhnliche Dateidownloads: Dafür wird nichts aus Ihren Chats gesendet, allerdings sehen diese Websites, wie bei jedem Download, dass Ihr Gerät die Dateien angefordert hat.

## Wo sie gespeichert sind

Im Speicher, den Ihr Browser oder die installierte App auf diesem Gerät für Universal AI bereithält. Beim Öffnen lädt die App ein Modell, das bereits dort ist, und ist so ohne erneuten Download bereit.

Ihr Gerät kann diesen Speicher leeren, zum Beispiel wenn der Platz sehr knapp wird oder wenn Sie im Browser die Websitedaten der App löschen. Dann muss das Modell einfach neu heruntergeladen werden.

## Ein Modell entfernen

Customise ▸ AI model listet die auf diesem Gerät heruntergeladenen Modelle auf. Die Papierkorb-Schaltfläche löscht eines und gibt den Platz frei. Sie können es jederzeit erneut herunterladen.

## Das zweite, kleinere Modell

Wenn Sie Dokumente, Wissenspakete oder die Websuche nutzen, braucht die App zusätzlich ein viel kleineres Modell von etwa 23 MB, das sie beim ersten Mal von Hugging Face lädt, zusammen mit dem Code, der es ausführt. Dieses Modell schreibt keine Antworten. Es verwandelt Text in Zahlenlisten, damit die App Abschnitte finden kann, die zu Ihrer Frage passen. Der nächste Artikel erklärt, wie.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Wie nutzt es Dokumente und Wissenspakete?',
    summary: 'Erst nachschlagen, dann antworten: die nummerierten Quellen und was der Vertrauenspunkt bedeutet.',
    group: 'So funktioniert es',
    body: `Ein kleines Modell kann sich nicht viel merken. Universal AI hilft ihm, indem es zuerst nachschlägt und dem Modell übergibt, was es gefunden hat. Diese Technik heißt Retrieval, also Abruf.

## Was passiert, wenn Sie fragen

1. Das kleine Suchmodell verwandelt Ihre Frage in eine Zahlenliste, die ihre Bedeutung erfasst.
2. Die App vergleicht sie mit jedem Abschnitt der Wissensdatenbanken, die Sie im Tab Knowledge eingeschaltet haben.
3. Bis zu vier Abschnitte, die gut genug passen, werden nummeriert zu den Anweisungen hinzugefügt, die das Modell erhält.
4. Das Modell wird gebeten zu antworten und Aussagen aus einem Abschnitt mit dessen Nummer zu kennzeichnen, etwa [1] oder [2].

All das geschieht auf Ihrem Gerät.

## Ihre eigenen Dokumente

Im Tab Knowledge können Sie Text einfügen oder .txt- und .md-Dateien hinzufügen. Die App teilt den Text in Abschnitte von etwa 700 Zeichen, berechnet für jeden die Zahlen und speichert beides im Speicher der App auf diesem Gerät. Nichts wird hochgeladen.

## Fertige Pakete

Der Tab Knowledge bietet auch vorbereitete Pakete an: Allgemeinwissen aus Simple Wikipedia (25.000 Artikel, etwa 17 MB) und ein Weinpaket. Jede Figur hat außerdem ein eigenes Paket. Die Pakete kommen beim Herunterladen von der Website von Universal AI, in den Handy-Versionen aus der App selbst, und werden auf Ihrem Gerät durchsucht.

## Das Ergebnis lesen

Tippen Sie auf eine Nummer in einer Antwort, um den Abschnitt zu sehen, aus dem sie stammt. Der farbige Vertrauenspunkt zeigt, wie gut der beste Abschnitt zu Ihrer Frage gepasst hat. Er sagt nicht, ob die Antwort stimmt: Ein Modell kann einen guten Abschnitt falsch verstehen, und kleine Modelle lassen die Nummern manchmal weg. Wird nichts Passendes gefunden, antwortet das Modell nur aus seinem Training, ohne Quellen.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'Was bewirken Figuren und der Safe mode wirklich?',
    summary: 'Beides sind Anweisungen an das Modell, und das bestimmt, wie weit Sie sich darauf verlassen können.',
    group: 'So funktioniert es',
    body: `Jedes Gespräch beginnt mit Anweisungen, die Sie nicht sehen und die dem Modell sagen, wie es sich verhalten soll. Man nennt das oft einen System-Prompt. Figuren, der Safe mode und Ihre Namen wirken alle, indem sie etwas zu diesen Anweisungen hinzufügen.

## Figuren

Wenn Sie eine Figur wählen, etwa Luigi the Chef oder Sherlock Holmes, kommt eine Beschreibung ihrer Persönlichkeit und ihres Fachgebiets hinzu. Haben Sie das Wissenspaket dieser Figur heruntergeladen, wird es ebenfalls eingeschaltet, und es ist immer nur eine Figur aktiv. Ein unter Customise ▸ Names festgelegter Name ersetzt den Namen der Figur.

Das Modell spielt eine Rolle. Es ist nicht die echte Person, und es hat nicht das ganze Buch gelesen.

## Der Safe mode

Der Safe mode ist eingeschaltet, solange Sie nicht 21+ in Customise aktivieren. Er fügt die Anweisung hinzu, sexuelle oder nicht jugendfreie Inhalte, Glücksspiel, Gewalt, illegale Aktivitäten und andere schädliche Themen abzulehnen.

Er ist eine Anweisung, kein Filter. Die App prüft die Antworten nicht nachträglich, und ein kleines Modell hält sich nicht immer an Anweisungen. Der Safe mode macht ungeeignete Antworten also unwahrscheinlicher, kann sie aber nicht ausschließen. Auf einem Gerät, das Kinder nutzen, sollten Sie ein Auge darauf haben.

## Ihre Namen

Wenn Sie Ihren Namen eingeben, bitten die Anweisungen das Modell, ihn ab und zu zu verwenden. Der Name, den Sie dem Assistenten geben, sagt ihm, wie er sich nennen soll. Wie der Rest der Anweisungen bleiben sie auf Ihrem Gerät, es sei denn, Sie sichern Ihre Einstellungen mit einer Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'Was verlässt Ihr Gerät, und wann?',
    summary: 'Jede Gelegenheit, bei der die App das Internet nutzt, und was sie genau sendet.',
    group: 'Datenschutz und Sicherheit',
    body: `Ihre Chats werden auf Ihrem Gerät beantwortet. Hier ist jede Gelegenheit, bei der Universal AI das Internet nutzt, und was dabei gesendet wird.

## Downloads

- **Die App selbst.** Im Web lädt sie wie jede Webseite von opensource.unisim.co.uk und wird dann für die Offline-Nutzung aufbewahrt.
- **KI-Modelle.** Von Hugging Face, im WebGPU-Modus zusätzlich etwas Programmcode von GitHub, wenn Sie ein Modell zum ersten Mal laden.
- **Das Suchmodell.** Von Hugging Face, zusammen mit dem Code, der es ausführt, wenn Dokumente, Pakete oder die Websuche es zum ersten Mal brauchen.
- **Wissenspakete.** Von der Website von Universal AI, wenn Sie auf Download tippen.

Keine dieser Anfragen enthält Ihre Nachrichten oder Dokumente.

## Websuche, standardmäßig aus

Wenn Sie Customise ▸ Online web search einschalten und Ihr Gerät online ist, wird jede Nachricht, die Sie senden, auch als Suche an die englische Wikipedia geschickt. Die Ergebnisse werden dann auf Ihrem Gerät mit Ihrer Frage verglichen. Mit eingeschalteter Websuche verlassen Ihre Fragen Ihr Gerät also, in Richtung Wikipedia. Ist sie aus, geschieht das nie.

## Links, die Sie öffnen

Quellenlinks und die Schaltfläche Online öffnen Wikipedia oder DuckDuckGo in Ihrem Browser. Die App fragt vorher nach, außer wenn die Websuche eingeschaltet ist. Sobald eine Seite geöffnet ist, sieht diese Website, wonach Sie gesucht haben, wie bei jeder Suche.

## Sicherung mit Universal ID, aus, bis Sie sich anmelden

Die App nimmt keinen Kontakt zum Universal-ID-Dienst auf, bis Sie sich im Tab Customise anmelden. Bei der Anmeldung wird Ihre E-Mail-Adresse gesendet, damit Ihnen ein Einmalcode zugeschickt werden kann. Danach lädt Back up settings die Einstellungen aus dem Tab Customise in Ihr UNI·SIM-Konto hoch, wo nur Sie sie lesen können: das Farbschema, die eingegebenen Namen, die gewählte Figur und die Schalter. Restore backup holt sie wieder.

## Was nie hinausgeht

Ihre Chats, gespeicherten Antworten und Dokumente werden nie hochgeladen, mit einer Ausnahme: Bei eingeschalteter Websuche gehen Ihre Fragen wie oben beschrieben an Wikipedia.`,
  },
  {
    id: 'what-is-stored',
    title: 'Was wird auf diesem Gerät gespeichert?',
    summary: 'Chats, gespeicherte Antworten, Dokumente und Modelle, und wie Sie jedes davon löschen.',
    group: 'Datenschutz und Sicherheit',
    body: `Alles, was Universal AI aufbewahrt, liegt in dem Speicher, den Ihr Browser oder die installierte App auf diesem Gerät dafür bereitstellt. Die App fügt keine eigene Verschlüsselung hinzu: Dieser Speicher ist so geschützt wie der Rest Ihres Geräts, durch die Gerätesperre und dadurch, dass der Browser die Daten jeder Website getrennt hält.

## Was gespeichert wird

- **Der aktuelle Chat.** Wird laufend gespeichert, damit er einen Neustart der App übersteht. Ist Clear on close eingeschaltet, was die Voreinstellung ist, wird er beim Schließen der App gelöscht. Die Papierkorb-Schaltfläche im Chat löscht ihn jederzeit.
- **Gespeicherte Antworten.** Halten Sie eine Antwort gedrückt oder klicken Sie mit der rechten Maustaste darauf, um sie zu speichern. Sie bleiben, bis Sie sie entfernen, und Clear on close betrifft sie nicht.
- **Ihre Dokumente.** Der hinzugefügte Text, in Abschnitte geteilt, mit den Zahlen für die Suche, bis Sie ihn im Tab Knowledge löschen.
- **Modelle und Wissenspakete.** Bis Sie sie in Customise oder im Tab Knowledge löschen.
- **Ihre Einstellungen.** Farbschema, Namen, Figur und Schalter.
- **Ihre Universal-ID-Anmeldung.** Wenn Sie angemeldet sind, bis Sie sich abmelden.

## Alles löschen

Um alles auf einmal zu entfernen, löschen Sie in den Browsereinstellungen die Websitedaten von Universal AI oder deinstallieren Sie die App auf dem Handy. Eine bei Ihrer Universal ID aufbewahrte Sicherung der Einstellungen ist davon nicht betroffen.

## Auf einem geteilten Gerät

Wer Universal AI auf diesem Gerät öffnen kann, kann die gespeicherten Antworten lesen und, wenn Clear on close ausgeschaltet ist, auch den aktuellen Chat.`,
  },
]

export default articles

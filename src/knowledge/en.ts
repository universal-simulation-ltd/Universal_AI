import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'What actually is a language model?',
    summary: 'How a chatbot writes, where its knowledge comes from, and why it can be wrong.',
    group: 'The basics',
    body: `A language model is a computer program that has learned, from a very large amount of text, which words tend to follow which. Give it the start of a conversation and it predicts a likely next piece of text, then the next, and so on until it has written a reply. That is why an answer appears a little at a time rather than all at once.

## Where its knowledge comes from

Everything a model "knows" was absorbed while it was being trained, before you downloaded it. In Universal AI it has no internet connection of its own and it does not learn from your chats: the model on your device stays exactly as it was downloaded. It also cannot know about anything that happened after its training.

## Big and small models

A model's size is counted in parameters, the numbers that were adjusted while it learned. Universal AI offers three:

- **Qwen2.5 0.5B**, with about half a billion parameters
- **Llama 3.2 1B**, with about one billion
- **Llama 3.2 3B**, with about three billion

The large assistants you use in a web browser are far bigger. Small models are quick and fit on a phone, but they know less and make more mistakes. The versions here are stored in a compressed form, with each parameter squeezed into about four bits, which is how a billion-parameter model fits in a download of under 1 GB.

## Confident is not the same as correct

A model writes what sounds likely, not what it has checked. It can state something false in exactly the same assured tone as something true, which is often called "hallucination", and small models do it more often. Treat answers as a starting point and check anything that matters. The article on documents and sources explains how Universal AI can ground an answer in text you can see.`,
  },
  {
    id: 'running-on-your-device',
    title: 'How can an AI run on a phone?',
    summary: 'WebGPU and CPU mode, choosing a model, and what happens when memory runs out.',
    group: 'The basics',
    body: `When you send a message, your own phone or computer writes the reply. Nothing is sent to a server to be answered.

## Two ways to run

**WebGPU.** If your browser lets web pages use the device's graphics chip, through a feature called WebGPU, Universal AI runs the model there. This is the faster way, and all three models are available.

**CPU mode.** If WebGPU is not available, the app runs the model on the main processor instead. It is slower, but it works almost everywhere. Llama 3.2 3B is not offered in this mode, and the app suggests the smallest model to start with.

The app checks which one your device supports when it starts. You do not have to choose.

## Choosing a model

The Customise tab lists the models by the kind of device they suit:

- **Older phones:** Qwen2.5 0.5B, a download of about 0.4 GB
- **Most phones:** Llama 3.2 1B, about 0.9 GB
- **Future phones:** Llama 3.2 3B, about 2.2 GB, WebGPU only

A bigger model gives better answers but needs more memory while it runs.

## When memory runs out

A model has to fit in memory while it is working. If it does not, the system may close the app and reload it, which happens most often on iPhones and iPads. Universal AI saves the conversation as you go, so it survives a restart. If loading a model was cut short last time, the app does not try that model again by itself when it next opens: it tells you, so you can try again or pick a smaller one.

## How much of the chat it sees

To keep memory use down, each time you send a message the model is given only the eight most recent messages, including the one you just sent. Older messages stay on screen, but the model no longer sees them.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'Where do the models come from?',
    summary: 'The one-off download, where models are kept, and how to remove them.',
    group: 'How it works',
    body: `A model is far too large to build into the app, so each one is downloaded the first time you load it. After that it runs without an internet connection.

## Where they come from

The model files come from Hugging Face, a public website where AI models are published. In WebGPU mode, a small piece of program code for each model also comes from GitHub. These are ordinary file downloads: nothing from your chats is sent to get them, although, as with any download, those sites can see that your device asked for the files.

## Where they are kept

In the storage your browser, or the installed app, keeps for Universal AI on this device. When you open the app, it loads a model that is already there, so it is ready without downloading again.

Your device can clear this storage, for example when it is very short of space or when you clear the app's website data in your browser. If that happens, the model simply needs downloading again.

## Removing a model

Customise ▸ AI model lists the models downloaded on this device. The bin button deletes one and frees the space. You can download it again at any time.

## The second, smaller model

If you use documents, knowledge packs or web search, the app also needs a much smaller model, about 23 MB, which it downloads from Hugging Face the first time, along with the code that runs it. This one does not write answers. It turns text into lists of numbers so the app can find passages that match your question. The next article explains how.`,
  },
  {
    id: 'documents-and-sources',
    title: 'How does it use documents and knowledge packs?',
    summary: 'Looking things up before answering, the numbered sources, and what the confidence dot means.',
    group: 'How it works',
    body: `A small model cannot hold much in its head. Universal AI helps by looking things up first and handing the model what it found. This technique is called retrieval.

## What happens when you ask

1. The small search model turns your question into a list of numbers that captures its meaning.
2. The app compares that with every passage in the knowledge bases you have switched on in the Knowledge tab.
3. Up to four passages that match closely enough are added, numbered, to the instructions the model receives.
4. The model is asked to answer and to mark statements that come from a passage with its number, such as [1] or [2].

All of this happens on your device.

## Your own documents

In the Knowledge tab you can paste text or add .txt and .md files. The app splits the text into passages of about 700 characters, works out the numbers for each, and stores both in the app's storage on this device. Nothing is uploaded.

## Ready-made packs

The Knowledge tab also offers packs that have already been prepared: general knowledge from Simple Wikipedia (25,000 articles, about 17 MB) and a wine pack. Each character has a pack of its own too. Packs come from Universal AI's own website when you download them, or from inside the app in the phone versions, and are searched on your device.

## Reading the result

Tap a number in an answer to see the passage it came from. The coloured confidence dot shows how closely the best passage matched your question. It does not say whether the answer is right: a model can still misread a good passage, and small models sometimes leave the numbers out. If nothing relevant is found, the model answers from its training alone, with no sources.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'What do characters and Safe mode actually do?',
    summary: 'Both are instructions to the model, and what that means for how far you can rely on them.',
    group: 'How it works',
    body: `Every conversation starts with instructions you do not see, telling the model how to behave. This is often called a system prompt. Characters, Safe mode and your names all work by adding to it.

## Characters

Choosing a character, such as Luigi the Chef or Sherlock Holmes, adds a description of their personality and subject. If you have downloaded that character's knowledge pack, it is also switched on, and only one character is active at a time. A name set under Customise ▸ Names takes the place of the character's name.

The model is playing a part. It is not the real person, and it has not read the whole book.

## Safe mode

Safe mode is on unless you switch on 21+ in Customise. It adds an instruction to refuse sexual or adult content, gambling, violence, illegal activities and other harmful topics.

It is an instruction, not a filter. The app does not check answers afterwards, and a small model does not always follow instructions, so Safe mode makes unsuitable replies less likely but cannot rule them out. On a device children use, keep an eye on it.

## Your names

If you enter your name, the instructions ask the model to use it now and then. The name you give the assistant tells it what to call itself. Like the rest of the instructions, these stay on your device unless you back up your settings with a Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'What leaves your device, and when?',
    summary: 'Every time the app uses the internet, and exactly what it sends.',
    group: 'Privacy and security',
    body: `Your chats are answered on your device. Here is every occasion on which Universal AI uses the internet, and what goes.

## Downloads

- **The app itself.** On the web it loads from opensource.unisim.co.uk like any web page, and is then kept for offline use.
- **AI models.** From Hugging Face, plus a little program code from GitHub in WebGPU mode, when you load a model for the first time.
- **The search model.** From Hugging Face, with the code that runs it, the first time documents, packs or web search need it.
- **Knowledge packs.** From Universal AI's own website when you tap Download.

None of these requests contain your messages or documents.

## Web search, off by default

If you switch on Customise ▸ Online web search and your device is online, each message you send is also sent as a search to English Wikipedia. The results are then compared with your question on your device. So, with web search on, your questions do leave your device, to Wikipedia. With it off, they never do.

## Links you open

Source links and the Online button open Wikipedia or DuckDuckGo in your browser. The app asks first unless web search is on. Once a page opens, that site sees what you searched for, as with any search.

## Universal ID backup, off until you log in

The app makes no calls to the Universal ID service until you log in on the Customise tab. Logging in sends your email address so that a one-time code can be emailed to you. After that, Back up settings uploads the settings on the Customise tab to your UNI·SIM account, where only you can read them: the theme, the names you entered, your chosen character and the on/off switches. Restore backup fetches them again.

## What never leaves

Your chats, saved answers and documents are never uploaded, with one exception: when web search is on, your questions go to Wikipedia as described above.`,
  },
  {
    id: 'what-is-stored',
    title: 'What is kept on this device?',
    summary: 'Chats, saved answers, documents and models, and how to clear each of them.',
    group: 'Privacy and security',
    body: `Everything Universal AI keeps is in the storage your browser, or the installed app, sets aside for it on this device. The app does not add encryption of its own; this storage is protected in the same way as the rest of your device, by its lock and by the browser keeping each website's data separate.

## What is kept

- **The current chat.** Saved as you go, so it survives the app being restarted. With Clear on close switched on, which is the default, it is wiped when you close the app. The bin button in the chat clears it at any time.
- **Saved answers.** Press and hold an answer, or right-click it, to save it. Saved answers stay until you remove them, and Clear on close does not affect them.
- **Your documents.** The text you added, split into passages, with the numbers used to search them, until you delete them in the Knowledge tab.
- **Models and knowledge packs.** Until you delete them in Customise or the Knowledge tab.
- **Your settings.** Theme, names, character and switches.
- **Your Universal ID login.** If you logged in, until you log out.

## Clearing everything

To remove everything at once, clear the website data for Universal AI in your browser's settings, or uninstall the app on a phone. A settings backup kept with your Universal ID is not affected by this.

## On a shared device

Anyone who can open Universal AI on this device can read its saved answers and, if Clear on close is off, the current chat.`,
  },
]

export default articles

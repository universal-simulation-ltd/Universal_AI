import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'Qu’est-ce qu’un modèle de langage, au juste ?',
    summary: 'Comment un chatbot écrit, d’où viennent ses connaissances et pourquoi il peut se tromper.',
    group: 'Les bases',
    body: `Un modèle de langage est un programme qui a appris, à partir d’une très grande quantité de textes, quels mots ont tendance à en suivre d’autres. Donnez-lui le début d’une conversation et il prédit un morceau de texte probable, puis le suivant, et ainsi de suite jusqu’à avoir écrit une réponse. C’est pour cela qu’une réponse s’affiche petit à petit plutôt que d’un seul coup.

## D’où viennent ses connaissances

Tout ce qu’un modèle « sait » a été assimilé pendant son entraînement, avant que vous ne le téléchargiez. Dans Universal AI, il n’a aucune connexion à Internet et n’apprend rien de vos conversations : le modèle présent sur votre appareil reste exactement tel qu’il a été téléchargé. Il ne peut pas non plus connaître ce qui s’est passé après son entraînement.

## Grands et petits modèles

La taille d’un modèle se mesure en paramètres, les nombres ajustés pendant son apprentissage. Universal AI en propose trois :

- **Qwen2.5 0.5B**, avec environ un demi-milliard de paramètres
- **Llama 3.2 1B**, avec environ un milliard
- **Llama 3.2 3B**, avec environ trois milliards

Les grands assistants que vous utilisez dans un navigateur sont bien plus gros. Les petits modèles sont rapides et tiennent sur un téléphone, mais ils en savent moins et font plus d’erreurs. Les versions proposées ici sont compressées, chaque paramètre étant réduit à environ quatre bits : c’est ainsi qu’un modèle d’un milliard de paramètres tient dans un téléchargement de moins de 1 Go.

## Sûr de lui ne veut pas dire juste

Un modèle écrit ce qui semble probable, pas ce qu’il a vérifié. Il peut affirmer une chose fausse exactement sur le même ton assuré qu’une chose vraie, ce qu’on appelle souvent une « hallucination », et les petits modèles le font plus souvent. Considérez les réponses comme un point de départ et vérifiez tout ce qui compte. L’article sur les documents et les sources explique comment Universal AI peut appuyer une réponse sur un texte que vous pouvez consulter.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Comment une IA peut-elle fonctionner sur un téléphone ?',
    summary: 'WebGPU et mode processeur, le choix d’un modèle, et ce qui se passe quand la mémoire manque.',
    group: 'Les bases',
    body: `Quand vous envoyez un message, c’est votre téléphone ou votre ordinateur qui rédige la réponse. Rien n’est envoyé à un serveur pour y répondre.

## Deux façons de fonctionner

**WebGPU.** Si votre navigateur permet aux pages web d’utiliser la puce graphique de l’appareil, grâce à une fonction appelée WebGPU, Universal AI y fait tourner le modèle. C’est la méthode la plus rapide, et les trois modèles sont disponibles.

**Mode processeur.** Si WebGPU n’est pas disponible, l’application fait tourner le modèle sur le processeur principal. C’est plus lent, mais cela fonctionne presque partout. Llama 3.2 3B n’est pas proposé dans ce mode, et l’application suggère de commencer par le plus petit modèle.

L’application vérifie au démarrage ce que votre appareil prend en charge. Vous n’avez rien à choisir.

## Choisir un modèle

L’onglet Customise présente les modèles selon le type d’appareil auquel ils conviennent :

- **Older phones :** Qwen2.5 0.5B, un téléchargement d’environ 0,4 Go
- **Most phones :** Llama 3.2 1B, environ 0,9 Go
- **Future phones :** Llama 3.2 3B, environ 2,2 Go, WebGPU uniquement

Un modèle plus gros donne de meilleures réponses, mais demande plus de mémoire pendant qu’il travaille.

## Quand la mémoire manque

Un modèle doit tenir en mémoire pendant qu’il travaille. Sinon, le système peut fermer l’application et la recharger, ce qui arrive surtout sur iPhone et iPad. Universal AI enregistre la conversation au fur et à mesure, pour qu’elle survive à un redémarrage. Si le chargement d’un modèle a été interrompu la fois précédente, l’application ne réessaie pas ce modèle d’elle-même à l’ouverture suivante : elle vous prévient, pour que vous puissiez réessayer ou choisir un modèle plus petit.

## Ce qu’il voit de la conversation

Pour économiser la mémoire, chaque fois que vous envoyez un message, le modèle ne reçoit que les huit messages les plus récents, y compris celui que vous venez d’envoyer. Les messages plus anciens restent à l’écran, mais le modèle ne les voit plus.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'D’où viennent les modèles ?',
    summary: 'Le téléchargement unique, l’endroit où les modèles sont conservés et comment les supprimer.',
    group: 'Comment ça marche',
    body: `Un modèle est bien trop volumineux pour être intégré à l’application : chacun est donc téléchargé la première fois que vous le chargez. Ensuite, il fonctionne sans connexion à Internet.

## D’où ils viennent

Les fichiers des modèles proviennent de Hugging Face, un site public où sont publiés des modèles d’IA. En mode WebGPU, un petit morceau de code propre à chaque modèle provient aussi de GitHub. Ce sont de simples téléchargements de fichiers : rien de vos conversations n’est envoyé pour les obtenir, même si, comme pour tout téléchargement, ces sites voient que votre appareil a demandé les fichiers.

## Où ils sont conservés

Dans l’espace de stockage que votre navigateur, ou l’application installée, réserve à Universal AI sur cet appareil. À l’ouverture, l’application charge un modèle déjà présent, pour être prête sans nouveau téléchargement.

Votre appareil peut vider cet espace, par exemple s’il manque sérieusement de place ou si vous effacez les données du site de l’application dans votre navigateur. Dans ce cas, il suffit de télécharger le modèle à nouveau.

## Supprimer un modèle

Customise ▸ AI model liste les modèles téléchargés sur cet appareil. Le bouton corbeille en supprime un et libère la place. Vous pouvez le télécharger de nouveau à tout moment.

## Le second modèle, plus petit

Si vous utilisez des documents, des packs de connaissances ou la recherche sur le web, l’application a aussi besoin d’un modèle bien plus petit, d’environ 23 Mo, qu’elle télécharge depuis Hugging Face la première fois, avec le code qui le fait fonctionner. Celui-ci n’écrit pas de réponses. Il transforme du texte en listes de nombres pour que l’application puisse trouver les passages qui correspondent à votre question. L’article suivant explique comment.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Comment utilise-t-il les documents et les packs de connaissances ?',
    summary: 'Chercher avant de répondre, les sources numérotées et ce que signifie le point de confiance.',
    group: 'Comment ça marche',
    body: `Un petit modèle ne peut pas retenir grand-chose. Universal AI l’aide en cherchant d’abord l’information, puis en lui transmettant ce qu’il a trouvé. Cette technique s’appelle la récupération (retrieval).

## Ce qui se passe quand vous posez une question

1. Le petit modèle de recherche transforme votre question en une liste de nombres qui en capture le sens.
2. L’application la compare à chaque passage des bases de connaissances que vous avez activées dans l’onglet Knowledge.
3. Jusqu’à quatre passages suffisamment proches sont ajoutés, numérotés, aux instructions que reçoit le modèle.
4. On demande au modèle de répondre et de marquer d’un numéro, comme [1] ou [2], les affirmations tirées d’un passage.

Tout cela se passe sur votre appareil.

## Vos propres documents

Dans l’onglet Knowledge, vous pouvez coller du texte ou ajouter des fichiers .txt et .md. L’application découpe le texte en passages d’environ 700 caractères, calcule les nombres de chacun et conserve le tout dans son espace de stockage sur cet appareil. Rien n’est envoyé en ligne.

## Des packs tout prêts

L’onglet Knowledge propose aussi des packs déjà préparés : des connaissances générales tirées de Simple Wikipedia (25 000 articles, environ 17 Mo) et un pack sur le vin. Chaque personnage a aussi son propre pack. Les packs viennent du site d’Universal AI quand vous les téléchargez, ou de l’application elle-même dans les versions pour téléphone, et la recherche s’y fait sur votre appareil.

## Lire le résultat

Touchez un numéro dans une réponse pour voir le passage dont il vient. Le point de confiance coloré indique à quel point le meilleur passage correspondait à votre question. Il ne dit pas si la réponse est juste : un modèle peut mal lire un bon passage, et les petits modèles oublient parfois les numéros. Si rien de pertinent n’est trouvé, le modèle répond à partir de son seul entraînement, sans sources.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'Que font vraiment les personnages et le Safe mode ?',
    summary: 'Ce sont deux instructions données au modèle, et voici jusqu’où vous pouvez vous y fier.',
    group: 'Comment ça marche',
    body: `Chaque conversation commence par des instructions que vous ne voyez pas et qui indiquent au modèle comment se comporter. On parle souvent de « prompt système ». Les personnages, le Safe mode et vos noms fonctionnent tous en y ajoutant quelque chose.

## Les personnages

Choisir un personnage, comme Luigi the Chef ou Sherlock Holmes, ajoute une description de sa personnalité et de son domaine. Si vous avez téléchargé son pack de connaissances, celui-ci est aussi activé, et un seul personnage est actif à la fois. Un nom défini dans Customise ▸ Names remplace celui du personnage.

Le modèle joue un rôle. Ce n’est pas la vraie personne, et il n’a pas lu tout le livre.

## Le Safe mode

Le Safe mode est actif tant que vous n’activez pas 21+ dans Customise. Il ajoute une instruction demandant de refuser les contenus sexuels ou pour adultes, les jeux d’argent, la violence, les activités illégales et les autres sujets nuisibles.

C’est une instruction, pas un filtre. L’application ne vérifie pas les réponses après coup, et un petit modèle ne suit pas toujours les instructions : le Safe mode rend les réponses inappropriées moins probables, mais ne peut pas les exclure. Sur un appareil utilisé par des enfants, gardez un œil dessus.

## Vos noms

Si vous indiquez votre nom, les instructions demandent au modèle de l’utiliser de temps en temps. Le nom que vous donnez à l’assistant lui dit comment s’appeler. Comme le reste des instructions, ces noms restent sur votre appareil, sauf si vous sauvegardez vos réglages avec un Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'Qu’est-ce qui quitte votre appareil, et quand ?',
    summary: 'Chaque fois que l’application utilise Internet, et exactement ce qu’elle envoie.',
    group: 'Confidentialité et sécurité',
    body: `Vos conversations reçoivent leur réponse sur votre appareil. Voici toutes les occasions où Universal AI utilise Internet, et ce qui est envoyé.

## Les téléchargements

- **L’application elle-même.** Sur le web, elle se charge depuis opensource.unisim.co.uk comme n’importe quelle page, puis elle est conservée pour un usage hors ligne.
- **Les modèles d’IA.** Depuis Hugging Face, plus un peu de code depuis GitHub en mode WebGPU, quand vous chargez un modèle pour la première fois.
- **Le modèle de recherche.** Depuis Hugging Face, avec le code qui le fait fonctionner, la première fois que des documents, des packs ou la recherche sur le web en ont besoin.
- **Les packs de connaissances.** Depuis le site d’Universal AI quand vous touchez Download.

Aucune de ces requêtes ne contient vos messages ni vos documents.

## La recherche sur le web, désactivée par défaut

Si vous activez Customise ▸ Online web search et que votre appareil est connecté, chaque message que vous envoyez est aussi envoyé comme recherche à Wikipédia en anglais. Les résultats sont ensuite comparés à votre question sur votre appareil. Avec la recherche sur le web activée, vos questions quittent donc votre appareil, à destination de Wikipédia. Désactivée, jamais.

## Les liens que vous ouvrez

Les liens des sources et le bouton Online ouvrent Wikipédia ou DuckDuckGo dans votre navigateur. L’application vous demande d’abord confirmation, sauf si la recherche sur le web est activée. Une fois la page ouverte, ce site voit ce que vous avez cherché, comme pour toute recherche.

## La sauvegarde Universal ID, inactive tant que vous ne vous connectez pas

L’application ne contacte pas le service Universal ID tant que vous ne vous êtes pas connecté dans l’onglet Customise. La connexion envoie votre adresse e-mail pour qu’un code à usage unique vous soit envoyé. Ensuite, Back up settings envoie les réglages de l’onglet Customise vers votre compte UNI·SIM, où vous seul pouvez les lire : le thème, les noms que vous avez saisis, le personnage choisi et les interrupteurs. Restore backup les récupère.

## Ce qui ne part jamais

Vos conversations, vos réponses enregistrées et vos documents ne sont jamais envoyés en ligne, à une exception près : quand la recherche sur le web est activée, vos questions partent vers Wikipédia comme décrit ci-dessus.`,
  },
  {
    id: 'what-is-stored',
    title: 'Qu’est-ce qui est conservé sur cet appareil ?',
    summary: 'Conversations, réponses enregistrées, documents et modèles, et comment effacer chacun d’eux.',
    group: 'Confidentialité et sécurité',
    body: `Tout ce qu’Universal AI conserve se trouve dans l’espace de stockage que votre navigateur, ou l’application installée, lui réserve sur cet appareil. L’application n’ajoute pas de chiffrement qui lui soit propre : cet espace est protégé comme le reste de votre appareil, par son verrouillage et par le navigateur, qui sépare les données de chaque site.

## Ce qui est conservé

- **La conversation en cours.** Enregistrée au fur et à mesure, pour survivre à un redémarrage de l’application. Avec Clear on close activé, ce qui est le cas par défaut, elle est effacée quand vous fermez l’application. Le bouton corbeille de la conversation l’efface à tout moment.
- **Les réponses enregistrées.** Appuyez longuement sur une réponse, ou faites un clic droit, pour l’enregistrer. Elles restent jusqu’à ce que vous les retiriez, et Clear on close ne les touche pas.
- **Vos documents.** Le texte ajouté, découpé en passages, avec les nombres qui servent à la recherche, jusqu’à ce que vous les supprimiez dans l’onglet Knowledge.
- **Les modèles et les packs de connaissances.** Jusqu’à ce que vous les supprimiez dans Customise ou dans l’onglet Knowledge.
- **Vos réglages.** Thème, noms, personnage et interrupteurs.
- **Votre connexion Universal ID.** Si vous vous êtes connecté, jusqu’à ce que vous vous déconnectiez.

## Tout effacer

Pour tout supprimer d’un coup, effacez les données du site d’Universal AI dans les réglages de votre navigateur, ou désinstallez l’application sur un téléphone. Une sauvegarde des réglages conservée avec votre Universal ID n’est pas concernée.

## Sur un appareil partagé

Toute personne qui peut ouvrir Universal AI sur cet appareil peut lire ses réponses enregistrées et, si Clear on close est désactivé, la conversation en cours.`,
  },
]

export default articles

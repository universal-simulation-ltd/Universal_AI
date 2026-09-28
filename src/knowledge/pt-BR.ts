import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'Afinal, o que é um modelo de linguagem?',
    summary: 'Como um chatbot escreve, de onde vem o que ele sabe e por que ele pode errar.',
    group: 'O básico',
    body: `Um modelo de linguagem é um programa que aprendeu, a partir de uma quantidade enorme de texto, quais palavras costumam vir depois de quais. Dê a ele o começo de uma conversa e ele prevê um trecho de texto provável, depois o seguinte, e assim por diante até escrever uma resposta. É por isso que a resposta aparece aos poucos, e não de uma vez.

## De onde vem o que ele sabe

Tudo o que um modelo "sabe" foi absorvido durante o treinamento, antes de você baixá-lo. No Universal AI ele não tem conexão própria com a internet e não aprende com as suas conversas: o modelo no seu dispositivo continua exatamente como foi baixado. Ele também não tem como saber o que aconteceu depois do treinamento.

## Modelos grandes e pequenos

O tamanho de um modelo é medido em parâmetros, os números ajustados enquanto ele aprendia. O Universal AI oferece três:

- **Qwen2.5 0.5B**, com cerca de meio bilhão de parâmetros
- **Llama 3.2 1B**, com cerca de um bilhão
- **Llama 3.2 3B**, com cerca de três bilhões

Os grandes assistentes que você usa no navegador são muito maiores. Modelos pequenos são rápidos e cabem num celular, mas sabem menos e erram mais. As versões deste app são compactadas, com cada parâmetro reduzido a cerca de quatro bits: é assim que um modelo de um bilhão de parâmetros cabe num download de menos de 1 GB.

## Confiante não quer dizer correto

Um modelo escreve o que parece provável, não o que verificou. Ele pode afirmar algo falso exatamente no mesmo tom seguro de algo verdadeiro, o que costuma se chamar "alucinação", e modelos pequenos fazem isso com mais frequência. Use as respostas como ponto de partida e confira tudo o que for importante. O artigo sobre documentos e fontes explica como o Universal AI pode apoiar uma resposta num texto que você consegue ver.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Como uma IA consegue rodar num celular?',
    summary: 'WebGPU e modo CPU, como escolher um modelo e o que acontece quando falta memória.',
    group: 'O básico',
    body: `Quando você envia uma mensagem, é o seu próprio celular ou computador que escreve a resposta. Nada é enviado a um servidor para ser respondido.

## Duas formas de rodar

**WebGPU.** Se o seu navegador deixa as páginas usarem o chip gráfico do dispositivo, por meio de um recurso chamado WebGPU, o Universal AI roda o modelo ali. É a forma mais rápida, e os três modelos ficam disponíveis.

**Modo CPU.** Se o WebGPU não estiver disponível, o app roda o modelo no processador principal. É mais lento, mas funciona em quase qualquer lugar. O Llama 3.2 3B não é oferecido nesse modo, e o app sugere começar pelo menor modelo.

Ao abrir, o app verifica o que o seu dispositivo suporta. Você não precisa escolher.

## Como escolher um modelo

A aba Customise mostra os modelos pelo tipo de dispositivo a que se adaptam:

- **Older phones:** Qwen2.5 0.5B, um download de cerca de 0,4 GB
- **Most phones:** Llama 3.2 1B, cerca de 0,9 GB
- **Future phones:** Llama 3.2 3B, cerca de 2,2 GB, só com WebGPU

Um modelo maior dá respostas melhores, mas precisa de mais memória enquanto roda.

## Quando falta memória

Um modelo precisa caber na memória enquanto trabalha. Se não couber, o sistema pode fechar o app e recarregá-lo, o que acontece principalmente em iPhone e iPad. O Universal AI salva a conversa enquanto você usa, para que ela sobreviva a um reinício. Se o carregamento de um modelo foi interrompido da última vez, o app não tenta de novo sozinho quando abre: ele avisa você, para que você possa tentar outra vez ou escolher um modelo menor.

## Quanto da conversa ele vê

Para economizar memória, a cada mensagem enviada o modelo recebe só as oito mensagens mais recentes, incluindo a que você acabou de enviar. As mensagens mais antigas continuam na tela, mas o modelo não as vê mais.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'De onde vêm os modelos?',
    summary: 'O download único, onde os modelos ficam guardados e como removê-los.',
    group: 'Como funciona',
    body: `Um modelo é grande demais para vir dentro do app, então cada um é baixado na primeira vez que você o carrega. Depois disso, ele funciona sem conexão com a internet.

## De onde eles vêm

Os arquivos dos modelos vêm do Hugging Face, um site público onde modelos de IA são publicados. No modo WebGPU, um pequeno trecho de código de cada modelo também vem do GitHub. São downloads comuns de arquivos: nada das suas conversas é enviado para obtê-los, embora, como em qualquer download, esses sites vejam que o seu dispositivo pediu os arquivos.

## Onde ficam guardados

No armazenamento que o seu navegador, ou o app instalado, reserva para o Universal AI neste dispositivo. Ao abrir, o app carrega um modelo que já esteja ali, e fica pronto sem baixar de novo.

O seu dispositivo pode apagar esse armazenamento, por exemplo quando está quase sem espaço ou quando você limpa os dados do site do app no navegador. Nesse caso, basta baixar o modelo outra vez.

## Remover um modelo

Customise ▸ AI model lista os modelos baixados neste dispositivo. O botão de lixeira apaga um deles e libera o espaço. Você pode baixá-lo de novo quando quiser.

## O segundo modelo, menor

Se você usa documentos, pacotes de conhecimento ou a pesquisa na web, o app precisa também de um modelo bem menor, de cerca de 23 MB, que ele baixa do Hugging Face na primeira vez, junto com o código que o faz funcionar. Esse modelo não escreve respostas. Ele transforma texto em listas de números para que o app encontre os trechos que combinam com a sua pergunta. O próximo artigo explica como.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Como ele usa documentos e pacotes de conhecimento?',
    summary: 'Pesquisar antes de responder, as fontes numeradas e o que o ponto de confiança significa.',
    group: 'Como funciona',
    body: `Um modelo pequeno não consegue guardar muita coisa. O Universal AI ajuda pesquisando primeiro e entregando ao modelo o que encontrou. Essa técnica se chama recuperação (retrieval).

## O que acontece quando você pergunta

1. O pequeno modelo de busca transforma a sua pergunta numa lista de números que capta o sentido dela.
2. O app compara essa lista com cada trecho das bases de conhecimento que você ativou na aba Knowledge.
3. Até quatro trechos parecidos o bastante são adicionados, numerados, às instruções que o modelo recebe.
4. O modelo é instruído a responder e a marcar com o número, como [1] ou [2], o que tirou de um trecho.

Tudo isso acontece no seu dispositivo.

## Os seus documentos

Na aba Knowledge você pode colar texto ou adicionar arquivos .txt e .md. O app divide o texto em trechos de cerca de 700 caracteres, calcula os números de cada um e guarda tudo no armazenamento do app neste dispositivo. Nada é enviado.

## Pacotes prontos

A aba Knowledge também oferece pacotes já preparados: conhecimento geral da Simple Wikipedia (25.000 artigos, cerca de 17 MB) e um pacote sobre vinhos. Cada personagem também tem o seu próprio pacote. Os pacotes vêm do site do Universal AI quando você os baixa, ou de dentro do app nas versões para celular, e a busca neles acontece no seu dispositivo.

## Como ler o resultado

Toque num número de uma resposta para ver o trecho de onde ele veio. O ponto de confiança colorido mostra o quanto o melhor trecho combinava com a sua pergunta. Ele não diz se a resposta está certa: um modelo pode interpretar mal um bom trecho, e modelos pequenos às vezes deixam os números de fora. Se nada relevante for encontrado, o modelo responde só com o que aprendeu no treinamento, sem fontes.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'O que os personagens e o Safe mode fazem de verdade?',
    summary: 'Os dois são instruções para o modelo, e isso define até onde dá para confiar neles.',
    group: 'Como funciona',
    body: `Toda conversa começa com instruções que você não vê e que dizem ao modelo como se comportar. Isso costuma ser chamado de "prompt de sistema". Os personagens, o Safe mode e os seus nomes funcionam acrescentando algo a essas instruções.

## Personagens

Escolher um personagem, como Luigi the Chef ou Sherlock Holmes, acrescenta uma descrição da personalidade e do assunto dele. Se você baixou o pacote de conhecimento desse personagem, ele também é ativado, e só um personagem fica ativo de cada vez. Um nome definido em Customise ▸ Names substitui o nome do personagem.

O modelo está interpretando um papel. Ele não é a pessoa real e não leu o livro inteiro.

## Safe mode

O Safe mode fica ligado a menos que você ative 21+ em Customise. Ele acrescenta uma instrução para recusar conteúdo sexual ou adulto, jogos de azar, violência, atividades ilegais e outros temas nocivos.

É uma instrução, não um filtro. O app não confere as respostas depois, e um modelo pequeno nem sempre segue instruções, então o Safe mode torna respostas inadequadas menos prováveis, mas não consegue eliminá-las. Num dispositivo usado por crianças, fique de olho.

## Os seus nomes

Se você informar o seu nome, as instruções pedem ao modelo que o use de vez em quando. O nome que você dá ao assistente diz a ele como se chamar. Como o resto das instruções, eles ficam no seu dispositivo, a menos que você faça backup das suas configurações com um Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'O que sai do seu dispositivo, e quando?',
    summary: 'Cada vez que o app usa a internet e o que exatamente ele envia.',
    group: 'Privacidade e segurança',
    body: `As suas conversas são respondidas no seu dispositivo. Estas são todas as ocasiões em que o Universal AI usa a internet, e o que é enviado.

## Downloads

- **O próprio app.** Na web, ele carrega de opensource.unisim.co.uk como qualquer página e depois fica guardado para uso offline.
- **Os modelos de IA.** Do Hugging Face, mais um pouco de código do GitHub no modo WebGPU, quando você carrega um modelo pela primeira vez.
- **O modelo de busca.** Do Hugging Face, junto com o código que o faz funcionar, na primeira vez que documentos, pacotes ou a pesquisa na web precisarem dele.
- **Os pacotes de conhecimento.** Do site do Universal AI quando você toca em Download.

Nenhuma dessas solicitações contém as suas mensagens ou os seus documentos.

## Pesquisa na web, desligada por padrão

Se você ativar Customise ▸ Online web search e o dispositivo estiver online, cada mensagem enviada também vai como pesquisa para a Wikipédia em inglês. Os resultados são então comparados com a sua pergunta no seu dispositivo. Ou seja, com a pesquisa na web ligada, as suas perguntas saem do seu dispositivo, rumo à Wikipédia. Com ela desligada, nunca.

## Links que você abre

Os links das fontes e o botão Online abrem a Wikipédia ou o DuckDuckGo no seu navegador. O app pergunta antes, a menos que a pesquisa na web esteja ligada. Depois que a página abre, aquele site vê o que você pesquisou, como em qualquer pesquisa.

## Backup com Universal ID, desligado até você entrar

O app não entra em contato com o serviço Universal ID até você fazer login na aba Customise. O login envia o seu endereço de e-mail para que um código de uso único seja mandado a você. Depois disso, Back up settings envia as configurações da aba Customise para a sua conta UNI·SIM, onde só você pode lê-las: o tema, os nomes que você digitou, o personagem escolhido e as chaves liga/desliga. Restore backup as recupera.

## O que nunca sai

As suas conversas, respostas salvas e documentos nunca são enviados, com uma exceção: quando a pesquisa na web está ligada, as suas perguntas vão para a Wikipédia, como descrito acima.`,
  },
  {
    id: 'what-is-stored',
    title: 'O que fica guardado neste dispositivo?',
    summary: 'Conversas, respostas salvas, documentos e modelos, e como apagar cada um.',
    group: 'Privacidade e segurança',
    body: `Tudo o que o Universal AI guarda fica no armazenamento que o seu navegador, ou o app instalado, reserva para ele neste dispositivo. O app não acrescenta uma criptografia própria: esse armazenamento é protegido como o resto do seu dispositivo, pelo bloqueio de tela e pelo navegador, que mantém separados os dados de cada site.

## O que fica guardado

- **A conversa atual.** Salva enquanto você usa, para sobreviver a um reinício do app. Com Clear on close ligado, que é o padrão, ela é apagada quando você fecha o app. O botão de lixeira da conversa a apaga a qualquer momento.
- **Respostas salvas.** Toque e segure uma resposta, ou clique com o botão direito, para salvá-la. Elas ficam até você removê-las, e o Clear on close não as afeta.
- **Os seus documentos.** O texto que você adicionou, dividido em trechos, com os números usados na busca, até você apagá-los na aba Knowledge.
- **Modelos e pacotes de conhecimento.** Até você apagá-los em Customise ou na aba Knowledge.
- **As suas configurações.** Tema, nomes, personagem e chaves liga/desliga.
- **O seu login do Universal ID.** Se você entrou, até sair.

## Apagar tudo

Para remover tudo de uma vez, limpe os dados do site do Universal AI nas configurações do navegador ou desinstale o app no celular. Um backup das configurações guardado com o seu Universal ID não é afetado.

## Num dispositivo compartilhado

Qualquer pessoa que consiga abrir o Universal AI neste dispositivo pode ler as respostas salvas e, se o Clear on close estiver desligado, a conversa atual.`,
  },
]

export default articles

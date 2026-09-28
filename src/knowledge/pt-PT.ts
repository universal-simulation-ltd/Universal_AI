import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'O que é, afinal, um modelo de linguagem?',
    summary: 'Como um chatbot escreve, de onde vem o que sabe e porque se pode enganar.',
    group: 'O essencial',
    body: `Um modelo de linguagem é um programa que aprendeu, a partir de uma enorme quantidade de texto, que palavras costumam seguir-se a outras. Dado o início de uma conversa, prevê um excerto de texto provável, depois o seguinte, e assim por diante até ter escrito uma resposta. É por isso que a resposta vai aparecendo aos poucos e não de uma só vez.

## De onde vem o que sabe

Tudo o que um modelo «sabe» foi absorvido durante o treino, antes de ser descarregado. No Universal AI não tem ligação própria à internet e não aprende com as conversas: o modelo no dispositivo mantém-se exatamente como foi descarregado. Também não pode saber nada do que aconteceu depois do treino.

## Modelos grandes e pequenos

O tamanho de um modelo mede-se em parâmetros, os números ajustados enquanto aprendia. O Universal AI oferece três:

- **Qwen2.5 0.5B**, com cerca de quinhentos milhões de parâmetros
- **Llama 3.2 1B**, com cerca de mil milhões
- **Llama 3.2 3B**, com cerca de três mil milhões

Os grandes assistentes usados no navegador são muito maiores. Os modelos pequenos são rápidos e cabem num telemóvel, mas sabem menos e enganam-se mais. As versões desta app estão comprimidas, com cada parâmetro reduzido a cerca de quatro bits: é assim que um modelo de mil milhões de parâmetros cabe numa transferência de menos de 1 GB.

## Seguro não quer dizer certo

Um modelo escreve o que parece provável, não o que verificou. Pode afirmar algo falso exatamente com o mesmo tom confiante com que afirma algo verdadeiro, aquilo a que muitas vezes se chama «alucinação», e os modelos pequenos fazem-no com mais frequência. Convém tratar as respostas como ponto de partida e confirmar tudo o que for importante. O artigo sobre documentos e fontes explica como o Universal AI pode apoiar uma resposta num texto que é possível ver.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Como consegue uma IA funcionar num telemóvel?',
    summary: 'WebGPU e modo CPU, como escolher um modelo e o que acontece quando falta memória.',
    group: 'O essencial',
    body: `Quando envia uma mensagem, é o próprio telemóvel ou computador que escreve a resposta. Nada é enviado para um servidor para ser respondido.

## Duas formas de funcionar

**WebGPU.** Se o navegador deixar as páginas web usar o chip gráfico do dispositivo, através de uma funcionalidade chamada WebGPU, o Universal AI executa aí o modelo. É a forma mais rápida e os três modelos ficam disponíveis.

**Modo CPU.** Se o WebGPU não estiver disponível, a app executa o modelo no processador principal. É mais lento, mas funciona em quase todo o lado. O Llama 3.2 3B não é oferecido neste modo, e a app sugere começar pelo modelo mais pequeno.

Ao arrancar, a app verifica o que o dispositivo suporta. Não é preciso escolher.

## Escolher um modelo

O separador Customise apresenta os modelos pelo tipo de dispositivo a que se adequam:

- **Older phones:** Qwen2.5 0.5B, uma transferência de cerca de 0,4 GB
- **Most phones:** Llama 3.2 1B, cerca de 0,9 GB
- **Future phones:** Llama 3.2 3B, cerca de 2,2 GB, apenas com WebGPU

Um modelo maior dá melhores respostas, mas precisa de mais memória enquanto funciona.

## Quando a memória não chega

Um modelo tem de caber na memória enquanto trabalha. Se não couber, o sistema pode fechar a app e voltar a carregá-la, o que acontece sobretudo em iPhone e iPad. O Universal AI vai guardando a conversa para que sobreviva a um reinício. Se o carregamento de um modelo foi interrompido da última vez, a app não volta a tentar esse modelo sozinha ao abrir: avisa, para que seja possível tentar de novo ou escolher um mais pequeno.

## Quanto da conversa vê

Para poupar memória, sempre que é enviada uma mensagem o modelo recebe apenas as oito mensagens mais recentes, incluindo a que acabou de ser enviada. As mensagens mais antigas continuam no ecrã, mas o modelo já não as vê.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'De onde vêm os modelos?',
    summary: 'A transferência única, onde os modelos ficam guardados e como removê-los.',
    group: 'Como funciona',
    body: `Um modelo é demasiado grande para vir incluído na app, por isso cada um é descarregado da primeira vez que é carregado. A partir daí funciona sem ligação à internet.

## De onde vêm

Os ficheiros dos modelos vêm do Hugging Face, um site público onde são publicados modelos de IA. No modo WebGPU, um pequeno excerto de código de cada modelo vem também do GitHub. São transferências de ficheiros comuns: nada das conversas é enviado para os obter, embora, como em qualquer transferência, esses sites vejam que o dispositivo pediu os ficheiros.

## Onde ficam guardados

No armazenamento que o navegador, ou a app instalada, reserva para o Universal AI neste dispositivo. Ao abrir, a app carrega um modelo que já lá esteja e fica pronta sem voltar a descarregá-lo.

O dispositivo pode esvaziar este armazenamento, por exemplo quando está quase sem espaço ou quando se apagam os dados do site da app no navegador. Nesse caso, basta voltar a descarregar o modelo.

## Remover um modelo

Customise ▸ AI model mostra os modelos descarregados neste dispositivo. O botão do caixote do lixo apaga um e liberta o espaço. É possível voltar a descarregá-lo a qualquer momento.

## O segundo modelo, mais pequeno

Se usar documentos, pacotes de conhecimento ou a pesquisa na web, a app precisa também de um modelo muito mais pequeno, de cerca de 23 MB, que descarrega do Hugging Face da primeira vez, juntamente com o código que o faz funcionar. Este não escreve respostas. Transforma texto em listas de números para que a app encontre os excertos que correspondem à pergunta. O artigo seguinte explica como.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Como usa os documentos e os pacotes de conhecimento?',
    summary: 'Procurar antes de responder, as fontes numeradas e o que significa o ponto de confiança.',
    group: 'Como funciona',
    body: `Um modelo pequeno não consegue reter muita coisa. O Universal AI ajuda procurando primeiro a informação e passando ao modelo o que encontrou. Esta técnica chama-se recuperação (retrieval).

## O que acontece quando faz uma pergunta

1. O pequeno modelo de pesquisa transforma a pergunta numa lista de números que capta o seu sentido.
2. A app compara-a com cada excerto das bases de conhecimento ativadas no separador Knowledge.
3. Até quatro excertos suficientemente próximos são acrescentados, numerados, às instruções que o modelo recebe.
4. É pedido ao modelo que responda e que marque com o número, como [1] ou [2], o que retirou de um excerto.

Tudo isto acontece no dispositivo.

## Os seus documentos

No separador Knowledge é possível colar texto ou adicionar ficheiros .txt e .md. A app divide o texto em excertos de cerca de 700 caracteres, calcula os números de cada um e guarda tudo no armazenamento da app neste dispositivo. Nada é enviado.

## Pacotes prontos a usar

O separador Knowledge oferece também pacotes já preparados: conhecimento geral da Simple Wikipedia (25 000 artigos, cerca de 17 MB) e um pacote sobre vinho. Cada personagem tem também o seu próprio pacote. Os pacotes vêm do site do Universal AI quando são descarregados, ou do interior da app nas versões para telemóvel, e a pesquisa neles é feita no dispositivo.

## Ler o resultado

Toque num número de uma resposta para ver o excerto de onde veio. O ponto de confiança colorido mostra até que ponto o melhor excerto correspondia à pergunta. Não diz se a resposta está certa: um modelo pode interpretar mal um bom excerto, e os modelos pequenos às vezes omitem os números. Se nada relevante for encontrado, o modelo responde apenas com base no treino, sem fontes.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'O que fazem realmente as personagens e o Safe mode?',
    summary: 'Ambos são instruções dadas ao modelo, e isso define até onde se pode confiar neles.',
    group: 'Como funciona',
    body: `Cada conversa começa com instruções que não se veem e que dizem ao modelo como se comportar. É o que muitas vezes se chama «prompt de sistema». As personagens, o Safe mode e os nomes funcionam todos acrescentando algo a essas instruções.

## Personagens

Escolher uma personagem, como Luigi the Chef ou Sherlock Holmes, acrescenta uma descrição da sua personalidade e do seu tema. Se o pacote de conhecimento dessa personagem tiver sido descarregado, também é ativado, e só pode estar ativa uma personagem de cada vez. Um nome definido em Customise ▸ Names substitui o da personagem.

O modelo está a desempenhar um papel. Não é a pessoa real e não leu o livro inteiro.

## Safe mode

O Safe mode está ligado a menos que se ative 21+ em Customise. Acrescenta uma instrução para recusar conteúdo sexual ou para adultos, jogos de azar, violência, atividades ilegais e outros temas nocivos.

É uma instrução, não um filtro. A app não verifica as respostas depois, e um modelo pequeno nem sempre segue instruções, por isso o Safe mode torna as respostas inadequadas menos prováveis, mas não as consegue excluir. Num dispositivo usado por crianças, convém estar atento.

## Os seus nomes

Se indicar o seu nome, as instruções pedem ao modelo que o use de vez em quando. O nome dado ao assistente diz-lhe como se chamar. Tal como o resto das instruções, ficam no dispositivo, a menos que faça cópia de segurança das definições com um Universal ID.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'O que sai do dispositivo, e quando?',
    summary: 'Todas as vezes que a app usa a internet e o que envia exatamente.',
    group: 'Privacidade e segurança',
    body: `As conversas são respondidas no dispositivo. Estas são todas as ocasiões em que o Universal AI usa a internet, e o que é enviado.

## Transferências

- **A própria app.** Na web, é carregada a partir de opensource.unisim.co.uk como qualquer página e depois fica guardada para uso offline.
- **Os modelos de IA.** Do Hugging Face, mais um pouco de código do GitHub no modo WebGPU, quando um modelo é carregado pela primeira vez.
- **O modelo de pesquisa.** Do Hugging Face, juntamente com o código que o faz funcionar, da primeira vez que os documentos, os pacotes ou a pesquisa na web precisam dele.
- **Os pacotes de conhecimento.** Do site do Universal AI quando se toca em Download.

Nenhum destes pedidos contém as suas mensagens nem os seus documentos.

## Pesquisa na web, desligada por predefinição

Se ativar Customise ▸ Online web search e o dispositivo estiver ligado à internet, cada mensagem enviada é também enviada como pesquisa para a Wikipédia em inglês. Os resultados são depois comparados com a pergunta no dispositivo. Ou seja, com a pesquisa na web ligada, as perguntas saem do dispositivo, com destino à Wikipédia. Com ela desligada, nunca.

## Ligações que abre

As ligações das fontes e o botão Online abrem a Wikipédia ou o DuckDuckGo no navegador. A app pergunta primeiro, a menos que a pesquisa na web esteja ligada. Depois de a página abrir, esse site vê o que foi pesquisado, como em qualquer pesquisa.

## Cópia de segurança com Universal ID, desligada até iniciar sessão

A app não contacta o serviço Universal ID até ser iniciada sessão no separador Customise. Ao iniciar sessão, é enviado o seu endereço de e-mail para que lhe chegue um código de utilização única. Depois disso, Back up settings envia as definições do separador Customise para a sua conta UNI·SIM, onde só o titular as pode ler: o tema, os nomes introduzidos, a personagem escolhida e os interruptores. Restore backup volta a obtê-las.

## O que nunca sai

As conversas, as respostas guardadas e os documentos nunca são enviados, com uma exceção: com a pesquisa na web ligada, as perguntas vão para a Wikipédia, como descrito acima.`,
  },
  {
    id: 'what-is-stored',
    title: 'O que fica guardado neste dispositivo?',
    summary: 'Conversas, respostas guardadas, documentos e modelos, e como apagar cada um.',
    group: 'Privacidade e segurança',
    body: `Tudo o que o Universal AI guarda está no armazenamento que o navegador, ou a app instalada, lhe reserva neste dispositivo. A app não acrescenta encriptação própria: este armazenamento está protegido como o resto do dispositivo, pelo bloqueio e pelo navegador, que mantém separados os dados de cada site.

## O que fica guardado

- **A conversa atual.** Guardada à medida que avança, para sobreviver a um reinício da app. Com Clear on close ligado, que é a predefinição, é apagada quando a app é fechada. O botão do caixote do lixo na conversa apaga-a a qualquer momento.
- **Respostas guardadas.** Mantenha premida uma resposta, ou clique com o botão direito, para a guardar. Ficam até serem removidas, e o Clear on close não as afeta.
- **Os seus documentos.** O texto adicionado, dividido em excertos, com os números usados na pesquisa, até serem apagados no separador Knowledge.
- **Modelos e pacotes de conhecimento.** Até serem apagados em Customise ou no separador Knowledge.
- **As definições.** Tema, nomes, personagem e interruptores.
- **A sessão Universal ID.** Se tiver iniciado sessão, até terminar a sessão.

## Apagar tudo

Para remover tudo de uma vez, apague os dados do site do Universal AI nas definições do navegador ou desinstale a app no telemóvel. Uma cópia de segurança das definições guardada com o seu Universal ID não é afetada.

## Num dispositivo partilhado

Qualquer pessoa que consiga abrir o Universal AI neste dispositivo pode ler as respostas guardadas e, se o Clear on close estiver desligado, a conversa atual.`,
  },
]

export default articles

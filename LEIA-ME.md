# Site, Patricia Wisnevski

Site de uma página com topo cinematográfico guiado por scroll e uma área de
gestão para a corretora atualizar o conteúdo sem mexer em código.

HTML, CSS e JavaScript puros: sem framework, sem build, sem npm.

Há **dois destinos possíveis, e nos dois a corretora tem o painel.** Numa
hospedagem com PHP, sobe `site/` inteiro. No Netlify, sobe `publicar/` mais as
funções de `netlify/functions/`, que são o mesmo painel reescrito em JavaScript.
A seção 5 compara as duas.

```
patricia-wisnevski/
├── site/                  <- O PROJETO. Vai inteiro para hospedagem com PHP.
│   ├── index.html
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── robots.txt
│   ├── css/estilo.css
│   ├── js/dados.js        <- todo o conteúdo do site
│   ├── js/script.js       <- o site
│   ├── painel/            <- a área do gestor, em PHP
│   ├── conteudo/          <- dados e senha. Protegido por .htaccess
│   └── assets/
├── netlify/functions/     <- O PAINEL NO NETLIFY, em JavaScript.
│   ├── painel.mjs         <- a tela do gestor
│   ├── dados.mjs          <- entrega o conteúdo ao site
│   ├── foto.mjs           <- serve as fotos enviadas
│   ├── _nucleo.mjs        <- senha, sessão, CSRF, validação
│   └── _armazem.mjs       <- onde o conteúdo fica guardado
├── publicar/              <- GERADA. O pacote estático do Netlify.
├── .armazem-local/        <- GERADA. O conteúdo ao testar na sua máquina.
├── publicar.js            <- monta publicar/ a partir de site/
├── servidor-funcoes.mjs   <- testa as funções aqui. Não sobe.
├── package.json           <- só para as funções. O site segue sem build.
├── netlify.toml           <- cabeçalhos, cache e o comando de build
├── revisao/               <- brutos, quadros e descartes. Nunca sobe.
├── PACOTE-DE-DESIGN.md
├── servidor-local.js      <- pré-visualização. Não sobe.
└── LEIA-ME.md             <- este arquivo. Não sobe.
```

Nunca edite `publicar/` na mão: ela é apagada e refeita a cada `node publicar.js`.

---

## 1. A estrutura

**Topo:** vídeo de 15 segundos de um apartamento de alto padrão. A câmera sai de
um corredor escuro, atravessa o living e descansa enquadrando o terraço e a água.
Ele **não toca sozinho**: avança conforme o visitante rola e volta quando ele
sobe. Três frases aparecem no caminho.

**Depois:** Sobre, Opções e Dúvidas com contato. Três seções, nada mais. Entre o
Sobre e os cards fica a **barra de filtro**: tipo, bairro e faixa de preço.

**No rodapé:** um quadradinho discreto no canto inferior direito abre a área do
gestor.

### O tema

Papel quente (`#F4F2ED`), nunca branco puro, tinta quase preta puxando para o
marrom (`#1A1713`) e um acento só, um bege escuro de madeira (`#7E6039`). Para
mudar a cara do site inteiro, mexa no bloco `:root` no começo de
`site/css/estilo.css`.

---

## 2. A ÁREA DO GESTOR

O painel fica em **`seudominio.com.br/painel/`**, e o quadradinho discreto no
rodapé do site leva até lá.

**Ele existe em duas versões, com a mesma tela e as mesmas regras.** Em
hospedagem com PHP, é `site/painel/`. No Netlify, são as funções de
`netlify/functions/`. A diferença é só onde o conteúdo fica guardado:

| | Com PHP | No Netlify |
|---|---|---|
| Conteúdo | `conteudo/dados.json` | Netlify Blobs |
| Fotos por imóvel | **uma** | **até 12** |
| Fotos enviadas | `assets/imoveis/` | Netlify Blobs, servidas por `/api/foto/` |
| Senha | `conteudo/config.php` | Netlify Blobs |
| Sessão | sessão do PHP | cookie assinado |
| Tamanho máximo de foto | 10 MB | **4 MB**, que é o teto do Netlify |

O cabeçalho do próprio `dados.js` diz para não editar à mão. **Isso vale
enquanto houver painel no ar**, porque a gravação dele passa por cima. Num site
publicado sem painel nenhum, editar à mão é o caminho certo.

### Primeiro acesso

Na primeira vez que alguém abre o painel, ele pede para **criar a senha**. Quem
abrir primeiro define. Então, assim que o site subir, entre e crie a senha antes
de divulgar o endereço. A senha fica guardada no servidor com criptografia do
próprio PHP e não dá para ler de volta, nem por mim.

Para zerar e definir outra, apague o arquivo `conteudo/config.php` pelo
gerenciador de arquivos da hospedagem. O painel volta a pedir uma senha nova.

### O que ela faz

Uma página só, com três blocos e um botão de salvar que fica fixo embaixo:

- **Imóveis e opções.** Cada item vira um card. Trocar as fotos, o título, a
  descrição, e reordenar pelo número de ordem. Preenchendo **bairro, preço e
  características**, o card deixa de ser categoria e vira anúncio, com as
  etiquetas de metragem e o valor. Tem caixinha para remover e botão para
  adicionar.

  **Cada imóvel aceita até 12 fotos.** No painel do Netlify, o campo de envio
  aceita várias de uma vez. A primeira da lista é a **capa**, que aparece no
  card; as outras só aparecem quando alguém abre o visor. Para trocar a capa,
  mude o número de ordem. Cada foto tem a sua descrição, para quem navega sem
  enxergar. Removida a foto, o arquivo dela é apagado junto; removido o imóvel,
  todas as dele vão junto.

  **A barra de filtro se monta sozinha a partir daqui.** Os tipos vêm das
  etiquetas, os bairros vêm do campo bairro, e a faixa de preço lê o valor. Item
  sem bairro não some do site: ele só não entra na lista de bairros, e o campo
  inteiro desaparece da barra enquanto nenhum imóvel tiver bairro. Um item sem
  preço nunca é escondido por um filtro de preço, porque esconder por um dado
  que não existe seria mentir para quem procura.
- **Sobre.** A foto dela, a frase de destaque e o texto de apresentação.
- **Contato.** WhatsApp, Instagram, e-mail, CRECI e cidade, mais **a mensagem
  que já vem escrita** quando alguém clica em Falar com a Patricia.

**Salvar já publica.** O site muda na hora, sem baixar nem subir nada.

### Como funciona por dentro

O painel grava em `conteudo/dados.json` e, na mesma gravação, reescreve
`js/dados.js`. O site público continua **100% estático**: quem visita nunca
executa PHP nem toca no painel. Se o painel quebrar, o site no ar nem percebe.

A gravação é feita em arquivo temporário e trocada no fim, então uma queda no
meio do caminho nunca deixa o conteúdo pela metade.

### O que foi feito pela segurança

- Senha com `password_hash` do PHP, o padrão da linguagem.
- `conteudo/config.php` é um arquivo PHP que não imprime nada: mesmo aberto
  direto no navegador, devolve página em branco. **Testado.**
- Token anti-CSRF em todo envio. Sem ele, o painel responde 400. **Testado.**
- Cinco senhas erradas travam por 15 minutos, e nesse período nem a senha certa
  entra. **Testado.**
- Foto enviada passa por três barreiras: extensão na lista, o PHP confirma que
  é mesmo uma imagem, e **o nome do arquivo é inventado por nós**. Nada que o
  navegador manda entra no caminho do arquivo.
- `.htaccess` nega a pasta `conteudo/` e desliga execução dentro de
  `assets/imoveis/`.
- Fora do localhost o painel **só abre em https**. Sem cadeado ele recusa, para
  a senha não viajar em texto puro.

**O que eu não consegui testar aqui:** os arquivos `.htaccess`. O servidor de
teste do PHP não lê essas regras; só o Apache da hospedagem lê. Confira na
primeira publicação abrindo `seudominio.com.br/conteudo/dados.json` no
navegador: tem que dar erro 403. Se abrir o conteúdo, me avise que eu resolvo de
outro jeito.

### O que ainda é limitação honesta

- Não tem histórico de versões: a gravação nova substitui a anterior.
- Não tem recuperação de senha por e-mail. Esqueceu, apaga o `config.php`.
- Um usuário só. Não há perfis separados.

---

## 3. O que falta preencher

### WhatsApp

Pela área do gestor, aba Contato. Ou em `site/js/dados.js`:

```js
whatsapp: "5551999998888",   // só números: 55 + DDD + número
```

**Com o número preenchido, todo botão do site abre o WhatsApp dela com a
mensagem já digitada.** São três textos diferentes, conforme de onde a pessoa
clicou:

| De onde | O que chega escrito |
|---|---|
| Falar com a Patricia, em qualquer lugar | a mensagem padrão, editável no painel |
| Quero saber mais, dentro de um card | a mesma coisa, mas com o nome do imóvel |
| Enviar para a Patricia, no formulário | nome, telefone e o que a pessoa procura |

Assim ela já abre a conversa sabendo de onde veio o contato.

Sem o número, três coisas acontecem de forma honesta: os botões apontam para o
Instagram, o formulário some e dá lugar ao contato direto, e o site não finge
que enviou nada.

### Domínio

Em `site/index.html`, procure `<!-- DEPLOY STEP -->` e troque as três URLs.

### A foto dela

Feito. `assets/patricia-sobre.jpg` é a original em alta, 1100x1402. Para trocar
de novo, use o painel do gestor.

### Trocar o vídeo do topo

Processe assim, senão o scroll engasga:

```bash
ffmpeg -i bruto.mp4 -vf scale=1920:-2 -c:v libx264 -crf 24 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an site/assets/hero-scrub.mp4
```

O `-g 8` é o que importa: um ponto de parada a cada 8 quadros. Depois gere o
pôster e o quadro final, e atualize `VIDEO_BYTES` no `site/js/script.js` com o
tamanho novo em bytes.

```bash
ffmpeg -i site/assets/hero-scrub.mp4 -frames:v 1 -q:v 3 site/assets/hero-poster.jpg
ffmpeg -sseof -0.1 -i site/assets/hero-scrub.mp4 -update 1 -frames:v 1 -q:v 3 site/assets/hero-ending.jpg
```

---

## 4. Rodar localmente

Agora que existe PHP, o servidor precisa ser o do PHP, senão o painel não roda:

```bash
php -S localhost:4181 -t site
```

Site em `http://localhost:4181` e painel em `http://localhost:4181/painel/`.

Para ver **o pacote do Netlify com o painel junto**, igualzinho ao que vai para
o ar, use o servidor das funções:

```bash
node publicar.js && node servidor-funcoes.mjs
```

Abre em `http://localhost:4182`, painel em `/painel/`. Ele carrega as funções de
`netlify/functions/` e roteia igual ao Netlify. O conteúdo vai para
`.armazem-local/` em vez de Blobs, porque é a sua máquina. Para começar do zero,
apague essa pasta: o painel volta a pedir senha nova.

Para ver **só a parte estática**, sem função nenhuma:

```bash
node servidor-local.js publicar
```

---

## 5. Publicar

### A escolha que vem antes

O Netlify não roda PHP, mas **isso deixou de tirar o painel do ar**: ele foi
reescrito como função. Os dois destinos entregam o site inteiro.

| | Hospedagem com PHP | Netlify |
|---|---|---|
| O site | igual nos dois | igual nos dois |
| Vídeo, filtro, WhatsApp | funcionam | funcionam |
| Painel da corretora | funciona | funciona |
| Certificado e CDN | você configura | já vem pronto |
| Publicar de novo | por FTP, na mão | sozinho, a cada envio |
| Foto no painel | até 10 MB | até 4 MB |
| Custo | mensalidade | de graça, no volume deste site |

A portinha do rodapé aponta para `/painel/`, que é a função. Se um dia o painel
for morar em outro endereço, troque a primeira linha de configuração de
`publicar.js`:

```js
var PAINEL = "https://painel.seudominio.com.br/";
```

Vazio, a portinha nem entra no pacote. Um botão que leva a lugar nenhum é pior
do que botão nenhum.

### No Netlify

Monte o pacote:

```bash
node publicar.js
```

Ele apaga e refaz `publicar/` a partir de `site/`, deixando de fora `painel/`,
`conteudo/` e os `.htaccess`. No fim ele **confere e recusa a publicação** se
algum `.php` ou o arquivo de senha tiver escapado para dentro da pasta.

**Sem painel, arraste e pronto.** Com `PAINEL = ""` em `publicar.js`, o pacote é
só arquivo estático: abra app.netlify.com, vá em **Sites**, e arraste a pasta
`publicar/` (ou o `site-patricia-netlify.zip`) para a área de envio. A cada
mudança, rode `node publicar.js` e arraste de novo.

**Com o painel, tem que ser por Git.** Arrastar publica arquivos estáticos e
nada mais: o Netlify não instala a dependência das funções nem as empacota,
então o site subiria e o painel daria 404. Nesse caso:

1. Suba a pasta do projeto para um repositório.
2. Em app.netlify.com, **Add new site, Import an existing project**, e aponte
   para ele.
3. Não preencha nada na tela de build: o `netlify.toml` já diz o comando, a
   pasta a publicar e onde ficam as funções.

Daí cada envio ao repositório republica o site sozinho. O `.gitignore` já segura
`publicar/`, `.armazem-local/`, `revisao/`, `node_modules/` e o arquivo de senha
do painel PHP.

### A senha do painel, no ar

Na primeira vez que alguém abrir `seusite.netlify.app/painel/`, ele pede para
**criar a senha**. Quem abrir primeiro define. Então entre e crie a senha logo
depois da primeira publicação, antes de divulgar o endereço.

Para zerar e definir outra, apague a chave `conf` no painel de Blobs do Netlify,
em **Site configuration, Blobs, store `site`**.

O conteúdo fica num store chamado `site`, que o Netlify cria sozinho na primeira
gravação. Não há nada a configurar antes.

O `netlify.toml` também cuida de:

- cabeçalhos de segurança em tudo (`nosniff`, `X-Frame-Options`, HSTS);
- cache de um ano para imagens e vídeo, e revalidação para HTML, CSS e JS, que
  mudam a cada publicação e têm nome fixo;
- `/painel/` redirecionando para a home, para quem tiver o endereço antigo.

### Numa hospedagem com PHP

Suba **o conteúdo de `site/`** para `public_html`, inclusive as pastas
`painel/` e `conteudo/`. Não use `publicar/` aqui: ela não tem o painel.

Depois, pelo gerenciador de arquivos, confira as permissões:

| Pasta | Permissão |
|---|---|
| `conteudo/` | 755 |
| `js/` | 755 |
| `assets/imoveis/` | 755 |

Sem isso o painel abre mas não consegue salvar, e ele avisa na tela quando
é esse o caso.

A HostGator já vem com PHP ligado, então não há nada a instalar. Qualquer
versão de PHP 8 serve: o painel usa só o núcleo da linguagem, sem banco de
dados e sem extensão extra.

---

## 6. O que foi medido

Chrome de verdade, headless, com toque emulado.

| | |
|---|---|
| Peso da página sem o vídeo | **157 KB** |
| Vídeo, atrás do anel de progresso | 4,9 MB |
| Contraste do texto do topo, pior quadro de cada faixa | **7,43 / 7,71 / 7,49** (piso: 3,5) |
| Contraste na página clara, menor medido | 5,19 |
| Barra de filtro | filtra por tipo, bairro e preço, e conta certo em todos os casos testados |
| Botões de WhatsApp | os nove levam ao número certo, cada um com o texto certo já escrito |
| Pacote do Netlify | 16 arquivos, 7,86 MB, nenhum `.php` e nenhum pedido a `conteudo/` |
| Painel no Netlify | cria senha, entra, edita, envia foto e publica, tudo conferido |
| Foto enviada | volta em `/api/foto/`, com o tipo certo e os bytes certos |
| Trava de 5 erros | fecha e recusa 401 até a senha certa, por 15 minutos |
| CSRF inválido | recusado com 400 |
| Site lendo o painel | card, bairro, preço e botão de WhatsApp mudam sem republicar |
| Galeria no painel | envia várias, reordena, troca a capa, remove e apaga o arquivo |
| Visor no site | abre, navega com seta e teclado, dá a volta, fecha no Esc |
| Foco no visor | fica preso dentro e volta ao card ao fechar |
| O site sem o painel | vídeo, filtro, cards e foto funcionam igual; só a portinha some |
| Pacote sem painel | nenhum pedido a `/api` ou `/painel`: nada de backend |
| O zip | descompacta com `index.html` na raiz, 15 arquivos idênticos à pasta |
| Celular com toque de verdade | **não baixa o vídeo** |
| Movimento reduzido | não baixa o vídeo, re-arma nas duas direções |
| Rolagem lateral indevida | zero |
| Recursos com falha | zero |
| Área do gestor | abre, recusa senha errada, aceita a certa, edita e reflete no site |
| Arquivo gerado pelo gestor | JavaScript válido, acentos preservados |

---

## 7. O que falta para o site estar pronto

Em ordem de importância.

### Trava o lançamento

- **O WhatsApp da Patricia.** É o único campo vazio que muda o comportamento do
  site: sem ele, todos os nove botões vão para o Instagram em vez de abrir
  conversa. Cadastre pelo painel, aba Contato.
- **O domínio.** Em `site/index.html`, procure `<!-- DEPLOY STEP -->` e troque
  as três URLs. Enquanto não for trocado, o que o Google e o WhatsApp leem ao
  compartilhar o link aponta para um endereço que não existe.

### Não trava, mas pesa

- **Imóveis de verdade.** Os quatro cards de hoje são categorias, sem bairro e
  sem preço. A barra de filtro já funciona, mas só mostra o que tem para
  mostrar: enquanto forem categorias, ela filtra pouca coisa.
- **Fotos reais dos imóveis.** As de hoje são ilustrativas e geradas por
  inteligência artificial, e o rodapé diz isso. Honesto, mas não vende.

### Decisões que ainda são suas

- **Onde o painel vai morar.** Com painel, a publicação tem que ser por Git.
  Sem painel, dá para arrastar a pasta. A seção 5 compara.
- **Os dois painéis.** Existem duas versões, PHP e Netlify, e elas já não são
  iguais: só a do Netlify aceita várias fotos por imóvel. Salvar pelo painel PHP
  não apaga as fotos extras, mas também não permite mexer nelas. Escolhida a
  hospedagem, a outra versão deveria sair do projeto.

### Fica de fora de propósito

- **Depoimentos.** Depoimento inventado derruba a credibilidade de um site que
  vende confiança. Entram quando houver reais, autorizados.
- **Blog e sitemap.xml.** O `robots.txt` aponta para um sitemap que ainda não
  existe.

## 8. Uma observação sobre o texto do topo

A primeira frase, *"Porto Alegre tem muita coisa boa, eu te mostro isso"*, é
praticamente igual à de abertura do site do Léo Gimenes, que serviu de
inspiração. Foi um pedido direto e está no ar como pedido. Se um dia quiser
diferenciar, é uma linha no `index.html`, no primeiro `.band`.

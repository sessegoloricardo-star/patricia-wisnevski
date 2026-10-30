# Pacote de Design — Patricia Wisnevski

Escrito antes de qualquer geração. A construção consome este documento e embarca
cada linha de texto ao pé da letra.

---

## 1. A premissa da marca

**A lista curta.**

Porto Alegre lançou 1.205 unidades de médio e alto padrão em seis meses. Ninguém
precisa ver 1.205. Precisa ver três.

O que define uma boa corretora não é o que ela mostra, é o que ela tira da sua
frente. O site inteiro ensina e vende o descarte. Cada seção prova que ela remove
antes de oferecer, e isso responde de frente a reclamação número um do setor:
corretor que empurra imóvel fora do perfil e não aceita um não.

Se uma seção não serve ao descarte, ela não pertence à página.

---

## 2. A paleta

Amostrada do mundo da filmagem: torre de vidro na hora azul, janelas acesas, hall
em madeira e travertino. Valores finais serão reamostrados da filmagem aprovada
depois do gate do vídeo.

```css
:root{
  --canvas:#0C131C;        /* azul-tinta do céu da hora azul, nunca preto puro */
  --panel:#141F2C;         /* cartões e superfícies elevadas */
  --accent:#E8C79A;        /* a luz quente das janelas, puxada para trigo */
  --accent-hover:#F2D6AF;
  --accent-muted:#7C6B55;  /* bordas, brilhos, partículas */
  --text-primary:#EAF0F6;
  --text-secondary:#93A4B6;
}
```

**Desvio declarado.** A skill proíbe, como reflexo padrão, o trio quase-preto mais
âmbar quente mais serifa de alto contraste. O site anterior caía exatamente nele.
Aqui a tela é azul-tinta, não quase-preta; o acento é trigo seco, não ouro; e a
display é um grotesco arquitetônico, não uma serifa. A luz quente permanece porque
ela é literalmente o mundo material do assunto: um prédio residencial ao entardecer
é um painel de janelas acesas.

---

## 3. O trio de fontes

| Papel | Face | Pesos |
|---|---|---|
| Display | **Archivo** (eixo de largura, 100 a 125) | 500, 600, 700 |
| Texto | **Instrument Sans** | 400, 500 |
| Rótulos | **IBM Plex Mono** | 400, 500 |

Archivo expandida lê como fachada: arquitetônica, confiante, sem nenhum parentesco
com a serifa de luxo de prateleira.

---

## 4. O elemento assinatura

**O descarte.**

Uma pilha de candidatos que é visivelmente riscada e cai, até sobrarem três. Ele
aparece em três lugares:

- Como o momento interativo: o visitante pressiona e segura, e roda o descarte com
  as próprias mãos.
- Como motivo: a régua fina que risca o rótulo de cada seção.
- Como a lógica do texto inteiro.

Teste de volume: tirar o descarte do site muda a página por completo. Sem ele
sobra mais um site de corretor.

---

## 5. O hero

Jornada: **a descida**. A câmera começa no alto de uma torre de vidro na hora azul
e desce a fachada, andar por andar, janelas acesas passando. Perto do fim ela
atravessa o vidro, com a batida física da lente, e entra no hall iluminado, onde
descansa.

- Duração: 15 segundos, geração única, sem emenda.
- Altura do hero: **950vh**. Intervalo de scroll: 850vh.
- Rolar para baixo é literalmente descer. Eixo um para um com o scroll.

### O mapa de faixas

| Faixa | Intervalo | Momento da filmagem | Texto (ao pé da letra) | Entrada |
|---|---|---|---|---|
| 1 | 0.00 a 0.14 | alto da torre, o céu ainda no quadro | "Quase tudo não serve para você." | deriva para baixo |
| 2 | 0.17 a 0.33 | descendo a fachada, janelas passando | "Porto Alegre lançou 1.205 imóveis de médio e alto padrão em seis meses." | alinhamento em grade |
| 3 | 0.36 a 0.52 | mais fundo na fachada, reflexos correndo | "Você não precisa ver 1.205." | dispersão |
| 4 | 0.55 a 0.70 | a travessia do vidro, a batida de desfoque | "Precisa ver três." | soco de palavra com overshoot |
| 5 | 0.74 a 1.00 | o hall iluminado, em repouso | "Patricia Wisnevski" / "Corretora de imóveis em Porto Alegre. CRECI-RS 082111. Trinta anos negociando." / botão "Falar com a Patricia" | subida palavra por palavra em três chegadas |

Platôs em vh, a validar pelo teste de flick: faixa 1 cerca de 100vh, faixa 2 cerca
de 100vh, faixa 3 cerca de 100vh, faixa 4 cerca de 92vh, faixa 5 cerca de 190vh.

A faixa da ação é a fachada no centro e à direita. As legendas vivem no terço
esquerdo, que a geração mantém como plano contínuo de vidro recuando na sombra.

### Picos de scrim por faixa

0.62 nas faixas 1, 3 e 5. 0.68 na faixa 2, que tem janelas acesas atrás. 0.72 na
faixa 4, o gancho, sobre a travessia clara. Calibrar contra o pior quadro.

---

## 6. O bloco do hero estático

Para celular e movimento reduzido, composto sobre o quadro final.

- Título: "Quase tudo não serve para você."
- Subtítulo: "Porto Alegre lançou 1.205 imóveis de médio e alto padrão em seis meses. Você não precisa ver 1.205. Precisa ver três."
- Assinatura: "Patricia Wisnevski. Corretora de imóveis, CRECI-RS 082111."
- Botão: "Falar com a Patricia"

---

## 7. O esboço abaixo da dobra

Cada seção afunila para a única chamada para ação: falar com a Patricia.
Duas seções vizinhas nunca repetem o mesmo esqueleto.

### 7.1 O descarte (o momento interativo)

Rótulo: "01 / O método"
Título: "Como três sobram de 1.205."
Lede: "Pressione e segure. É isto que eu faço antes de te mostrar qualquer coisa."

O visitante segura o botão. Um contador cai de 1.205 em direção a 3 enquanto cinco
critérios são riscados, um por vez:

1. "Fora da sua região" — risca
2. "Fora do seu orçamento real, com condomínio e IPTU na conta" — risca
3. "Entrega fora do seu prazo" — risca
4. "Planta que não serve para a sua vida" — risca
5. "Construtora sem histórico de entrega" — risca

No fim sobram três cartões, e o texto fecha: "Sobraram três. Agora a gente visita."

Soltar cedo desce o progresso suave. Movimento reduzido recebe o estado final
pronto.

### 7.2 Sobre Patricia

Rótulo: "02 / Quem faz o descarte"

Citação: "Posso ter mudado de mercado. Mas a essência do que sempre fiz continua a
mesma: conectar pessoas e construir negócios de valor."

Corpo (as palavras dela, do relato):

"Minha trajetória profissional começou cedo, ainda aos 13 anos. De lá para cá
vieram os primeiros aprendizados, a experiência de empreender e, mais tarde, a
responsabilidade de liderar a operação brasileira de uma holding internacional."

"Foram mais de 30 anos entre negociações, diferentes mercados, culturas e pessoas.
Experiências que me ensinaram que grandes negócios começam muito antes da
assinatura de um contrato: eles começam na confiança, na estratégia e na
construção de relacionamentos."

"Foi essa bagagem que trouxe comigo para o mercado imobiliário. É com ela que eu
sei o que descartar."

Trajetória em quatro marcos: "Aos 13", "Empreender", "Holding internacional",
"Hoje".

### 7.3 O momento do mercado

Rótulo: "03 / O que está acontecendo agora"
Título: "Mais lançamento. Menos comprador."

Quatro números, com a fonte declarada (Sinduscon-RS com Alphaplan e Órulo,
primeiro semestre de 2026):

- **1.205** unidades de médio e alto padrão lançadas no semestre
- **+18%** em relação ao mesmo período de 2025
- **-8%** nas vendas
- **maior** estoque semestral desde 2022

Leitura honesta: "Estoque parado é poder de negociação para quem compra. Mas só
para quem sabe qual estoque está parado, e por quê. É nessa conversa que trinta
anos de negociação deixam de ser uma frase bonita no currículo."

### 7.4 O que eu tiro da sua frente

Rótulo: "04 / O filtro"

Quatro colunas, cada uma dita pelo que ela remove:

1. **Lançamento que não entrega.** "Eu olho histórico de entrega da construtora antes de olhar a planta. Obra atrasada custa aluguel que você não planejou."
2. **Conta que não fecha.** "Condomínio, IPTU e taxa de obra entram na conta antes da visita. O orçamento real não é o preço da tabela."
3. **Crédito que não sai.** "A aprovação do banco é checada antes, não depois da proposta. Financiamento negado em cima da hora é um dos piores jeitos de perder um imóvel."
4. **Imóvel que não é para você.** "Se o que você procura não existe na minha mão, eu digo. E, quando faz sentido, indico quem tem."

### 7.5 O que eu posso buscar para você

Rótulo: "05 / As frentes"
Quatro cartões com imagem: Lançamentos, Alto padrão, Investimento, Pronto para morar.

### 7.6 O caminho

Rótulo: "06 / Como funciona"
Quatro etapas: Conversa inicial, O descarte, Visitas e números, Negociação e chaves.

### 7.7 Dúvidas

Rótulo: "07 / Antes de me chamar"

Respondendo as objeções reais encontradas na pesquisa:

1. **"E se eu me arrepender depois de assinar?"**
   "Compra feita em estande tem sete dias de arrependimento por lei. Passado esse
   prazo, desistir vira distrato, e a construtora pode reter uma fatia grande do
   que você já pagou. É justamente por isso que eu demoro na conversa antes e sou
   rápida na visita. Ninguém assina comigo no primeiro encontro."

2. **"E se o banco negar meu financiamento?"**
   "A gente checa sua capacidade de crédito antes da proposta, não depois. Promessa
   de aprovação que o corretor não pode dar é como muita gente perde sinal e tempo."

3. **"Você vai ficar me ligando todo dia?"**
   "Não. Eu combino com você de quanto em quanto tempo faz sentido falar, e cumpro.
   Se você sumir, eu entendo que não era o momento."

4. **"Com quais construtoras você trabalha?"**
   "Atuo em parceria com a Melnick e a Housin, e acompanho os demais lançamentos
   relevantes da cidade. Isso me deixa comparar produto de incorporadoras
   diferentes em vez de empurrar um estoque só."

5. **"Atende quem quer investir, e não morar?"**
   "Sim, e a conversa muda bastante. Entram fluxo de pagamento, perfil do
   empreendimento, liquidez e horizonte de saída. São mais de 30 anos avaliando
   negócio, e é esse olhar que eu trago."

6. **"Tem custo para mim?"**
   "Na compra de lançamento, a corretagem é paga pela construtora. Em outras
   operações, as condições são combinadas antes de qualquer visita."

### 7.8 A chamada final e o formulário

Rótulo: "08 / Começar"
Título: "Me diga o que você procura."
Lede: "Três campos. Eu respondo com uma seleção curta, não com um catálogo."

Campos: "Seu nome", "Seu WhatsApp", "O que você procura".
Botão: "Enviar para a Patricia"

**Destino do formulário:** o envio monta uma mensagem de WhatsApp já preenchida
com as três respostas e abre a conversa. Sem servidor, sem e-mail, e é assim que
corretor converte de verdade no Brasil. Enquanto o WhatsApp não estiver preenchido
em `js/dados.js`, o formulário dá lugar ao bloco de contato direto pelo Instagram,
e o site diz isso com todas as letras em vez de fingir que enviou.

### 7.9 Rodapé

Navegação, contato, CRECI, cidade.

Declaração obrigatória, decidida com o usuário: "As imagens de ambiente e o vídeo
do topo são ilustrativos e foram gerados por inteligência artificial. Não
representam empreendimentos específicos."

---

## 8. A camada vetorial

- **A prumada.** Uma linha vertical fina com marcas de andar, desenhada à mão em
  SVG, que se traça sozinha na lateral esquerda conforme o visitante rola. Ecoa a
  descida da torre. Uma marca por seção.
- **A régua que risca.** Cada rótulo de seção recebe uma linha que se estende da
  esquerda para a direita na entrada, o motivo do descarte.
- **Ambiente fixo.** Um gradiente de hora azul derivando muito devagar atrás de
  tudo, ciclo de 90 segundos, mais grão em nível de sussurro. Rolar parece
  atravessar um lugar.
- Tudo honra movimento reduzido: estados finais mostrados, motores parados.

---

## 9. A lista de engenharia

Tudo em `references/pipeline-scrub.md`:

- Busca do vídeo como Blob. Abaixo de 8 MB, a forma simples; acima, o Blob
  transmitido com anel de carregamento e watchdog de 20s.
- Pôster definido por JavaScript, dentro do caminho com portão.
- Interpolação rAF normalizada por dt, que descansa ao convergir e fora da tela.
- Seeks travados, com reset da flag no erro.
- Escritas de DOM só na mudança, `--k` travado em 0.008.
- Ritmo de faixas em vh, validado pelo teste de flick a 120, 240 e 360px.
- Legibilidade de quatro camadas: scrim base, scrim por faixa, token de sombra,
  chip para texto pequeno. Auditoria de pior quadro a 3.5:1.
- Cinco portões do hero estático, idênticos em CSS e JS, mantidos vivos com
  listeners de mudança.
- Completa sem o vídeo.
- Piso de qualidade inteiro: marcos semânticos, foco visível, alvos de 44px,
  contraste computado, `overflow-x: clip`, movimento reduzido nas duas direções.

**Desvio declarado:** a skill pede `index.html` mais `assets/`. Mantenho
`css/estilo.css`, `js/dados.js` e `js/script.js` separados. Continua sendo HTML,
CSS e JavaScript puros, sem build e sem npm, e deixa o usuário trocar textos e
contato em um arquivo pequeno em vez de caçar dentro de um HTML gigante.

---

## 9.1 O que mudou na execução, e por quê

Três desvios deste pacote, declarados em voz alta:

1. **As frentes viraram "Lançamentos, Casas, Coberturas, Investimento"**, em vez
   de ter "Pronto para morar". O usuário pediu casas e apartamentos de luxo, e uma
   tomada contínua sem corte só mostra um lugar. As casas foram para as imagens
   das seções, que é onde cabem.
2. **O hero ficou sendo a descida pela torre**, e não o interior de apartamento.
   Foram geradas seis imagens de interior em três rodadas; a melhor delas tinha
   uma composição ótima, mas o usuário preferiu manter a torre já aprovada e paga.
3. **O quadro final do vídeo virou o fundo da seção de contato**, em vez de ficar
   sem uso. A receita manda reaproveitar: é material de design grátis e
   perfeitamente na marca.

A paleta do pacote continua valendo, porque a filmagem aprovada é a torre na hora
azul, que é exatamente o mundo de onde ela foi amostrada.

## 10. O gate de texto

Cada linha voltada ao visitante acima embarca ao pé da letra. A página construída
precisa passar o gate da Fase 9 antes de alguém ver: zero travessões, zero palavras
de estoque, mais a varredura do corpo por sinais de IA.

Dispositivos deliberados desta marca, que ficam: o trio "Fora da sua região. Fora
do seu orçamento. Fora do seu prazo." e o staccato "Mais lançamento. Menos
comprador."

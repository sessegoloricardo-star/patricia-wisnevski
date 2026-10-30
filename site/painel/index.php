<?php
declare(strict_types=1);
require __DIR__ . '/nucleo.php';

exigir_https();
iniciar();

$avisos = [];
$sucesso = '';
$metodo  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ---------------------------------------------------------------
   Sair
---------------------------------------------------------------- */
if (($_GET['acao'] ?? '') === 'sair') {
    $_SESSION = [];
    session_destroy();
    header('Location: index.php');
    exit;
}

/* ---------------------------------------------------------------
   Primeiro acesso: definir a senha
---------------------------------------------------------------- */
if (!instalado()) {
    /* qualquer POST com os dois campos de senha conta como instalação,
       mesmo que o navegador não mande o nome do botão */
    if ($metodo === 'POST' && isset($_POST['senha'], $_POST['senha2'])) {
        exigir_token();
        $s1 = (string) ($_POST['senha'] ?? '');
        $s2 = (string) ($_POST['senha2'] ?? '');
        if (strlen($s1) < 8) {
            $avisos[] = 'A senha precisa ter pelo menos 8 caracteres.';
        } elseif ($s1 !== $s2) {
            $avisos[] = 'As duas senhas não são iguais.';
        } elseif (!gravar_senha($s1)) {
            $avisos[] = 'Não consegui gravar a senha. A pasta conteudo/ precisa ter permissão de escrita.';
        } else {
            $_SESSION['ok'] = true;
            session_regenerate_id(true);
            header('Location: index.php');
            exit;
        }
    }
    tela_instalar($avisos);
    exit;
}

/* ---------------------------------------------------------------
   Entrar
---------------------------------------------------------------- */
if (!logado()) {
    if ($metodo === 'POST' && isset($_POST['senha'])) {
        exigir_token();
        $resta = bloqueado_por();
        if ($resta > 0) {
            $avisos[] = 'Muitas tentativas. Espere ' . ceil($resta / 60) . ' minuto(s) e tente de novo.';
        } elseif (senha_confere((string) ($_POST['senha'] ?? ''))) {
            limpar_falhas();
            session_regenerate_id(true);
            $_SESSION['ok'] = true;
            header('Location: index.php');
            exit;
        } else {
            marcar_falha();
            $avisos[] = 'Senha incorreta.';
        }
    }
    tela_entrar($avisos);
    exit;
}

/* ---------------------------------------------------------------
   Gravar
---------------------------------------------------------------- */
$dados = carregar();

if ($metodo === 'POST' && (isset($_POST['salvar']) || isset($_POST['adicionar']))) {
    exigir_token();

    /* Ela digita do jeito que quiser. Aqui vira o formato que o
       wa.me entende, e se ainda assim não fizer sentido, ela é avisada
       em vez de o site cair de volta no Instagram em silêncio. */
    $zap = preg_replace('/\D/', '', (string) ($_POST['whatsapp'] ?? '')) ?? '';
    if (strlen($zap) === 10 || strlen($zap) === 11) {
        $zap = '55' . $zap;
    }
    if ($zap !== '' && !preg_match('/^55\d{10,11}$/', $zap)) {
        $avisos[] = 'O WhatsApp não parece certo. Use DDD mais o número, como 51999998888. '
                  . 'Enquanto ele não estiver válido, os botões continuam indo para o Instagram.';
        $zap = '';
    }
    $dados['contato']['whatsapp'] = $zap;
    $msg = limpo($_POST['mensagemPadrao'] ?? '', 300);
    $dados['contato']['mensagemPadrao'] = $msg !== ''
        ? $msg
        : 'Olá, Patricia! Vim pelo seu site e gostaria de conversar.';
    $dados['contato']['instagram'] = limpo($_POST['instagram'] ?? '', 200);
    $dados['contato']['email']     = limpo($_POST['email'] ?? '', 120);
    $dados['contato']['creci']     = limpo($_POST['creci'] ?? '', 60);
    $dados['contato']['cidade']    = limpo($_POST['cidade'] ?? '', 80);

    $dados['sobre']['alt']     = limpo($_POST['sobre_alt'] ?? '', 200);
    $dados['sobre']['citacao'] = limpo($_POST['sobre_citacao'] ?? '', 400);
    $dados['sobre']['texto']   = limpo($_POST['sobre_texto'] ?? '', 4000);

    /* foto da corretora */
    if (isset($_FILES['sobre_foto'])) {
        $r = salvar_imagem($_FILES['sobre_foto'], 'patricia', true);
        if ($r['erro']) {
            $avisos[] = 'Foto da corretora: ' . $r['erro'];
        } elseif ($r['caminho']) {
            apagar_foto($dados['sobre']['foto'] ?? null);
            $dados['sobre']['foto'] = $r['caminho'];
        }
    }

    /* imóveis */
    $entradas = is_array($_POST['op'] ?? null) ? $_POST['op'] : [];
    $novas = [];
    foreach ($entradas as $i => $linha) {
        if (!is_array($linha)) {
            continue;
        }
        if (!empty($linha['remover'])) {
            apagar_foto($linha['imagem'] ?? null);
            /* leva junto as fotos extras da galeria, senão ficam
               ocupando a pasta sem nada mais apontar para elas */
            foreach (($dados['opcoes'][$i]['fotos'] ?? []) as $f) {
                if (is_array($f) && isset($f['src'])) {
                    apagar_foto($f['src']);
                }
            }
            continue;
        }
        $item = [
            'tag'     => limpo($linha['tag'] ?? '', 40),
            'titulo'  => limpo($linha['titulo'] ?? '', 120),
            'texto'   => limpo($linha['texto'] ?? '', 600),
            'imagem'  => limpo($linha['imagem'] ?? '', 200),
            'alt'     => limpo($linha['alt'] ?? '', 200),
            'bairro'  => limpo($linha['bairro'] ?? '', 80),
            'preco'   => limpo($linha['preco'] ?? '', 40),
            'specs'   => [],
        ];
        foreach (explode(',', (string) ($linha['specs'] ?? '')) as $s) {
            $s = limpo($s, 40);
            if ($s !== '') {
                $item['specs'][] = $s;
            }
        }
        if (isset($_FILES['foto']['error'][$i])) {
            $arq = [
                'name'     => $_FILES['foto']['name'][$i],
                'type'     => $_FILES['foto']['type'][$i],
                'tmp_name' => $_FILES['foto']['tmp_name'][$i],
                'error'    => $_FILES['foto']['error'][$i],
                'size'     => $_FILES['foto']['size'][$i],
            ];
            $r = salvar_imagem($arq, $item['titulo'] !== '' ? $item['titulo'] : 'imovel');
            if ($r['erro']) {
                $avisos[] = 'Foto de "' . ($item['titulo'] ?: 'sem título') . '": ' . $r['erro'];
            } elseif ($r['caminho']) {
                apagar_foto($item['imagem']);
                $item['imagem'] = $r['caminho'];
            }
        }
        if ($item['imagem'] === '') {
            $item['imagem'] = 'assets/imoveis/im-01.jpg';
        }

        /* Este painel edita uma foto por imóvel. O painel do Netlify
           edita várias, e grava em 'fotos'. Salvar aqui não pode
           apagar o que lá foi feito: as fotos extras passam intactas,
           e só a capa acompanha o que foi editado nesta tela. */
        $antigo = $dados['opcoes'][$i] ?? null;
        if (is_array($antigo) && !empty($antigo['fotos']) && is_array($antigo['fotos'])) {
            $fotos = array_values($antigo['fotos']);
            $fotos[0] = ['src' => $item['imagem'], 'alt' => $item['alt']];
            $item['fotos'] = $fotos;
        }

        $ordem = (int) ($linha['ordem'] ?? $i);
        $novas[] = ['ordem' => $ordem, 'item' => $item];
    }
    usort($novas, static fn($a, $b) => $a['ordem'] <=> $b['ordem']);
    $dados['opcoes'] = array_map(static fn($n) => $n['item'], $novas);

    if (isset($_POST['adicionar'])) {
        $dados['opcoes'][] = [
            'tag' => 'Imóvel', 'titulo' => 'Novo imóvel',
            'texto' => 'Descreva o imóvel em uma frase.',
            'imagem' => 'assets/imoveis/im-01.jpg', 'alt' => '',
            'bairro' => '', 'preco' => '', 'specs' => [],
        ];
    }

    $erros = gravar($dados);
    if ($erros) {
        $avisos = array_merge($avisos, $erros);
    } elseif (!$avisos) {
        $sucesso = isset($_POST['adicionar'])
            ? 'Salvo, e um imóvel novo foi adicionado no fim da lista.'
            : 'Salvo. O site já está com as alterações.';
    } elseif (!$erros) {
        $sucesso = 'O texto foi salvo, mas veja os avisos acima sobre as fotos.';
    }
    $dados = carregar();
}

$semEscrita = pastas_graváveis();
tela_painel($dados, $avisos, $sucesso, $semEscrita);

/* =================================================================
   Telas
   ================================================================= */
function topo_html(string $titulo): void
{
    ?><!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($titulo) ?></title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23121922'/%3E%3Cpath d='M32 10 V54' stroke='%23F1F3F6' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500;100..125,600&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/estilo.css">
<link rel="stylesheet" href="painel.css">
</head>
<body class="pg">
<header class="pg__topo">
  <div>
    <strong>Painel da Patricia</strong>
    <span>Atualize o site sem mexer em código</span>
  </div>
  <nav class="pg__nav">
    <a href="../index.html" target="_blank" rel="noopener">Ver o site</a>
    <?php if (logado()): ?><a href="index.php?acao=sair">Sair</a><?php endif; ?>
  </nav>
</header>
<main class="pg__corpo"><?php
}

function rodape_html(): void
{
    ?></main></body></html><?php
}

function avisos_html(array $avisos, string $sucesso = ''): void
{
    foreach ($avisos as $a) {
        echo '<p class="pg__aviso pg__aviso--erro">' . h($a) . '</p>';
    }
    if ($sucesso !== '') {
        echo '<p class="pg__aviso pg__aviso--ok">' . h($sucesso) . '</p>';
    }
}

function tela_instalar(array $avisos): void
{
    topo_html('Primeiro acesso');
    ?>
    <div class="pg__caixa pg__caixa--estreita">
      <h1>Primeiro acesso</h1>
      <p class="pg__lede">Escolha a senha que você vai usar para entrar no painel.
      Ela fica guardada no servidor com criptografia e não dá para ler de volta,
      então anote num lugar seguro.</p>
      <?php avisos_html($avisos); ?>
      <form method="post">
    <datalist id="bairros-poa">
      <?php foreach (bairros_poa() as $b): ?><option value="<?= h($b) ?>"><?php endforeach; ?>
    </datalist>
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <div class="gestor__campo">
          <label for="s1">Senha, mínimo 8 caracteres</label>
          <input id="s1" name="senha" type="password" autocomplete="new-password" required minlength="8">
        </div>
        <div class="gestor__campo">
          <label for="s2">Repita a senha</label>
          <input id="s2" name="senha2" type="password" autocomplete="new-password" required minlength="8">
        </div>
        <button class="botao botao--principal botao--largo" name="instalar" value="1" type="submit">Definir senha e entrar</button>
      </form>
    </div>
    <?php
    rodape_html();
}

function tela_entrar(array $avisos): void
{
    topo_html('Entrar no painel');
    ?>
    <div class="pg__caixa pg__caixa--estreita">
      <h1>Entrar</h1>
      <?php avisos_html($avisos); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <div class="gestor__campo">
          <label for="s">Senha</label>
          <input id="s" name="senha" type="password" autocomplete="current-password" required autofocus>
        </div>
        <button class="botao botao--principal botao--largo" name="entrar" value="1" type="submit">Entrar</button>
      </form>
    </div>
    <?php
    rodape_html();
}

function tela_painel(array $d, array $avisos, string $sucesso, array $semEscrita): void
{
    topo_html('Painel da Patricia');
    ?>
    <form method="post" enctype="multipart/form-data" class="pg__form">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">

      <?php avisos_html($avisos, $sucesso); ?>

      <?php if ($semEscrita): ?>
        <p class="pg__aviso pg__aviso--erro">
          Estas pastas estão sem permissão de escrita, então o painel não consegue
          salvar: <?= h(implode(', ', $semEscrita)) ?>. No gerenciador de arquivos da
          hospedagem, coloque permissão 755 nelas.
        </p>
      <?php endif; ?>

      <section class="pg__caixa">
        <h2>Imóveis e opções</h2>
        <p class="pg__lede">Cada item vira um card no site. Preencha bairro, preço e
        características para o card virar um anúncio de imóvel. Para trocar a ordem,
        mude o número e salve.</p>

        <?php foreach ($d['opcoes'] as $i => $o): ?>
          <article class="pg__item">
            <div class="pg__item-foto">
              <img src="../<?= h($o['imagem']) ?>" alt="">
              <label class="pg__arquivo">
                <span>Trocar foto</span>
                <input type="file" name="foto[<?= $i ?>]" accept="image/jpeg,image/png,image/webp">
              </label>
              <input type="hidden" name="op[<?= $i ?>][imagem]" value="<?= h($o['imagem']) ?>">
            </div>

            <div class="pg__item-campos">
              <div class="pg__dupla">
                <div class="gestor__campo">
                  <label for="t<?= $i ?>">Etiqueta</label>
                  <input id="t<?= $i ?>" name="op[<?= $i ?>][tag]" value="<?= h($o['tag']) ?>" maxlength="40">
                </div>
                <div class="gestor__campo">
                  <label for="o<?= $i ?>">Ordem</label>
                  <input id="o<?= $i ?>" name="op[<?= $i ?>][ordem]" type="number" value="<?= $i ?>" min="0" max="999">
                </div>
              </div>
              <div class="gestor__campo">
                <label for="ti<?= $i ?>">Título</label>
                <input id="ti<?= $i ?>" name="op[<?= $i ?>][titulo]" value="<?= h($o['titulo']) ?>" maxlength="120">
              </div>
              <div class="gestor__campo">
                <label for="tx<?= $i ?>">Descrição</label>
                <textarea id="tx<?= $i ?>" name="op[<?= $i ?>][texto]" rows="2" maxlength="600"><?= h($o['texto']) ?></textarea>
              </div>
              <div class="gestor__campo">
                <label for="al<?= $i ?>">Descrição da foto, para leitor de tela</label>
                <input id="al<?= $i ?>" name="op[<?= $i ?>][alt]" value="<?= h($o['alt'] ?? '') ?>" maxlength="200">
              </div>
              <div class="pg__tripla">
                <div class="gestor__campo">
                  <label for="ba<?= $i ?>">Bairro</label>
                  <input id="ba<?= $i ?>" name="op[<?= $i ?>][bairro]" value="<?= h($o['bairro'] ?? '') ?>" maxlength="80" list="bairros-poa" placeholder="Comece a digitar">
                </div>
                <div class="gestor__campo">
                  <label for="pr<?= $i ?>">Preço</label>
                  <input id="pr<?= $i ?>" name="op[<?= $i ?>][preco]" value="<?= h($o['preco'] ?? '') ?>" maxlength="40">
                </div>
                <div class="gestor__campo">
                  <label for="sp<?= $i ?>">Características, separadas por vírgula</label>
                  <input id="sp<?= $i ?>" name="op[<?= $i ?>][specs]" value="<?= h(implode(', ', $o['specs'] ?? [])) ?>" maxlength="200">
                </div>
              </div>
              <label class="pg__remover">
                <input type="checkbox" name="op[<?= $i ?>][remover]" value="1">
                <span>Remover este item ao salvar</span>
              </label>
            </div>
          </article>
        <?php endforeach; ?>

        <?php if (!$d['opcoes']): ?>
          <p class="pg__lede">Nenhum imóvel cadastrado ainda.</p>
        <?php endif; ?>
      </section>

      <section class="pg__caixa">
        <h2>Sobre</h2>
        <div class="pg__item">
          <div class="pg__item-foto">
            <img src="../<?= h($d['sobre']['foto']) ?>" alt="">
            <label class="pg__arquivo">
              <span>Trocar minha foto</span>
              <input type="file" name="sobre_foto" accept="image/jpeg,image/png,image/webp">
            </label>
          </div>
          <div class="pg__item-campos">
            <div class="gestor__campo">
              <label for="sa">Descrição da foto, para leitor de tela</label>
              <input id="sa" name="sobre_alt" value="<?= h($d['sobre']['alt']) ?>" maxlength="200">
            </div>
            <div class="gestor__campo">
              <label for="sc">Frase de destaque</label>
              <textarea id="sc" name="sobre_citacao" rows="3" maxlength="400"><?= h($d['sobre']['citacao']) ?></textarea>
            </div>
            <div class="gestor__campo">
              <label for="st">Texto de apresentação</label>
              <textarea id="st" name="sobre_texto" rows="12" maxlength="4000"><?= h($d['sobre']['texto']) ?></textarea>
            </div>
          </div>
        </div>
      </section>

      <section class="pg__caixa">
        <h2>Contato</h2>
        <div class="pg__tripla">
          <div class="gestor__campo">
            <label for="w">WhatsApp, só números com 55 e DDD</label>
            <input id="w" name="whatsapp" value="<?= h($d['contato']['whatsapp']) ?>" inputmode="numeric" maxlength="15" placeholder="5551999998888">
          </div>
          <div class="gestor__campo">
            <label for="ig">Instagram</label>
            <input id="ig" name="instagram" value="<?= h($d['contato']['instagram']) ?>" maxlength="200">
          </div>
          <div class="gestor__campo">
            <label for="em">E-mail</label>
            <input id="em" name="email" type="email" value="<?= h($d['contato']['email']) ?>" maxlength="120">
          </div>
        </div>
        <div class="gestor__campo">
          <label for="mp">A mensagem que já vem escrita no WhatsApp</label>
          <input id="mp" name="mensagemPadrao" maxlength="300"
                 value="<?= h($d['contato']['mensagemPadrao'] ?? '') ?>"
                 placeholder="Olá, Patricia! Vim pelo seu site e gostaria de conversar.">
          <p class="gestor__dica">É o texto que aparece digitado quando alguém clica em Falar com a
            Patricia. Os cards de imóvel usam uma mensagem própria, com o nome do imóvel.</p>
        </div>

        <div class="pg__dupla">
          <div class="gestor__campo">
            <label for="cr">CRECI</label>
            <input id="cr" name="creci" value="<?= h($d['contato']['creci']) ?>" maxlength="60">
          </div>
          <div class="gestor__campo">
            <label for="ci">Cidade</label>
            <input id="ci" name="cidade" value="<?= h($d['contato']['cidade']) ?>" maxlength="80">
          </div>
        </div>
      </section>

      <div class="pg__barra">
        <button class="botao botao--principal" name="salvar" value="1" type="submit">Salvar e publicar</button>
        <button class="botao botao--vazado" name="adicionar" value="1" type="submit" formnovalidate>Salvar e adicionar imóvel</button>
        <span class="pg__nota">Salvar já publica. O site muda na hora.</span>
      </div>
    </form>
    <?php
    rodape_html();
}

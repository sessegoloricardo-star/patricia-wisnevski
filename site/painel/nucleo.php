<?php
/* =================================================================
   NÚCLEO DO PAINEL

   Usa só o PHP de fábrica: nada de banco, nada de biblioteca externa,
   nenhuma extensão além do json. Isso faz ele rodar em qualquer
   hospedagem compartilhada sem configuração.

   O conteúdo mora em ../conteudo/dados.json, e a cada gravação o
   painel reescreve ../js/dados.js. O site público continua estático:
   quem visita nunca toca no PHP.
   ================================================================= */

declare(strict_types=1);

const RAIZ      = __DIR__ . '/..';
const PASTA     = RAIZ . '/conteudo';
const ARQ_DADOS = PASTA . '/dados.json';
const ARQ_CONF  = PASTA . '/config.php';
const ARQ_TENT  = PASTA . '/tentativas.json';
const ARQ_SAIDA = RAIZ . '/js/dados.js';
const PASTA_IMG = RAIZ . '/assets/imoveis';
const PASTA_RAIZ_IMG = RAIZ . '/assets';

const MAX_BYTES   = 10 * 1024 * 1024;   /* 10 MB por foto */
const MAX_FALHAS  = 5;
const ESPERA_SEG  = 900;                 /* 15 minutos de castigo */

/* ---------------------------------------------------------------
   Sessão
---------------------------------------------------------------- */
function iniciar(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => dirname($_SERVER['SCRIPT_NAME'] ?? '/'),
        'httponly' => true,
        'samesite' => 'Strict',
        'secure'   => https_ativo(),
    ]);
    session_name('painelpw');
    session_start();
}

function https_ativo(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function local(): bool
{
    $h = $_SERVER['HTTP_HOST'] ?? '';
    return str_starts_with($h, 'localhost') || str_starts_with($h, '127.0.0.1');
}

/* Fora do localhost, o painel só funciona com cadeado. Senha viajando
   em texto puro não é uma opção. */
function exigir_https(): void
{
    if (!https_ativo() && !local()) {
        http_response_code(403);
        exit('<!doctype html><meta charset="utf-8"><p style="font:16px system-ui;padding:40px">'
            . 'Abra este endereço com <b>https://</b> na frente. Sem o cadeado a sua senha '
            . 'viajaria em texto puro, então o painel não abre.</p>');
    }
}

/* ---------------------------------------------------------------
   CSRF
---------------------------------------------------------------- */
function token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function token_ok(?string $t): bool
{
    return is_string($t) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}

function exigir_token(): void
{
    if (!token_ok($_POST['csrf'] ?? null)) {
        http_response_code(400);
        exit('Pedido inválido. Recarregue a página e tente de novo.');
    }
}

/* ---------------------------------------------------------------
   Senha
---------------------------------------------------------------- */
function instalado(): bool
{
    return is_file(ARQ_CONF);
}

function gravar_senha(string $senha): bool
{
    $conf = "<?php\n/* Senha do painel. Guardada com hash do PHP, não dá para ler de volta.\n"
          . "   Este arquivo é PHP de propósito: mesmo acessado direto, não mostra nada. */\n"
          . 'return ' . var_export(['hash' => password_hash($senha, PASSWORD_DEFAULT)], true) . ";\n";
    return escrever(ARQ_CONF, $conf);
}

function senha_confere(string $senha): bool
{
    if (!instalado()) {
        return false;
    }
    $conf = include ARQ_CONF;
    return is_array($conf) && isset($conf['hash']) && password_verify($senha, $conf['hash']);
}

function logado(): bool
{
    return !empty($_SESSION['ok']) && $_SESSION['ok'] === true;
}

function exigir_login(): void
{
    if (!logado()) {
        header('Location: index.php');
        exit;
    }
}

/* ---------------------------------------------------------------
   Freio para tentativa em massa
---------------------------------------------------------------- */
function falhas(): array
{
    $d = @json_decode((string) @file_get_contents(ARQ_TENT), true);
    return is_array($d) ? $d + ['n' => 0, 'em' => 0] : ['n' => 0, 'em' => 0];
}

function bloqueado_por(): int
{
    $f = falhas();
    if ($f['n'] < MAX_FALHAS) {
        return 0;
    }
    $resta = ESPERA_SEG - (time() - (int) $f['em']);
    return $resta > 0 ? $resta : 0;
}

function marcar_falha(): void
{
    $f = falhas();
    escrever(ARQ_TENT, (string) json_encode(['n' => (int) $f['n'] + 1, 'em' => time()]));
}

function limpar_falhas(): void
{
    @unlink(ARQ_TENT);
}

/* ---------------------------------------------------------------
   Conteúdo
---------------------------------------------------------------- */
/* A lista de bairros, a mesma que o site e o painel do Netlify usam.
   Fonte única em conteudo/bairros.json. */
function bairros_poa(): array
{
    $b = @json_decode((string) @file_get_contents(PASTA . '/bairros.json'), true);
    return is_array($b) ? $b : [];
}

function carregar(): array
{
    $d = @json_decode((string) @file_get_contents(ARQ_DADOS), true);
    if (!is_array($d)) {
        $d = [];
    }
    $d += ['contato' => [], 'sobre' => [], 'opcoes' => [], 'faq' => []];
    $d['contato'] += [
        'whatsapp' => '', 'mensagemPadrao' => 'Olá, Patricia! Vim pelo seu site e gostaria de conversar.',
        'instagram' => '', 'email' => '', 'cidade' => '', 'creci' => '',
    ];
    $d['sobre'] += ['foto' => 'assets/patricia-sobre.jpg', 'alt' => '', 'citacao' => '', 'texto' => ''];
    return $d;
}

function gravar(array $d): array
{
    $erros = [];
    if (!escrever(ARQ_DADOS, (string) json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))) {
        $erros[] = 'Não consegui gravar em conteudo/dados.json.';
    }
    if (!escrever(ARQ_SAIDA, gerar_js($d))) {
        $erros[] = 'Não consegui gravar em js/dados.js.';
    }
    return $erros;
}

/* O arquivo que o site público lê. Sem senha dentro: ela mora no
   servidor e nunca chega ao navegador do visitante. */
function gerar_js(array $d): string
{
    $op = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    $j = static fn($v): string => str_replace("\n", "\n  ", (string) json_encode($v, $op));
    return "/* =============================================================\n"
         . "   DADOS DO SITE, Patricia Wisnevski\n"
         . '   Gerado pelo painel em ' . date('d/m/Y H:i') . ".\n"
         . "   Não edite à mão: a próxima gravação do painel sobrescreve.\n"
         . "   ============================================================= */\n\n"
         . "const DADOS = {\n"
         . '  contato: ' . $j($d['contato']) . ",\n\n"
         . '  sobre: '   . $j($d['sobre'])   . ",\n\n"
         . '  opcoes: '  . $j(array_values($d['opcoes'])) . ",\n\n"
         . '  faq: '     . $j(array_values($d['faq']))    . "\n};\n";
}

/* Grava num temporário e troca, para uma queda no meio do caminho
   nunca deixar o arquivo pela metade. */
function escrever(string $destino, string $conteudo): bool
{
    $pasta = dirname($destino);
    if (!is_dir($pasta) && !@mkdir($pasta, 0775, true)) {
        return false;
    }
    $tmp = $pasta . '/.tmp-' . bin2hex(random_bytes(6));
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        @unlink($tmp);
        return false;
    }
    if (!@rename($tmp, $destino)) {
        @unlink($tmp);
        return false;
    }
    @chmod($destino, 0644);
    return true;
}

function pastas_graváveis(): array
{
    $faltando = [];
    foreach ([PASTA => 'conteudo/', RAIZ . '/js' => 'js/', PASTA_IMG => 'assets/imoveis/'] as $caminho => $rotulo) {
        if (!is_dir($caminho)) {
            @mkdir($caminho, 0775, true);
        }
        if (!is_dir($caminho) || !is_writable($caminho)) {
            $faltando[] = $rotulo;
        }
    }
    return $faltando;
}

/* ---------------------------------------------------------------
   Upload de imagem

   Três barreiras: extensão na lista, o arquivo precisa ser mesmo uma
   imagem segundo o próprio PHP, e o nome é inventado por nós. Nada do
   que o navegador manda entra no caminho do arquivo.
---------------------------------------------------------------- */
function salvar_imagem(array $arq, string $prefixo, bool $naRaiz = false): array
{
    if (!isset($arq['error']) || $arq['error'] === UPLOAD_ERR_NO_FILE) {
        return ['caminho' => null, 'erro' => null];
    }
    if ($arq['error'] !== UPLOAD_ERR_OK) {
        $msg = in_array($arq['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'A foto passou do tamanho que o servidor aceita.'
            : 'A foto não chegou inteira. Tente de novo.';
        return ['caminho' => null, 'erro' => $msg];
    }
    if (!is_uploaded_file($arq['tmp_name'])) {
        return ['caminho' => null, 'erro' => 'Envio inválido.'];
    }
    if ($arq['size'] > MAX_BYTES) {
        return ['caminho' => null, 'erro' => 'A foto tem mais de 10 MB. Reduza antes de enviar.'];
    }

    $info = @getimagesize($arq['tmp_name']);
    $tipos = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!$info || !isset($tipos[$info[2]])) {
        return ['caminho' => null, 'erro' => 'Esse arquivo não é uma imagem JPG, PNG ou WEBP.'];
    }
    $ext = $tipos[$info[2]];

    $base = preg_replace('/[^a-z0-9]+/', '-', strtolower(remover_acentos($prefixo)));
    $base = trim((string) $base, '-');
    if ($base === '') {
        $base = 'foto';
    }
    $nome = substr($base, 0, 40) . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

    $pasta = $naRaiz ? PASTA_RAIZ_IMG : PASTA_IMG;
    if (!is_dir($pasta) && !@mkdir($pasta, 0775, true)) {
        return ['caminho' => null, 'erro' => 'Não consegui criar a pasta das fotos.'];
    }
    if (!@move_uploaded_file($arq['tmp_name'], $pasta . '/' . $nome)) {
        return ['caminho' => null, 'erro' => 'Não consegui gravar a foto. A pasta pode estar sem permissão.'];
    }
    @chmod($pasta . '/' . $nome, 0644);

    return ['caminho' => ($naRaiz ? 'assets/' : 'assets/imoveis/') . $nome, 'erro' => null];
}

function remover_acentos(string $s): string
{
    $de  = ['á','à','â','ã','ä','é','è','ê','ë','í','ì','î','ï','ó','ò','ô','õ','ö','ú','ù','û','ü','ç','ñ'];
    $para = ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','c','n'];
    return str_replace($de, $para, mb_strtolower_simples($s));
}

/* Sem depender da extensão mbstring: só o que precisamos. */
function mb_strtolower_simples(string $s): string
{
    return strtr(strtolower($s), [
        'Á'=>'á','À'=>'à','Â'=>'â','Ã'=>'ã','Ä'=>'ä','É'=>'é','È'=>'è','Ê'=>'ê','Ë'=>'ë',
        'Í'=>'í','Ì'=>'ì','Î'=>'î','Ï'=>'ï','Ó'=>'ó','Ò'=>'ò','Ô'=>'ô','Õ'=>'õ','Ö'=>'ö',
        'Ú'=>'ú','Ù'=>'ù','Û'=>'û','Ü'=>'ü','Ç'=>'ç','Ñ'=>'ñ',
    ]);
}

/* Apaga uma foto antiga, só se ela estiver mesmo dentro de assets/. */
function apagar_foto(?string $relativo): void
{
    if (!$relativo || !str_starts_with($relativo, 'assets/')) {
        return;
    }
    if (str_contains($relativo, '..')) {
        return;
    }
    $alvo = realpath(RAIZ . '/' . $relativo);
    $base = realpath(PASTA_RAIZ_IMG);
    if ($alvo && $base && str_starts_with($alvo, $base) && is_file($alvo)) {
        /* nunca apaga as imagens que vieram com o site */
        if (!preg_match('/\b(im-0\d|patricia-(hero|sobre)|hero-(poster|ending))\./', basename($alvo))) {
            @unlink($alvo);
        }
    }
}

/* ---------------------------------------------------------------
   Texto
---------------------------------------------------------------- */
function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function limpo(?string $s, int $max = 2000): string
{
    $s = (string) $s;
    $s = str_replace(["\r\n", "\r"], "\n", $s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return trim(substr($s, 0, $max));
}

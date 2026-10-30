/* =================================================================
   Patricia Wisnevski, comportamento do site
   Depende de js/dados.js (constante DADOS).
   ================================================================= */
(function () {
  "use strict";

  var D = window.DADOS || DADOS;
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) {
    var t = clamp((p - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* ---------------------------------------------------------------
     Ícones
  ----------------------------------------------------------------- */
  var ICONES = {
    whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413",
    instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881",
    email: "M2 4h20v16H2V4m2 2v.4l8 5.01 8-5.01V6H4m16 2.76-8 5.01-8-5.01V18h16V8.76",
    local: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5",
    registro: "M6 2h9l5 5v15H6V2m8 1.5V8h4.5L14 3.5M8.5 12h9v1.6h-9V12m0 3.4h6.4V17H8.5v-1.6"
  };
  function svg(n) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONES[n] + '"/></svg>';
  }

  /* ---------------------------------------------------------------
     Canal de contato
  ----------------------------------------------------------------- */
  var zap, temZap;
  function lerContato() {
    zap = (D.contato.whatsapp || "").replace(/\D/g, "");
    temZap = zap.length >= 12;
  }
  function linkContato(msg) {
    if (!temZap) return D.contato.instagram;
    var t = msg || D.contato.mensagemPadrao || "";
    return "https://wa.me/" + zap + (t ? "?text=" + encodeURIComponent(t) : "");
  }
  function fone(n) {
    var m = n.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? "(" + m[1] + ") " + m[2] + "-" + m[3] : n;
  }

  /* ---------------------------------------------------------------
     Desenho do conteúdo. Pode rodar de novo depois de uma edição.
  ----------------------------------------------------------------- */
  function desenhar() {
    lerContato();

    document.querySelectorAll("[data-cta]").forEach(function (el) {
      el.setAttribute("href", linkContato());
    });

    /* sobre */
    var f = document.getElementById("sobre-foto");
    if (f) { f.src = D.sobre.foto; f.alt = D.sobre.alt || ""; }
    var c = document.getElementById("sobre-citacao");
    if (c) c.textContent = D.sobre.citacao || "";
    var t = document.getElementById("sobre-texto");
    if (t) {
      t.innerHTML = String(D.sobre.texto || "")
        .split(/\n{2,}/)
        .map(function (p) { return p.trim(); })
        .filter(Boolean)
        .map(function (p) { return "<p>" + esc(p) + "</p>"; })
        .join("");
    }

    /* opções */
    var alvo = document.getElementById("cards");
    if (alvo) {
      alvo.innerHTML = D.opcoes.map(function (o) {
        var specs = (o.specs && o.specs.length)
          ? '<ul class="card__specs">' + o.specs.map(function (s) {
              return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>"
          : "";
        return '<article class="card revelar">' +
            '<figure class="card__foto">' +
              (o.tag ? '<span class="card__tag">' + esc(o.tag) + "</span>" : "") +
              '<img src="' + esc(o.imagem) + '" alt="' + esc(o.alt || o.titulo) +
              '" loading="lazy" width="1600" height="1200">' +
            "</figure>" +
            '<div class="card__corpo">' +
              (o.bairro ? '<p class="card__bairro">' + esc(o.bairro) + "</p>" : "") +
              "<h3>" + esc(o.titulo) + "</h3>" +
              (o.texto ? "<p>" + esc(o.texto) + "</p>" : "") +
              specs +
              (o.preco ? '<p class="card__preco">' + esc(o.preco) + "</p>" : "") +
              '<a class="card__acao" href="' +
                linkContato("Olá, Patricia! Vi “" + o.titulo + "” no seu site e quero saber mais.") +
                '" target="_blank" rel="noopener">' +
                "<span>Quero saber mais</span><span>&rarr;</span></a>" +
            "</div></article>";
      }).join("");
    }

    /* dúvidas */
    var faq = document.getElementById("faq");
    if (faq) {
      faq.innerHTML = D.faq.map(function (q, i) {
        return '<div class="faq__item">' +
          '<button class="faq__botao" type="button" aria-expanded="false" aria-controls="faq-r' + i + '" id="faq-p' + i + '">' +
            "<span>" + esc(q.p) + '</span><span class="faq__sinal" aria-hidden="true"></span></button>' +
          '<div class="faq__resposta" id="faq-r' + i + '" role="region" aria-labelledby="faq-p' + i + '">' +
            "<p>" + esc(q.r) + "</p></div></div>";
      }).join("");
    }

    /* meios de contato, dentro da seção de dúvidas */
    var meios = document.getElementById("meios");
    if (meios) meios.innerHTML = listaDeContato();

    /* rodapé */
    var rod = document.getElementById("lista-contato");
    if (rod) rod.innerHTML = listaDeContato();

    montarBusca();
    ajustarFormulario();
  }

  /* ---------------------------------------------------------------
     A busca de imóveis

     Filtra os cards que já estão na página. Um item sem preço ou sem
     bairro nunca é escondido por esses campos: falta de informação não
     é motivo para sumir com o imóvel.
  ----------------------------------------------------------------- */
  var PRECO_MIN = 200000, PRECO_MAX = 5000000;

  function precoNumero(v) {
    var d = String(v == null ? "" : v).replace(/\D/g, "");
    return d ? parseInt(d, 10) : null;
  }
  function moeda(n) {
    if (n >= 1000000) {
      var mi = n / 1000000;
      return "R$ " + (mi % 1 ? mi.toFixed(1).replace(".", ",") : String(mi)) + " mi";
    }
    return "R$ " + Math.round(n / 1000) + " mil";
  }
  function teto(v) {
    return v >= 100 ? Infinity : Math.round(PRECO_MIN + (PRECO_MAX - PRECO_MIN) * (v / 100));
  }

  var buscaArmada = false;
  function montarBusca() {
    var form = document.getElementById("busca");
    if (!form) return;

    var selTipo = document.getElementById("b-tipo");
    var selBairro = document.getElementById("b-bairro");
    var tipos = [], bairros = [];
    D.opcoes.forEach(function (o) {
      if (o.tag && tipos.indexOf(o.tag) < 0) tipos.push(o.tag);
      if (o.bairro && bairros.indexOf(o.bairro) < 0) bairros.push(o.bairro);
    });
    tipos.sort(); bairros.sort();

    var antesT = selTipo.value, antesB = selBairro.value;
    selTipo.innerHTML = '<option value="">Todos os tipos</option>' +
      tipos.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("");
    selBairro.innerHTML = '<option value="">Todos os bairros</option>' +
      bairros.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("");
    selTipo.value = antesT; selBairro.value = antesB;

    /* sem nenhum bairro cadastrado, o campo não tem o que fazer */
    selBairro.closest(".busca__campo").hidden = bairros.length === 0;
    form.querySelector(".busca__campos").classList.toggle("sem-bairro", bairros.length === 0);

    if (!buscaArmada) {
      buscaArmada = true;
      form.addEventListener("input", aplicarBusca);
      form.addEventListener("change", aplicarBusca);
      form.addEventListener("submit", function (e) { e.preventDefault(); });
    }
    aplicarBusca();
  }

  function aplicarBusca() {
    var cards = document.getElementById("cards");
    if (!cards) return;
    var tipo = (document.getElementById("b-tipo") || {}).value || "";
    var bairro = (document.getElementById("b-bairro") || {}).value || "";
    var faixa = parseInt((document.getElementById("b-preco") || {}).value || "100", 10);
    var limite = teto(faixa);

    var barra = document.getElementById("b-preco");
    if (barra) barra.style.setProperty("--preenchido", faixa + "%");

    var rotulo = document.getElementById("b-preco-valor");
    if (rotulo) {
      rotulo.textContent = limite === Infinity
        ? "R$ 5 mi ou mais, sem limite"
        : "Até " + moeda(limite);
    }

    var itens = cards.querySelectorAll(".card");
    var vistos = 0;
    D.opcoes.forEach(function (o, i) {
      var el = itens[i];
      if (!el) return;
      var p = precoNumero(o.preco);
      var ok = (!tipo || o.tag === tipo) &&
               (!bairro || o.bairro === bairro) &&
               (p === null || p <= limite);
      el.hidden = !ok;
      if (ok) { el.classList.add("in"); vistos++; }
    });

    var conta = document.getElementById("busca-conta");
    if (conta) {
      conta.textContent = vistos === 0 ? "Nenhum resultado"
        : vistos === 1 ? "1 imóvel" : vistos + " imóveis";
    }
    var vazio = document.getElementById("cards-vazio");
    if (vazio) vazio.hidden = vistos !== 0;
  }

  function listaDeContato() {
    var itens = [];
    if (temZap) {
      itens.push('<li><a href="' + linkContato() + '" target="_blank" rel="noopener">' +
        svg("whatsapp") + "<span>" + fone(zap) + "</span></a></li>");
    }
    itens.push('<li><a href="' + esc(D.contato.instagram) + '" target="_blank" rel="noopener">' +
      svg("instagram") + "<span>" + esc(D.contato.instagram.replace(/.*instagram\.com\//, "@").replace(/\/$/, "")) + "</span></a></li>");
    if (D.contato.email) {
      itens.push('<li><a href="mailto:' + esc(D.contato.email) + '">' + svg("email") +
        "<span>" + esc(D.contato.email) + "</span></a></li>");
    }
    itens.push('<li><span class="estatico">' + svg("local") + "<span>" + esc(D.contato.cidade) + "</span></span></li>");
    itens.push('<li><span class="estatico">' + svg("registro") + "<span>" + esc(D.contato.creci) + "</span></span></li>");
    return itens.join("");
  }

  /* ---------------------------------------------------------------
     Dúvidas: acordeão
  ----------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".faq__botao");
    if (!b) return;
    var faq = document.getElementById("faq");
    var item = b.parentElement;
    var painel = item.querySelector(".faq__resposta");
    var abrindo = !item.classList.contains("aberto");
    faq.querySelectorAll(".faq__item.aberto").forEach(function (o) {
      o.classList.remove("aberto");
      o.querySelector(".faq__botao").setAttribute("aria-expanded", "false");
      o.querySelector(".faq__resposta").style.maxHeight = null;
    });
    if (abrindo) {
      item.classList.add("aberto");
      b.setAttribute("aria-expanded", "true");
      painel.style.maxHeight = painel.scrollHeight + "px";
    }
  });
  window.addEventListener("resize", function () {
    var a = document.querySelector(".faq__item.aberto .faq__resposta");
    if (a) a.style.maxHeight = a.scrollHeight + "px";
  });

  /* ---------------------------------------------------------------
     Cabeçalho, menu e navegação ativa
  ----------------------------------------------------------------- */
  var topo = document.getElementById("topo");
  var nav = document.getElementById("nav");
  var botaoMenu = document.getElementById("hamburguer");

  botaoMenu.addEventListener("click", function () {
    var aberto = nav.classList.toggle("aberto");
    botaoMenu.setAttribute("aria-expanded", String(aberto));
    botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A" && nav.classList.contains("aberto")) {
      nav.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
      botaoMenu.setAttribute("aria-label", "Abrir menu");
    }
  });

  var linksNav = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    linksNav[a.getAttribute("href").slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var vigiaNav = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var l = linksNav[e.target.id];
        if (!l || !e.isIntersecting) return;
        Object.keys(linksNav).forEach(function (k) { linksNav[k].classList.remove("ativo"); });
        l.classList.add("ativo");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach(function (s) { vigiaNav.observe(s); });
  }

  /* ---------------------------------------------------------------
     Revelar ao entrar na tela
  ----------------------------------------------------------------- */
  var revelador = null;
  function armarRevelar() {
    if (!("IntersectionObserver" in window)) return;
    if (!revelador) {
      revelador = new IntersectionObserver(function (ents, obs) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          obs.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    }
    document.querySelectorAll(
      ".rotulo, .titulo, .lede, .sobre__foto, .sobre__texto, .faq, .contato-bloco"
    ).forEach(function (el) { el.classList.add("revelar"); });
    document.querySelectorAll(".revelar:not(.in)").forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      revelador.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     A prumada
  ----------------------------------------------------------------- */
  var fio = document.getElementById("prumada-fio");
  var principal = document.getElementById("main");
  var ultimoPru = -1;
  function desenharPrumada() {
    if (!fio || !principal) return;
    var r = principal.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total <= 0 ? 1 : clamp(-r.top / total, 0, 1);
    var off = Math.round(1000 * (1 - p));
    if (off === ultimoPru) return;
    ultimoPru = off;
    fio.style.setProperty("--pru", off);
  }

  /* ---------------------------------------------------------------
     O formulário vira uma mensagem de WhatsApp já escrita
  ----------------------------------------------------------------- */
  var form = document.getElementById("form");
  function ajustarFormulario() {
    var direto = document.getElementById("direto");
    var nota = document.getElementById("form-nota");
    var lede = document.getElementById("contato-lede");
    if (!form) return;
    if (!temZap) {
      form.hidden = true;
      if (direto) direto.hidden = false;
      if (nota) nota.textContent = "";
      if (lede) lede.textContent = "Me conte o que você procura e eu respondo com uma lista curta.";
    } else {
      form.hidden = false;
      if (direto) direto.hidden = true;
      if (nota) nota.textContent = "O botão abre o WhatsApp com a sua mensagem já escrita.";
      if (lede) lede.textContent = "Três campos. Eu respondo com uma lista curta.";
    }
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var erro = document.getElementById("form-erro");
      var nome = form.nome.value.trim();
      var tel = form.fone.value.trim();
      var busca = form.busca.value.trim();
      if (!nome || !tel || !busca) {
        erro.textContent = "Faltou preencher algum campo. Os três ajudam a montar a lista.";
        erro.hidden = false;
        (!nome ? form.nome : !tel ? form.fone : form.busca).focus();
        return;
      }
      erro.hidden = true;
      window.open(linkContato("Olá, Patricia! Meu nome é " + nome + ". Meu WhatsApp é " +
        tel + ". O que eu procuro: " + busca), "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------------------
     O HERO DE SCRUB
  ----------------------------------------------------------------- */
  var GATES = [
    "(max-width: 720px)",
    "(orientation: portrait) and (max-width: 1024px)",
    "(orientation: portrait) and (pointer: coarse)",
    "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
    "(prefers-reduced-motion: reduce)"
  ];
  var MQLS = GATES.map(function (q) { return matchMedia(q); });

  var VIDEO_URL = "assets/hero-scrub.mp4";
  var VIDEO_BYTES = 5042973;   /* trocar junto com o vídeo */
  var POSTER_URL = "assets/hero-poster.jpg";

  var hero = document.getElementById("inicio");
  var palco = document.querySelector(".palco");
  var video = document.getElementById("hero-video");
  var poster = document.getElementById("poster");
  var anel = document.getElementById("anel");
  var faixas = document.getElementById("faixas");
  var bands = Array.prototype.slice.call(document.querySelectorAll(".band"));

  function rng(seed) {
    var s = seed >>> 0;
    return function () { return (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  }
  function dividir(el, modo, semente, spread) {
    var frase = el.textContent;
    var r = rng(semente);
    var palavras = frase.split(/(\s+)/).filter(function (t) { return t.length; });
    var visivel = "", iChar = 0;
    var totalChars = frase.replace(/\s/g, "").length;
    palavras.forEach(function (p, wi) {
      if (/^\s+$/.test(p)) { visivel += p; return; }
      var estilo = modo === "palavra"
        ? "--th:" + (wi / Math.max(1, palavras.length) * 0.42).toFixed(3) : "";
      var inner = p;
      if (modo === "char") {
        inner = "";
        for (var i = 0; i < p.length; i++) {
          var th = spread ? (iChar / Math.max(1, totalChars)) * spread + r() * 0.06 : r() * 0.5;
          inner += '<span class="c" style="--th:' + th.toFixed(3) +
                   ";--jx:" + ((r() * 2 - 1) * (spread ? 26 : 16)).toFixed(1) +
                   "px;--jy:" + ((r() * 2 - 1) * 20).toFixed(1) +
                   "px;--jr:" + ((r() * 2 - 1) * 9).toFixed(1) + 'deg">' + p[i] + "</span>";
          iChar++;
        }
      }
      visivel += '<span class="w" style="' + estilo + '">' + inner + "</span>";
    });
    el.innerHTML = '<span class="vhidden">' + esc(frase) + "</span>" +
                   '<span aria-hidden="true">' + visivel + "</span>";
  }

  bands.forEach(function (b, bi) {
    b.querySelectorAll("[data-split]").forEach(function (el, ei) {
      var spread = parseFloat(b.getAttribute("data-spread") || "0") || 0;
      dividir(el, el.getAttribute("data-split"), 7919 + bi * 131 + ei * 17, spread);
    });
    var enf = parseInt(b.getAttribute("data-enfase") || "-1", 10);
    if (enf >= 0) {
      var ws = b.querySelectorAll('[data-split="palavra"] .w');
      if (ws[enf]) ws[enf].classList.add("em");
    }
    b.cacheOp = -1; b.cacheK = -1;
    b.a = parseFloat(b.getAttribute("data-a"));
    b.b = parseFloat(b.getAttribute("data-b"));
    b.rampa = parseFloat(b.getAttribute("data-ramp") || "0") || 0;
  });

  function heroProgress() {
    if (!hero) return 0;
    var r = hero.getBoundingClientRect();
    var faixa = hero.offsetHeight - window.innerHeight;
    if (faixa <= 0) return 0;
    return clamp(-r.top / faixa, 0, 1);
  }

  var cargaK = 0, cargaInicio = 0;
  function atualizarFaixas(p) {
    if (cargaInicio) cargaK = clamp((performance.now() - cargaInicio) / 900, 0, 1);
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var f = Math.min(0.02, (b.b - b.a) / 3);
      var entra = i === 0 ? 1 : smoothstep(p, b.a, b.a + f);
      var sai = i === bands.length - 1 ? 1 : (1 - smoothstep(p, b.b - f, b.b));
      var op = entra * sai;
      var rampa = b.rampa || Math.min(0.025, (b.b - b.a) * 0.35);
      var k = clamp((p - b.a) / rampa, 0, 1);
      if (i === 0) k = Math.max(k, cargaK);
      if (Math.abs(op - b.cacheOp) > 0.004) { b.cacheOp = op; b.style.opacity = op.toFixed(3); }
      if (Math.abs(k - b.cacheK) > 0.008) {
        b.cacheK = k;
        b.style.setProperty("--k", k.toFixed(3));
        if (b.classList.contains("band--final")) {
          b.style.setProperty("--ks", clamp((k - 0.5) * 2.4, 0, 1).toFixed(3));
          b.style.setProperty("--kb", clamp((k - 0.68) * 3.2, 0, 1).toFixed(3));
        }
      }
    }
  }

  var seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    try { video.currentTime = t; } catch (e) { seekBusy = false; }
  }
  video.addEventListener("seeked", function () {
    seekBusy = false;
    if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener("error", function () {
    seekBusy = false; pendingTime = null; falharVideo();
  });

  var alvoP = 0, exibidoP = 0, rafId = null, ultimoTick = 0, heroNaTela = true;
  function tick(now) {
    var dt = Math.min(100, now - (ultimoTick || now));
    ultimoTick = now;
    exibidoP += (alvoP - exibidoP) * (1 - Math.pow(1 - 0.16, dt / 16.667));
    if (Math.abs(alvoP - exibidoP) < 0.0005 && cargaK >= 1) {
      exibidoP = alvoP; rafId = null; ultimoTick = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
    if (video.duration) requestSeek(exibidoP * video.duration);
    atualizarFaixas(exibidoP);
  }

  var ultimaSaida = -1;
  function atualizarSaida() {
    if (!palco || !faixas) return;
    var topo0 = palco.getBoundingClientRect().top;
    var s = clamp(1 + topo0 / (window.innerHeight * 0.4), 0, 1);
    if (Math.abs(s - ultimaSaida) < 0.01) return;
    ultimaSaida = s;
    faixas.style.opacity = s.toFixed(3);
  }

  function aoRolarHero() {
    alvoP = heroProgress();
    atualizarSaida();
    if (rafId === null && heroNaTela) rafId = requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(function (e) {
      heroNaTela = e[0].isIntersecting;
      if (heroNaTela && scrubOn && rafId === null) rafId = requestAnimationFrame(tick);
    }, { threshold: 0 }).observe(hero);
  }

  var heroIniciado = false;
  function iniciarHeroUmaVez() {
    if (heroIniciado) return;
    heroIniciado = true;
    poster.style.backgroundImage = "url('" + POSTER_URL + "')";
    var img = new Image(), comecou = false;
    function comecar() {
      if (comecou) return;
      comecou = true;
      poster.classList.add("visivel");
      carregarBlob().catch(falharVideo);
    }
    img.onload = comecar; img.onerror = comecar; img.src = POSTER_URL;
    setTimeout(comecar, 4000);
    cargaInicio = performance.now();
  }

  function carregarBlob() {
    var ctrl = new AbortController();
    var cao = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(VIDEO_URL, { signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error("http " + res.status);
      var total = Number(res.headers.get("Content-Length")) || VIDEO_BYTES;
      var reader = res.body.getReader();
      var pedacos = [], got = 0, ultimoAnel = 0;
      return (function ler() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(cao);
          cao = setTimeout(function () { ctrl.abort(); }, 20000);
          pedacos.push(r.value);
          got += r.value.length;
          var frac = Math.min(1, got / total), agora = performance.now();
          if (agora - ultimoAnel > 100 || frac === 1) {
            ultimoAnel = agora;
            anel.style.setProperty("--ld", Math.round(126 * (1 - frac)));
          }
          return ler();
        });
      })().then(function () {
        clearTimeout(cao);
        anel.style.setProperty("--ld", 0);
        video.src = URL.createObjectURL(new Blob(pedacos, { type: "video/mp4" }));
        video.load();
        video.addEventListener("canplay", function () {
          requestSeek(heroProgress() * video.duration);
          palco.classList.add("video-ready");
          aoRolarHero();
        }, { once: true });
      });
    });
  }

  function falharVideo() {
    if (palco.classList.contains("video-failed")) return;
    palco.classList.add("video-failed");
    if (anel && anel.parentNode) {
      var seta = document.createElement("p");
      seta.className = "seta-scroll";
      seta.textContent = "role";
      anel.replaceWith(seta);
    }
  }

  var scrubOn = false;
  function ligarScrub() {
    if (scrubOn) return;
    scrubOn = true;
    iniciarHeroUmaVez();
    window.addEventListener("scroll", aoRolarHero, { passive: true });
    bands.forEach(function (b) { b.cacheOp = -1; b.cacheK = -1; });
    atualizarFaixas(heroProgress());
    aoRolarHero();
  }
  function desligarScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener("scroll", aoRolarHero);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function aplicarModoHero() {
    if (MQLS.some(function (m) { return m.matches; })) desligarScrub();
    else ligarScrub();
  }
  MQLS.forEach(function (m) { m.addEventListener("change", aplicarModoHero); });

  function fixarEstadosFinais() {
    desligarScrub();
    document.querySelectorAll(".revelar").forEach(function (el) {
      el.classList.add("in"); el.style.transitionDelay = "0s";
    });
    if (fio) fio.style.setProperty("--pru", 0);
  }
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (e) {
    if (e.matches) fixarEstadosFinais();
    else { aplicarModoHero(); armarRevelar(); }
  });

  /* ---------------------------------------------------------------
     Scroll geral, pausa fora de foco, ano
  ----------------------------------------------------------------- */
  var ultimoClaro = null;
  function aoRolar() {
    var claro = hero ? hero.getBoundingClientRect().bottom <= 84 : true;
    if (claro !== ultimoClaro) { ultimoClaro = claro; topo.classList.toggle("claro", claro); }
    desenharPrumada();
  }
  window.addEventListener("scroll", aoRolar, { passive: true });

  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("pausado", document.hidden);
  });

  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     Arranque, e a porta para a área do gestor redesenhar
  ----------------------------------------------------------------- */
  desenhar();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    armarRevelar(); fixarEstadosFinais();
  } else {
    armarRevelar(); aplicarModoHero();
  }
  aoRolar();

  window.SITE = {
    desenhar: function () { desenhar(); armarRevelar(); },
    trocarDados: function (novo) { D = novo; this.desenhar(); }
  };

  /* -----------------------------------------------------------------
     A camada ao vivo.

     A página já desenhou com js/dados.js, que veio dentro do pacote.
     Se houver um painel no ar, ele pode ter conteúdo mais novo.
     Então perguntamos, e só redesenhamos se de fato mudou.

     Isto é um extra, nunca uma dependência: sem resposta, com
     resposta estranha ou sem rede, a página fica como está.
  ----------------------------------------------------------------- */
  (function () {
    if (!window.fetch || location.protocol === "file:") return;

    var controle = new AbortController();
    var desistir = setTimeout(function () { controle.abort(); }, 6000);

    fetch("/api/dados", { signal: controle.signal, credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (novo) {
        if (!novo || !novo.contato || !Array.isArray(novo.opcoes)) return;
        if (JSON.stringify(novo) === JSON.stringify(D)) return;
        window.SITE.trocarDados(novo);
      })
      .catch(function () { /* o site já está desenhado. Nada a fazer. */ })
      .finally(function () { clearTimeout(desistir); });
  }());

})();

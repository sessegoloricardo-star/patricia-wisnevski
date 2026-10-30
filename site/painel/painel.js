/* =================================================================
   Envio de fotos no painel.

   O formulário não leva mais as fotos. O Netlify corta qualquer
   requisição acima de 6 MB, e foto de celular tem de 3 a 8 MB:
   escolher duas já estourava, e a requisição morria antes de
   chegar no servidor, sem erro nenhum na tela.

   Agora cada foto é reduzida aqui mesmo, no navegador, e sobe
   sozinha. O formulário só carrega o endereço de cada uma.

   Sem JavaScript, o campo continua sendo um input comum e o
   servidor continua aceitando. Funciona, só que com o limite de
   antes, então o aviso na tela diz isso.
   ================================================================= */
(function () {
  "use strict";

  var LADO = 1920;        /* o maior lado, em pixels */
  var QUALIDADE = 0.82;
  var MAX_FOTOS = 12;

  var form = document.querySelector("form[enctype]");
  if (!form || !window.fetch || !window.FormData) return;

  var csrf = form.querySelector("[name=csrf]");
  if (!csrf) return;

  /* ---------------------------------------------------------------
     Reduz a foto antes de subir
  ---------------------------------------------------------------- */
  function reduzir(arquivo) {
    return new Promise(function (ok, falhou) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var escala = Math.min(1, LADO / Math.max(img.width, img.height));
        var l = Math.round(img.width * escala);
        var a = Math.round(img.height * escala);
        var tela = document.createElement("canvas");
        tela.width = l; tela.height = a;
        var ctx = tela.getContext("2d");
        ctx.drawImage(img, 0, 0, l, a);
        tela.toBlob(function (b) {
          if (b) ok(b); else falhou(new Error("não consegui processar a imagem"));
        }, "image/jpeg", QUALIDADE);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        falhou(new Error("esse arquivo não abriu como imagem"));
      };
      img.src = url;
    });
  }

  /* ---------------------------------------------------------------
     Um cartão de foto, igual ao que o servidor desenha
  ---------------------------------------------------------------- */
  function cartao(i, j, src, ordem) {
    var li = document.createElement("li");
    li.className = "pg__foto";
    li.innerHTML =
      '<img src="' + src + '" alt="" loading="lazy">' +
      '<input type="hidden" name="op[' + i + '][fotos][' + j + '][src]" value="' + src + '">' +
      '<label class="pg__foto-ordem"><span>Ordem</span>' +
        '<input name="op[' + i + '][fotos][' + j + '][ordem]" type="number" min="1" max="' + MAX_FOTOS + '" value="' + ordem + '"></label>' +
      '<label class="pg__foto-alt"><span>Descrição</span>' +
        '<input name="op[' + i + '][fotos][' + j + '][alt]" value="" maxlength="200" placeholder="O que aparece na foto"></label>' +
      '<label class="pg__foto-fora">' +
        '<input type="checkbox" name="op[' + i + '][fotos][' + j + '][remover]" value="1"> Remover</label>';
    return li;
  }

  /* ---------------------------------------------------------------
     Liga cada campo de envio
  ---------------------------------------------------------------- */
  form.querySelectorAll('input[type="file"][name^="novas["]').forEach(function (campo) {
    var m = campo.getAttribute("name").match(/novas\[(\d+)\]/);
    if (!m) return;
    var i = Number(m[1]);
    var galeria = campo.closest(".pg__galeria");
    var lista = galeria.querySelector(".pg__fotos");
    var vazio = galeria.querySelector(".pg__sem-foto");

    var recado = document.createElement("p");
    recado.className = "pg__envio";
    recado.setAttribute("role", "status");
    campo.closest(".pg__arquivo").insertAdjacentElement("afterend", recado);

    campo.addEventListener("change", async function () {
      var arquivos = Array.prototype.slice.call(campo.files || []);
      if (!arquivos.length) return;

      /* tira os arquivos do formulário: quem sobe agora é o fetch */
      campo.value = "";

      if (!lista) {
        lista = document.createElement("ul");
        lista.className = "pg__fotos";
        galeria.insertBefore(lista, galeria.querySelector(".pg__arquivo"));
        if (vazio) vazio.remove();
      }

      var jaTem = lista.querySelectorAll(".pg__foto").length;
      var cabem = MAX_FOTOS - jaTem;
      if (arquivos.length > cabem) {
        arquivos = arquivos.slice(0, Math.max(0, cabem));
      }
      if (!arquivos.length) {
        recado.textContent = "Já são " + MAX_FOTOS + " fotos. Remova alguma antes.";
        recado.dataset.estado = "erro";
        return;
      }

      var titulo = (form.querySelector('[name="op[' + i + '][titulo]"]') || {}).value || "imovel";
      var prontas = 0, falhas = [];

      for (var n = 0; n < arquivos.length; n++) {
        var arq = arquivos[n];
        recado.dataset.estado = "indo";
        recado.textContent = "Enviando " + (n + 1) + " de " + arquivos.length + "...";
        try {
          var menor = await reduzir(arq);
          var r = await fetch("/painel/enviar", {
            method: "POST",
            headers: {
              "Content-Type": "image/jpeg",
              "X-CSRF": csrf.value,
              "X-Nome": encodeURIComponent(titulo).replace(/[^A-Za-z0-9%._-]/g, ""),
            },
            body: menor,
          });
          var resposta = await r.json();
          if (!r.ok) throw new Error(resposta.erro || "falhou no servidor");
          jaTem = lista.querySelectorAll(".pg__foto").length;
          lista.appendChild(cartao(i, 900 + jaTem, resposta.src, jaTem + 1));
          prontas++;
        } catch (e) {
          falhas.push(arq.name + ": " + e.message);
        }
      }

      if (falhas.length) {
        recado.dataset.estado = "erro";
        recado.textContent = falhas.join(" | ");
      } else {
        recado.dataset.estado = "ok";
        recado.textContent = prontas === 1
          ? "1 foto pronta. Clique em Salvar para publicar."
          : prontas + " fotos prontas. Clique em Salvar para publicar.";
      }
    });
  });
}());

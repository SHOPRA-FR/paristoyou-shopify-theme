/* ============================================================================
   PARISTOYOU — Social Studio
   Génère des visuels Instagram / TikTok brandés depuis une photo produit
   (import ou capture caméra), + légende & hashtags, + partage natif.
   100% côté navigateur (canvas + Web Share API). Aucun backend.
   ========================================================================== */
(function () {
  "use strict";
  var app = document.getElementById("StudioApp");
  if (!app) return;

  var CFG = {
    wordmark: app.dataset.wordmark || "paristoyou",
    handle:   app.dataset.handle   || "@paristoyou",
    whatsapp: app.dataset.whatsapp || "",
    accent:   app.dataset.accent   || "#12b886",
    accentSoft:"#a7e8d0",
    dark:     app.dataset.dark     || "#0f1512"
  };
  var KEY = "paristoyou_studio";

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("StCanvas");
  var ctx = canvas.getContext("2d");
  var img = null;               // Image object of the product photo
  var format = "post";          // "post" (1080x1080) | "story" (1080x1920)

  /* ---- helpers ---- */
  function fmt(v) {
    v = (v || "").toString().trim();
    if (!v) return "";
    if (/^[0-9., ]+$/.test(v)) return v.replace(/\s/g, " ") + " €";
    return v;
  }
  function num(v) { return parseFloat((v || "").toString().replace(",", ".").replace(/[^0-9.]/g, "")); }
  function discount() {
    var o = num($("StPrice").value), c = num($("StCompare").value);
    if (o > 0 && c > o) return Math.round((1 - o / c) * 100);
    return 0;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(text, x, y, maxW, lh) {
    var words = (text || "").split(" "), line = "", yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line.trim(), x, yy); line = words[i] + " "; yy += lh; }
      else line = test;
    }
    ctx.fillText(line.trim(), x, yy);
    return yy;
  }
  function coverDraw(im, W, H) {
    var r = Math.max(W / im.width, H / im.height);
    var w = im.width * r, h = im.height * r;
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }

  /* ---- render the card ---- */
  function draw() {
    var W = 1080, H = format === "story" ? 1920 : 1080;
    canvas.width = W; canvas.height = H;

    // background
    ctx.fillStyle = CFG.dark;
    ctx.fillRect(0, 0, W, H);
    if (img) coverDraw(img, W, H);
    else {
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1c2b24"); g.addColorStop(1, CFG.dark);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // top + bottom gradient overlays for legibility
    var top = ctx.createLinearGradient(0, 0, 0, H * 0.30);
    top.addColorStop(0, "rgba(15,21,18,.72)"); top.addColorStop(1, "rgba(15,21,18,0)");
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H * 0.30);
    var bot = ctx.createLinearGradient(0, H * 0.45, 0, H);
    bot.addColorStop(0, "rgba(15,21,18,0)"); bot.addColorStop(.55, "rgba(15,21,18,.82)"); bot.addColorStop(1, "rgba(15,21,18,.96)");
    ctx.fillStyle = bot; ctx.fillRect(0, H * 0.45, W, H * 0.55);

    // header : wordmark + kicker
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "700 52px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(CFG.wordmark, 64, 96);
    ctx.fillStyle = CFG.accentSoft;
    ctx.font = "600 22px Inter, sans-serif";
    ctx.fillText("PERSONAL SHOPPER · PARIS → WORLDWIDE".toUpperCase(), 64, 132);

    // discount badge
    var pct = discount();
    if (pct > 0) {
      ctx.fillStyle = CFG.accent;
      roundRect(64, H - (format === "story" ? 560 : 420), 190, 92, 46); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center";
      ctx.font = "700 46px Inter, sans-serif";
      ctx.fillText("-" + pct + "%", 64 + 95, H - (format === "story" ? 560 : 420) + 60);
      ctx.textAlign = "left";
    }

    // bottom text block
    var baseY = format === "story" ? H - 420 : H - 300;
    ctx.fillStyle = CFG.accentSoft;
    ctx.font = "700 30px Inter, sans-serif";
    ctx.fillText(($("StBrand").value || "BRAND").toUpperCase(), 64, baseY);

    ctx.fillStyle = "#fff";
    ctx.font = "600 62px 'Cormorant Garamond', Georgia, serif";
    var endY = wrap($("StItem").value || "Product name", 64, baseY + 70, W - 128, 66);

    // price line
    var py = endY + 78;
    ctx.font = "700 72px 'Cormorant Garamond', Georgia, serif";
    ctx.fillStyle = "#fff";
    var priceTxt = fmt($("StPrice").value) || "—";
    ctx.fillText(priceTxt, 64, py);
    var pw = ctx.measureText(priceTxt).width;
    var comp = fmt($("StCompare").value);
    if (comp && discount() > 0) {
      ctx.font = "400 40px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fillText(comp, 64 + pw + 28, py - 6);
      var cw = ctx.measureText(comp).width;
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(64 + pw + 28, py - 18); ctx.lineTo(64 + pw + 28 + cw, py - 18); ctx.stroke();
    }

    // footer CTA
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillStyle = CFG.accentSoft;
    ctx.fillText(CFG.handle + "  ·  DM / WhatsApp to order", 64, format === "story" ? H - 120 : H - 70);
  }

  /* ---- caption + hashtags ---- */
  function caption() {
    var lang = $("StLang").value;
    var b = $("StBrand").value || "", it = $("StItem").value || "",
        p = fmt($("StPrice").value), c = fmt($("StCompare").value), pct = discount(),
        cat = $("StCat").value || "", aud = $("StAud").value || "";
    var lines = { fr: [], tr: [], en: [] };

    lines.fr.push("✨ " + (b ? b + " — " : "") + it);
    if (p) lines.fr.push("💶 Prix outlet Paris : " + p + (pct ? "  (−" + pct + "% vs " + c + ")" : ""));
    lines.fr.push("📦 Achat par procuration · livraison Europe & international · sans visa, sans voyage.");
    lines.fr.push("👉 DM ou WhatsApp pour commander.");

    lines.tr.push("✨ " + (b ? b + " — " : "") + it);
    if (p) lines.tr.push("💶 Paris outlet fiyatı: " + p + (pct ? "  (−" + pct + "%)" : ""));
    lines.tr.push("📦 Sizin için satın alıyoruz · Avrupa & dünya geneli kargo · vizesiz, seyahatsiz.");
    lines.tr.push("👉 Sipariş için DM veya WhatsApp.");

    lines.en.push("✨ " + (b ? b + " — " : "") + it);
    if (p) lines.en.push("💶 Paris outlet price: " + p + (pct ? "  (−" + pct + "% vs " + c + ")" : ""));
    lines.en.push("📦 Personal shopping · shipped across Europe & worldwide · no visa, no trip.");
    lines.en.push("👉 DM or WhatsApp to order.");

    var tags = ["#paristoyou", "#personalshopper", "#parisshopping", "#outlet", "#luxuryforless", "#paris"];
    if (b) tags.push("#" + b.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (cat) tags.push("#" + cat.toLowerCase().replace(/[^a-z0-9]/g, ""));
    tags.push("#daigou", "#kişiselalışveriş", "#parisoutlet", "#moda", "#luxe");

    return lines[lang].join("\n") + "\n\n" + tags.join(" ");
  }

  /* ---- persistence of recent captures ---- */
  function saveRecent(dataUrl) {
    try {
      var arr = JSON.parse(localStorage.getItem(KEY) || "[]");
      arr.unshift({ brand: $("StBrand").value, item: $("StItem").value, price: $("StPrice").value, thumb: dataUrl });
      arr = arr.slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(arr));
      renderRecent();
    } catch (e) {}
  }
  function renderRecent() {
    var box = $("StRecent"); if (!box) return;
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
    box.innerHTML = arr.map(function (r) {
      return '<div class="st-recent-item"><img src="' + (r.thumb || "") + '" alt=""><span>' +
        (r.brand || "") + " · " + (r.item || "") + "</span></div>";
    }).join("") || '<p class="st-muted">No visuals yet.</p>';
  }

  /* ---- file / camera ---- */
  $("StPhoto").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    var i = new Image();
    i.onload = function () { img = i; draw(); };
    i.src = url;
  });

  /* ---- live inputs ---- */
  ["StBrand", "StItem", "StAud", "StCat", "StPrice", "StCompare", "StLang"].forEach(function (id) {
    var el = $(id); if (!el) return;
    el.addEventListener("input", function () { draw(); $("StCaption").value = caption(); });
    el.addEventListener("change", function () { draw(); $("StCaption").value = caption(); });
  });

  /* ---- format toggle ---- */
  document.querySelectorAll("#StFormat button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#StFormat button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      format = b.dataset.format;
      draw();
    });
  });

  /* ---- download ---- */
  $("StDownload").addEventListener("click", function () {
    canvas.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "paristoyou-" + (($("StBrand").value || "post").toLowerCase().replace(/[^a-z0-9]/g, "-")) + "-" + format + ".png";
      a.click();
      // thumbnail for recents
      var t = document.createElement("canvas"); t.width = 120; t.height = 120;
      t.getContext("2d").drawImage(canvas, 0, 0, 120, 120);
      saveRecent(t.toDataURL("image/jpeg", 0.6));
    }, "image/png");
  });

  /* ---- copy caption ---- */
  $("StCopy").addEventListener("click", function () {
    var btn = this, prev = btn.textContent;
    navigator.clipboard.writeText($("StCaption").value).then(function () {
      btn.textContent = "✓ Copied"; setTimeout(function () { btn.textContent = prev; }, 1500);
    });
  });

  /* ---- native share (→ Instagram / TikTok) ---- */
  $("StShare").addEventListener("click", function () {
    canvas.toBlob(function (blob) {
      var file = new File([blob], "paristoyou.png", { type: "image/png" });
      var data = { files: [file], text: $("StCaption").value, title: "PARISTOYOU" };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share(data).catch(function () {});
      } else {
        // desktop fallback : download + copy caption
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "paristoyou.png"; a.click();
        navigator.clipboard && navigator.clipboard.writeText($("StCaption").value);
        alert("Sur mobile, ce bouton ouvre le partage vers Instagram/TikTok.\nSur ordinateur : image téléchargée + légende copiée.");
      }
    }, "image/png");
  });

  /* ---- boot ---- */
  $("StCaption").value = caption();
  draw();
  renderRecent();
})();

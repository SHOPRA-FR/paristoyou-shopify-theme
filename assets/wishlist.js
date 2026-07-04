/* PARISTOYOU — My List (wishlist builder)
   Côté client uniquement : localStorage + calculs + export WhatsApp/copie.
   Les paramètres (taux, minima, WhatsApp) viennent des data-attributes posés
   par la section Liquid depuis les réglages du thème. */
(function () {
  "use strict";
  var app = document.getElementById("WishlistApp");
  if (!app) return;

  var CFG = {
    rate: parseFloat(app.dataset.rate || "30") / 100,
    minCommission: parseFloat(app.dataset.minCommission || "150"),
    minOrder: parseFloat(app.dataset.minOrder || "500"),
    customs: parseFloat(app.dataset.customs || "20") / 100,
    whatsapp: app.dataset.whatsapp || ""
  };
  var KEY = "paristoyou_wishlist";

  var fmt = function (n) {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);
  };
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  var save = function (items) { localStorage.setItem(KEY, JSON.stringify(items)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var host = function (url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

  var items = load();
  var $ = function (id) { return document.getElementById(id); };

  function totals() {
    var subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var commission = subtotal > 0 ? Math.max(subtotal * CFG.rate, CFG.minCommission) : 0;
    var delivery = subtotal > 0 ? parseFloat($("WlDelivery").value || "0") : 0;
    return {
      subtotal: subtotal,
      commission: commission,
      delivery: delivery,
      customs: subtotal * CFG.customs,
      total: subtotal + commission + delivery,
      belowMin: subtotal > 0 && subtotal < CFG.minOrder
    };
  }

  function render() {
    var wrap = $("WlItems");
    $("WlCount").textContent = items.length;
    $("WlEmpty").hidden = items.length !== 0;

    wrap.innerHTML = items.map(function (i) {
      var h = host(i.url);
      return '<div class="wl-item">' +
        '<div class="wl-item-info">' +
          '<span class="wl-item-name">' + esc(i.name) + (i.qty > 1 ? " ×" + i.qty : "") + "</span>" +
          '<span class="wl-item-meta">' + (i.size ? "Size " + esc(i.size) + " · " : "") +
            (h ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(h) + " ↗</a>" : "") + "</span>" +
        "</div>" +
        '<span class="wl-item-price">' + fmt(i.price * i.qty) + "</span>" +
        '<button type="button" class="wl-rm" data-id="' + i.id + '" aria-label="Remove">×</button>' +
      "</div>";
    }).join("");

    wrap.querySelectorAll(".wl-rm").forEach(function (b) {
      b.addEventListener("click", function () {
        items = items.filter(function (i) { return String(i.id) !== b.dataset.id; });
        save(items); render();
      });
    });

    var t = totals();
    $("WlSubtotal").textContent = fmt(t.subtotal);
    $("WlCommissionLabel").textContent = $("WlCommissionLabel").textContent.split(" · ")[0] +
      " · " + Math.round(CFG.rate * 100) + "% (min " + fmt(CFG.minCommission) + ")";
    $("WlCommission").textContent = fmt(t.commission);
    $("WlTotal").textContent = fmt(t.total);
    $("WlMinWarn").hidden = !t.belowMin;
  }

  $("WlForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    items.push({
      id: Date.now(),
      url: $("WlUrl").value.trim(),
      name: $("WlName").value.trim(),
      size: $("WlSize").value.trim(),
      price: Math.max(0, parseFloat($("WlPrice").value) || 0),
      qty: Math.max(1, parseInt($("WlQty").value, 10) || 1)
    });
    save(items);
    f.reset();
    $("WlQty").value = 1;
    $("WlUrl").focus();
    render();
  });

  $("WlDelivery").addEventListener("change", render);

  function buildText() {
    var t = totals();
    var lines = ["PARISTOYOU — My shopping list", ""];
    items.forEach(function (i, idx) {
      lines.push((idx + 1) + ". " + i.name + (i.size ? " | size " + i.size : "") + (i.qty > 1 ? " | x" + i.qty : "") + " | " + fmt(i.price * i.qty));
      if (i.url) lines.push("   " + i.url);
    });
    var sel = $("WlDelivery");
    lines.push("",
      "Subtotal: " + fmt(t.subtotal),
      "Commission " + Math.round(CFG.rate * 100) + "% (min " + fmt(CFG.minCommission) + "): " + fmt(t.commission),
      "Delivery (" + sel.options[sel.selectedIndex].text + "): " + fmt(t.delivery),
      "TOTAL upfront: " + fmt(t.total),
      "(+ Turkish customs ~" + Math.round(CFG.customs * 100) + "% ≈ " + fmt(t.customs) + " on arrival)");
    return lines.join("\n");
  }

  $("WlSendWa").addEventListener("click", function () {
    if (!items.length) return;
    var url = CFG.whatsapp
      ? "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(buildText())
      : "https://wa.me/?text=" + encodeURIComponent(buildText());
    window.open(url, "_blank", "noopener");
  });

  $("WlCopy").addEventListener("click", function () {
    if (!items.length) return;
    var btn = this, prev = btn.textContent;
    navigator.clipboard.writeText(buildText()).then(function () {
      btn.textContent = "✓";
      setTimeout(function () { btn.textContent = prev; }, 1500);
    });
  });

  render();
})();

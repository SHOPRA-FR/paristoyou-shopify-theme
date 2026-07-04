/* PARISTOYOU theme JS — burger, filtre marques, galerie produit, prix variante */
(function () {
  "use strict";

  // Burger menu
  var burger = document.getElementById("Burger");
  var nav = document.getElementById("MainNav");
  if (burger && nav) {
    burger.addEventListener("click", function () { nav.classList.toggle("open"); });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  // Brands: search + mall filter
  var grid = document.getElementById("BrandsGrid");
  if (grid) {
    var search = document.getElementById("BrandSearch");
    var filters = document.getElementById("BrandFilters");
    var none = document.getElementById("BrandsNone");
    var mall = "all";
    var q = "";

    var apply = function () {
      var visible = 0;
      grid.querySelectorAll(".brand-card").forEach(function (card) {
        var okMall = mall === "all" || card.dataset.mall === mall;
        var okName = !q || (card.dataset.name || "").indexOf(q) !== -1;
        var show = okMall && okName;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (none) none.hidden = visible !== 0;
    };

    if (search) search.addEventListener("input", function (e) {
      q = e.target.value.trim().toLowerCase(); apply();
    });
    if (filters) filters.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        mall = btn.dataset.mall; apply();
      });
    });
  }

  // Commission simulator (pricing section) — commission = max(rate%, minimum)
  var simSection = document.getElementById("pricing");
  var simRange = document.getElementById("SimAmount");
  var simNum = document.getElementById("SimAmountNum");
  if (simSection && simRange && simNum) {
    var simRate = parseFloat(simSection.dataset.simRate || "20") / 100;
    var simMin = parseFloat(simSection.dataset.simMin || "300");
    var simFmt = function (n) {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
    };
    var simLabel = document.getElementById("SimCommissionLabel");
    if (simLabel) simLabel.textContent = simLabel.textContent.split(" · ")[0] +
      " · " + Math.round(simRate * 100) + "% (min " + simFmt(simMin) + ")";

    var simUpdate = function (val, from) {
      var a = Math.max(0, parseFloat(val) || 0);
      if (from !== "range") simRange.value = Math.min(a, parseFloat(simRange.max));
      if (from !== "num") simNum.value = a;
      var commission = a > 0 ? Math.max(a * simRate, simMin) : 0;
      document.getElementById("SimPurchases").textContent = simFmt(a);
      document.getElementById("SimCommission").textContent = simFmt(commission);
      document.getElementById("SimTotal").textContent = simFmt(a + commission);
    };
    simRange.addEventListener("input", function (e) { simUpdate(e.target.value, "range"); });
    simNum.addEventListener("input", function (e) { simUpdate(e.target.value, "num"); });
    var simEx = document.getElementById("SimExamples");
    if (simEx) simEx.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { simUpdate(b.dataset.amount, ""); });
    });
    simUpdate(simNum.value, "");
  }

  // Product: thumbnail gallery
  var main = document.getElementById("ProductMainImage");
  if (main) {
    document.querySelectorAll(".product-thumbs .thumb").forEach(function (t) {
      t.addEventListener("click", function () { main.src = t.dataset.src; });
    });
  }

  // Product: variant select -> price update
  var sel = document.getElementById("VariantSelect");
  var price = document.getElementById("ProductPrice");
  if (sel && price) {
    sel.addEventListener("change", function () {
      var opt = sel.options[sel.selectedIndex];
      if (opt && opt.dataset.price) price.textContent = opt.dataset.price;
    });
  }
})();

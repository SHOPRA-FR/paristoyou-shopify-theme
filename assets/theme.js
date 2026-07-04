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

    // Comparaison voyage : billet A/R (curseur) + nuits d'hôtel (curseur × prix/nuit)
    var simFlight = document.getElementById("SimFlight");
    var simNights = document.getElementById("SimNights");
    var nightPrice = parseFloat(simSection.dataset.nightPrice || "150");
    var lastCommission = 0;

    var refreshTravel = function () {
      if (!simFlight || !simNights) return;
      var flight = parseFloat(simFlight.value) || 0;
      var nights = parseInt(simNights.value, 10) || 0;
      var hotel = nights * nightPrice;
      var travel = flight + hotel;
      document.getElementById("SimFlightVal").textContent = simFmt(flight);
      document.getElementById("SimNightsN").textContent = nights;
      document.getElementById("SimHotelVal").textContent = simFmt(hotel);
      document.getElementById("SimTravel").textContent = simFmt(travel);
      var save = travel - lastCommission;
      var box = document.getElementById("SimSave");
      if (box) {
        box.hidden = false;
        if (save >= 0) {
          box.classList.remove("neg");
          box.textContent = (simSection.dataset.saveLabel || "You save") + " " + simFmt(save) + " " +
            (simSection.dataset.saveSuffix || "vs travelling yourself.");
        } else {
          box.classList.add("neg");
          box.textContent = (simSection.dataset.saveLabel || "You save") + " — " +
            simFmt(lastCommission) + " commission vs " + simFmt(travel) + " trip";
        }
      }
    };

    var simUpdate = function (val, from) {
      var a = Math.max(0, parseFloat(val) || 0);
      if (from !== "range") simRange.value = Math.min(a, parseFloat(simRange.max));
      if (from !== "num") simNum.value = a;
      var commission = a > 0 ? Math.max(a * simRate, simMin) : 0;
      lastCommission = commission;
      document.getElementById("SimPurchases").textContent = simFmt(a);
      document.getElementById("SimCommission").textContent = simFmt(commission);
      document.getElementById("SimTotal").textContent = simFmt(a + commission);
      refreshTravel();
    };
    simRange.addEventListener("input", function (e) { simUpdate(e.target.value, "range"); });
    simNum.addEventListener("input", function (e) { simUpdate(e.target.value, "num"); });
    if (simFlight) simFlight.addEventListener("input", refreshTravel);
    if (simNights) simNights.addEventListener("input", refreshTravel);
    var simEx = document.getElementById("SimExamples");
    if (simEx) simEx.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { simUpdate(b.dataset.amount, ""); });
    });
    simUpdate(simNum.value, "");
  }

  // Brand catalog — filtres marque / audience / catégorie / recherche
  var catGrid = document.getElementById("CatGrid");
  if (catGrid) {
    var cards = [].slice.call(catGrid.querySelectorAll(".cat-card"));
    var selBrand = document.getElementById("CatBrand");
    var selAud = document.getElementById("CatAudience");
    var selCat = document.getElementById("CatCategory");
    var catSearch = document.getElementById("CatSearch");
    var catCount = document.getElementById("CatCount");
    var catNone = document.getElementById("CatNone");

    // options construites depuis les données des cartes
    var fill = function (sel, attr) {
      var vals = [];
      cards.forEach(function (c) {
        var v = c.dataset[attr];
        if (v && vals.indexOf(v) === -1) vals.push(v);
      });
      vals.sort().forEach(function (v) {
        var o = document.createElement("option");
        o.value = v; o.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        sel.appendChild(o);
      });
    };
    fill(selBrand, "brand"); fill(selAud, "aud"); fill(selCat, "cat");

    var applyCat = function () {
      var b = selBrand.value, a = selAud.value, k = selCat.value;
      var q = (catSearch.value || "").trim().toLowerCase();
      var n = 0;
      cards.forEach(function (c) {
        var show = (!b || c.dataset.brand === b) &&
                   (!a || c.dataset.aud === a) &&
                   (!k || c.dataset.cat === k) &&
                   (!q || c.dataset.search.indexOf(q) !== -1);
        c.style.display = show ? "" : "none";
        if (show) n++;
      });
      if (catCount) catCount.textContent = n;
      if (catNone) catNone.hidden = n !== 0;
    };
    [selBrand, selAud, selCat].forEach(function (s) { s.addEventListener("change", applyCat); });
    catSearch.addEventListener("input", applyCat);
    applyCat();
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

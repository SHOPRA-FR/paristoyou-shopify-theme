/* PARISTOYOU theme JS — burger, filtre marques, galerie produit, prix variante */
(function () {
  "use strict";

  // Burger menu
  var burger = document.getElementById("Burger");
  var nav = document.getElementById("MainNav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
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
  if (simSection && simRange) {
    var simRate = parseFloat(simSection.dataset.simRate || "20") / 100;
    var simMin = parseFloat(simSection.dataset.simMin || "300");
    var simFmt = function (n) {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
    };
    var simLabel = document.getElementById("SimCommissionLabel");
    var simVal = document.getElementById("SimAmountVal");
    if (simLabel) simLabel.textContent = simLabel.textContent.split(" · ")[0] +
      " · " + Math.round(simRate * 100) + "% (min " + simFmt(simMin) + ")";

    // Travel comparison (optional — elements may not exist)
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
      var fv = document.getElementById("SimFlightVal"); if (fv) fv.textContent = simFmt(flight);
      var nn = document.getElementById("SimNightsN"); if (nn) nn.textContent = nights;
      var hv = document.getElementById("SimHotelVal"); if (hv) hv.textContent = simFmt(hotel);
      var st = document.getElementById("SimTravel"); if (st) st.textContent = simFmt(travel);
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
      if (simVal) simVal.textContent = simFmt(a);
      var commission = a > 0 ? Math.max(a * simRate, simMin) : 0;
      lastCommission = commission;
      var sp = document.getElementById("SimPurchases"); if (sp) sp.textContent = simFmt(a);
      var sc = document.getElementById("SimCommission"); if (sc) sc.textContent = simFmt(commission);
      var st = document.getElementById("SimTotal"); if (st) st.textContent = simFmt(a + commission);
      refreshTravel();
    };
    simRange.addEventListener("input", function (e) { simUpdate(e.target.value, "range"); });
    if (simFlight) simFlight.addEventListener("input", refreshTravel);
    if (simNights) simNights.addEventListener("input", refreshTravel);
    var simEx = document.getElementById("SimExamples");
    if (simEx) simEx.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { simUpdate(b.dataset.amount, ""); });
    });
    simUpdate(simRange.value, "range");
  }

  // Brand catalog — filtres marque / audience / catégorie / recherche
  var catGrid = document.getElementById("CatGrid");
  if (catGrid) {
    var cards = [].slice.call(catGrid.querySelectorAll(".cat-card"));
    var selBrand = document.getElementById("CatBrand");
    var selAudWrap = document.getElementById("CatAudience"); // pills container
    var selCat = document.getElementById("CatCategory");
    var catSearch = document.getElementById("CatSearch");
    var catCount = document.getElementById("CatCount");
    var catNone = document.getElementById("CatNone");
    var audVal = ""; // current audience filter value

    // populate brand + category selects from card data
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
    fill(selBrand, "brand"); fill(selCat, "cat");

    // audience pills click
    if (selAudWrap) {
      selAudWrap.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selAudWrap.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          audVal = btn.dataset.val || "";
          applyCat();
        });
      });
    }

    var applyCat = function () {
      var b = selBrand.value, a = audVal, k = selCat.value;
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
    selBrand.addEventListener("change", applyCat);
    selCat.addEventListener("change", applyCat);
    catSearch.addEventListener("input", applyCat);
    applyCat();
  }

  // Collection page — search filter
  // Catalogue — filtres marque / audience / type + recherche + tri
  var collGrid = document.getElementById("CollGrid");
  if (collGrid) {
    var cCards = [].slice.call(collGrid.querySelectorAll(".product-card"));
    var cSearch = document.getElementById("CollSearch");
    var cBrand = document.getElementById("CollBrand");
    var cType = document.getElementById("CollType");
    var cSort = document.getElementById("CollSort");
    var cAudWrap = document.getElementById("CollAudience");
    var cCount = document.getElementById("CollCount");
    var cNone = document.getElementById("CollNone");
    var cReset = document.getElementById("CollReset");
    var cAud = "";

    // ordre d'origine (tri « featured »)
    cCards.forEach(function (c, i) { c.dataset.i = i; });

    // remplit les selects marque + type à partir des cartes
    var fill = function (sel, attr) {
      if (!sel) return;
      var vals = [];
      cCards.forEach(function (c) {
        var v = (c.dataset[attr] || "").trim();
        if (v && vals.indexOf(v) === -1) vals.push(v);
      });
      vals.sort(function (a, b) { return a.localeCompare(b); });
      vals.forEach(function (v) {
        var o = document.createElement("option");
        o.value = v.toLowerCase();
        o.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        sel.appendChild(o);
      });
    };
    fill(cBrand, "brand");
    fill(cType, "type");

    var apply = function () {
      var b = cBrand ? cBrand.value.toLowerCase() : "";
      var t = cType ? cType.value.toLowerCase() : "";
      var q = cSearch ? (cSearch.value || "").trim().toLowerCase() : "";
      var n = 0;
      cCards.forEach(function (c) {
        var show =
          (!b || (c.dataset.brand || "").toLowerCase() === b) &&
          (!cAud || (c.dataset.aud || "") === cAud) &&
          (!t || (c.dataset.type || "") === t) &&
          (!q || (c.dataset.search || "").indexOf(q) !== -1);
        c.style.display = show ? "" : "none";
        if (show) n++;
      });
      if (cCount) cCount.textContent = n;
      if (cNone) cNone.hidden = n !== 0;
      if (cReset) cReset.hidden = !(b || t || q || cAud);
    };

    var sortCards = function () {
      if (!cSort) return;
      var mode = cSort.value;
      cCards.slice().sort(function (a, b) {
        if (mode === "price-asc") return (+a.dataset.price) - (+b.dataset.price);
        if (mode === "price-desc") return (+b.dataset.price) - (+a.dataset.price);
        if (mode === "discount") return (+b.dataset.disc) - (+a.dataset.disc);
        return (+a.dataset.i) - (+b.dataset.i);
      }).forEach(function (c) { collGrid.appendChild(c); });
    };

    if (cSearch) cSearch.addEventListener("input", apply);
    if (cBrand) cBrand.addEventListener("change", apply);
    if (cType) cType.addEventListener("change", apply);
    if (cSort) cSort.addEventListener("change", sortCards);
    if (cAudWrap) cAudWrap.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        cAudWrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        btn.classList.add("active");
        cAud = btn.dataset.val || "";
        apply();
      });
    });
    if (cReset) cReset.addEventListener("click", function () {
      if (cBrand) cBrand.value = "";
      if (cType) cType.value = "";
      if (cSearch) cSearch.value = "";
      cAud = "";
      if (cAudWrap) {
        cAudWrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        var first = cAudWrap.querySelector('button[data-val=""]') || cAudWrap.querySelector("button");
        if (first) first.classList.add("active");
      }
      apply();
    });

    apply();
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

  /* ---- Selection carousel — scroll natif + auto-avance ---- */
  var carousel = document.getElementById("SelCarousel");
  var track = document.getElementById("SelTrack");
  if (carousel && track) {
    var cards = track.querySelectorAll(".sel-card");
    if (cards.length) {
      var step = 0;
      var timer = null;
      var speed = parseInt(carousel.dataset.speed || "2", 10) * 1000;
      var ignoreScroll = false;

      // Marque la carte active
      var mark = function (idx) {
        for (var i = 0; i < cards.length; i++) {
          cards[i].classList.toggle("active", i === idx);
        }
      };

      // Scroll vers la carte idx
      var scrollTo = function (idx) {
        if (idx < 0) idx = cards.length - 1;
        if (idx >= cards.length) idx = 0;
        step = idx;
        ignoreScroll = true;
        var card = cards[idx];
        var left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
        track.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        mark(idx);
        setTimeout(function () { ignoreScroll = false; }, 600);
      };

      // Détecte quelle carte est la plus visible
      var findClosest = function () {
        var center = track.scrollLeft + track.clientWidth / 2;
        var best = 0, bestDist = Infinity;
        for (var i = 0; i < cards.length; i++) {
          var mid = cards[i].offsetLeft + cards[i].offsetWidth / 2;
          var dist = Math.abs(center - mid);
          if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return best;
      };

      // Scroll manuel → mettre à jour active
      track.addEventListener("scroll", function () {
        if (ignoreScroll) return;
        step = findClosest();
        mark(step);
      }, { passive: true });

      // Clic sur une carte → centrer dessus
      for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener("click", function (e) {
          var idx = Array.prototype.indexOf.call(cards, this);
          scrollTo(idx);
          resetTimer();
        });
      }

      // Auto-advance
      var next = function () { scrollTo(step + 1); };
      var resetTimer = function () {
        if (timer) clearInterval(timer);
        timer = setInterval(next, speed);
      };

      // Pause au touch uniquement (la souris n'interrompt plus)
      track.addEventListener("touchstart", function () {
        if (timer) clearInterval(timer);
      }, { passive: true });
      track.addEventListener("touchend", function () {
        step = findClosest();
        mark(step);
        resetTimer();
      });

      // Redimensionnement
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { scrollTo(step); }, 200);
      });

      scrollTo(0);
      resetTimer();
    }
  }

  // Apparitions au scroll (reveal) — pose .rv puis .rv-in à l'entrée dans le viewport.
  // Progressive enhancement : sans JS, aucun élément n'est masqué.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var rvEls = [].slice.call(document.querySelectorAll(
      ".section .container > .kicker, .section .container > h1, .section .container > h2, .section .container > .lead, " +
      ".product-grid > *, .brands-grid > *, .offers-grid > *, .fee-examples > *, .price-hero, .sim-card, " +
      ".service-visual, .service-content, .faq-list details, .contact-form-col, .contact-side, .wl-form, .wl-summary, " +
      ".footer-top > *"
    ));
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("rv-in"); rvIO.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    rvEls.forEach(function (el) {
      // cascade : délai selon la position parmi les frères déjà "révélables"
      var sibs = el.parentElement ? el.parentElement.children : [];
      var before = 0;
      for (var i = 0; i < sibs.length; i++) {
        if (sibs[i] === el) break;
        if (sibs[i].classList && sibs[i].classList.contains("rv")) before++;
      }
      el.classList.add("rv");
      el.style.setProperty("--rv-d", Math.min(before * 70, 420) + "ms");
      rvIO.observe(el);
    });
  }
})();

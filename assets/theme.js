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

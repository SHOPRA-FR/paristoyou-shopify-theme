// ============================================================================
// PARISTOYOU — Scraper La Vallée Village
// À coller dans la console du navigateur sur :
// https://www.thebicestercollection.com/la-vallee-village/fr/marque/
// ============================================================================
//
// Usage :
// 1. Ouvre https://www.thebicestercollection.com/la-vallee-village/fr/marque/
// 2. Ouvre la console (F12 → Console)
// 3. Colle ce script et appuie sur Entrée
// 4. Le script parcourt TOUTES les marques et télécharge le CSV à la fin
//
// ⚠️ Respecte le site : le script attend 1.5s entre chaque marque.
// ============================================================================

(async () => {
  const DELAY = 1500; // pause entre chaque marque (ms)
  const results = [];
  const LOG_PREFIX = '%c[Scraper]';
  const LOG_STYLE = 'color:#12b886;font-weight:bold';

  console.log(LOG_PREFIX, LOG_STYLE, '🔍 Recherche des marques...');

  // 1. Récupérer toutes les URLs de marques sur la page
  const brandLinks = [...document.querySelectorAll('a[href*="/marque/"]')]
    .map(a => a.href)
    .filter(href => href.includes('/marque/') && !href.includes('#') && !href.includes('?'))
    .filter((href, i, arr) => arr.indexOf(href) === i); // unique

  console.log(LOG_PREFIX, LOG_STYLE, `${brandLinks.length} marques trouvées`);

  // 2. Pour chaque marque, charger la page et extraire les produits
  for (let i = 0; i < brandLinks.length; i++) {
    const url = brandLinks[i];
    const brandName = url.split('/marque/')[1]?.replace(/\/$/, '') || 'unknown';

    console.log(LOG_PREFIX, LOG_STYLE, `[${i + 1}/${brandLinks.length}] ${brandName}...`);

    try {
      const resp = await fetch(url);
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Tenter de trouver le nom de la marque (plus propre)
      const titleEl = doc.querySelector('h1, .brand-title, [class*="brand"]');
      let displayBrand = brandName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/ Lv /gi, '')
        .trim();

      // Chercher les produits
      // Les images produit sont souvent dans des balises img avec des noms descriptifs
      const productCards = doc.querySelectorAll(
        '[class*="product"], [class*="item"], [class*="card"], ' +
        'img[src*="product"], img[alt*="sac"], img[alt*="Sac"], ' +
        'img[alt*="GG"], img[alt*="gucci"], img[alt*="Gucci"]'
      );

      // Alternative : chercher toutes les images qui ressemblent à des produits
      const allImages = doc.querySelectorAll('img[src^="data:"]');

      // Stratégie : chercher les blocs produit (titre + image)
      const blocks = doc.querySelectorAll(
        'li, [class*="tile"], [class*="item"], article, [class*="col"]'
      );

      let productsFound = 0;

      blocks.forEach(block => {
        const img = block.querySelector('img[src^="data:"]');
        const text = block.textContent?.trim() || '';

        // Filtrer : doit avoir une image ET du texte pertinent
        if (!img || text.length < 10 || text.length > 500) return;

        // Ignorer le texte de navigation/footer
        if (/accueil|contact|mentions|légal|politique|cookie|boutique/i.test(text)) return;

        // Déterminer l'audience
        let audience = 'mixte';
        if (/\bhomme\b/i.test(text) && !/\bfemme\b/i.test(text)) audience = 'homme';
        if (/\bfemme\b/i.test(text) && !/\bhomme\b/i.test(text)) audience = 'femme';
        if (/\benfant\b/i.test(text)) audience = 'enfant';

        // Déterminer la catégorie
        let category = 'accessoires';
        if (/sac\b|bag\b|tote\b|backpack/i.test(text)) category = 'sac';
        else if (/chaussure|basket|sneaker|shoe|pump/i.test(text)) category = 'chaussures';
        else if (/chemise|shirt|blouse/i.test(text)) category = 'chemise';
        else if (/pantalon|jean|chino|pant/i.test(text)) category = 'pantalon';
        else if (/robe|dress/i.test(text)) category = 'robe';
        else if (/lunette|sunglass/i.test(text)) category = 'lunettes de soleil';
        else if (/parfum|fragrance/i.test(text)) category = 'parfum';
        else if (/montre|watch/i.test(text)) category = 'montre';
        else if (/portefeuille|wallet|card.?holder/i.test(text)) category = 'accessoires';
        else if (/ceinture|belt/i.test(text)) category = 'accessoires';

        // Nettoyer le nom du produit : prendre la première phrase pertinente
        let productName = text
          .split(/[.\n]/)[0]
          .replace(/\s+/g, ' ')
          .substring(0, 100)
          .trim();

        if (productName.length < 5) return;

        results.push({
          Vendor: displayBrand,
          Audience: audience,
          Category: category,
          Title: productName,
          Price: '',
          ComparePrice: '',
          DateVu: new Date().toISOString().split('T')[0],
          ImageData: img.src, // base64
        });

        productsFound++;
      });

      if (productsFound === 0) {
        // Fallback : prendre les 10 plus grandes images base64
        const imgs = [...doc.querySelectorAll('img[src^="data:"]')]
          .filter(img => {
            const alt = (img.alt || '').toLowerCase();
            return !alt.includes('logo') && !alt.includes('icon') && !alt.includes('map');
          })
          .slice(0, 20);

        imgs.forEach(img => {
          const alt = img.alt || '';
          if (alt.length < 5) return;

          results.push({
            Vendor: displayBrand,
            Audience: 'mixte',
            Category: 'accessoires',
            Title: alt,
            Price: '',
            ComparePrice: '',
            DateVu: new Date().toISOString().split('T')[0],
            ImageData: img.src,
          });
          productsFound++;
        });
      }

      console.log(LOG_PREFIX, LOG_STYLE, `  ✓ ${productsFound} produits trouvés pour ${displayBrand}`);
    } catch (err) {
      console.warn(`  ⚠️ Erreur pour ${brandName}: ${err.message}`);
    }

    // Pause pour respecter le site
    await new Promise(r => setTimeout(r, DELAY));
  }

  // 3. Générer le CSV
  console.log(LOG_PREFIX, LOG_STYLE, `\n📊 ${results.length} produits scrapés. Génération du CSV...`);

  const headers = ['Vendor', 'Audience', 'Category', 'Title', 'Price', 'ComparePrice', 'DateVu', 'ImageData'];
  const csvRows = [headers.join(',')];

  results.forEach(r => {
    const row = headers.map(h => {
      const val = (r[h] || '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  });

  const csv = csvRows.join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lavallee-products-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();

  console.log(LOG_PREFIX, LOG_STYLE, '✅ CSV téléchargé !');
  console.log(LOG_PREFIX, LOG_STYLE, `Colle ce fichier dans Shopify → Produits → Importer`);
})();

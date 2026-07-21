// ============================================================================
// PARISTOYOU — Scraper La Vallée Village (version Puppeteer)
// ============================================================================
// Usage :
//   npm install puppeteer
//   node scraper-lavallee.mjs
//
// Le script :
//   1. Lance un vrai navigateur (Chromium)
//   2. Parcourt chaque page marque
//   3. Attend le rendu JS des produits
//   4. Extrait noms, images, prix
//   5. Génère un CSV prêt pour Shopify
// ============================================================================

import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const BASE = 'https://www.thebicestercollection.com/la-vallee-village/fr';
const BRANDS_URL = `${BASE}/marque/`;

const DELAY = 2000; // pause entre chaque marque (ms)
const OUTPUT = `lavallee-products-${new Date().toISOString().split('T')[0]}.csv`;

// Reprendre là où on s'était arrêté
let done = [];
if (existsSync(OUTPUT)) {
  const lines = readFileSync(OUTPUT, 'utf-8').split('\n').slice(1).filter(Boolean);
  done = lines.map(l => l.split(',')[0]?.replace(/"/g, ''));
  console.log(`📂 CSV existant : ${lines.length} produits déjà scrapés`);
}

async function scrape() {
  console.log('🚀 Lancement du navigateur...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Récupérer toutes les URLs de marques
  console.log('🔍 Récupération de la liste des marques...');
  await page.goto(BRANDS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000)); // laisser le JS s'exécuter

  const brandLinks = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/marque/"]')]
      .map(a => a.href)
      .filter(href => {
        const parts = href.split('/marque/');
        return parts.length === 2 && parts[1] !== '' && !parts[1].includes('#');
      });
    return [...new Set(links)];
  });

  console.log(`📋 ${brandLinks.length} marques trouvées\n`);

  const allProducts = [];
  const alreadyDone = new Set(done);

  // 2. Visiter chaque page marque
  for (let i = 0; i < brandLinks.length; i++) {
    const url = brandLinks[i];
    const slug = url.split('/marque/')[1]?.replace(/\/$/, '');

    if (alreadyDone.has(slug)) {
      console.log(`[${i + 1}/${brandLinks.length}] ⏭️  ${slug} — déjà fait`);
      continue;
    }

    console.log(`[${i + 1}/${brandLinks.length}] 🔎 ${slug}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 3000)); // attendre le rendu JS

      const products = await page.evaluate(() => {
        const items = [];

        // Chercher des cards produit (pattern commun)
        const cards = document.querySelectorAll(
          '[class*="product"], [class*="Product"], ' +
          '[class*="card"], [class*="Card"], ' +
          '[class*="tile"], [class*="Tile"], ' +
          '[class*="item"], [class*="Item"], ' +
          'article, [class*="col"]'
        );

        cards.forEach(card => {
          // Image
          const img = card.querySelector('img');
          const imgSrc = img?.src || img?.dataset?.src || '';
          if (!imgSrc || imgSrc.length < 200) return; // ignorer les placeholders

          // Nom
          const title = card.querySelector(
            'h2, h3, h4, [class*="title"], [class*="name"], [class*="heading"]'
          )?.textContent?.trim() || '';

          // Prix
          const priceEl = card.querySelector(
            '[class*="price"], [class*="Price"], ' +
            '[class*="amount"], [class*="Amount"], ' +
            's, del, [class*="original"], [class*="was"]'
          );
          const currentEl = card.querySelector(
            ':not(s):not(del)[class*="price"], ' +
            ':not(s):not(del)[class*="Price"], ' +
            '[class*="current"], [class*="now"], [class*="sale"]'
          );

          // Chercher tous les prix dans le texte
          const allText = card.textContent || '';
          const priceMatches = allText.match(/(\d[\d\s,]*[.,]\d{2})\s*€/g) || [];

          let originalPrice = '';
          let outletPrice = '';

          if (priceMatches.length >= 2) {
            originalPrice = priceMatches[0].replace(/\s/g, '');
            outletPrice = priceMatches[1].replace(/\s/g, '');
          } else if (priceMatches.length === 1) {
            outletPrice = priceMatches[0].replace(/\s/g, '');
          }

          if (title || imgSrc) {
            items.push({
              title: title || card.textContent?.trim()?.split('\n')[0]?.slice(0, 80) || '',
              image: imgSrc,
              originalPrice,
              outletPrice,
            });
          }
        });

        // Si pas trouvé avec les cards, prendre toutes les images avec alt
        if (items.length === 0) {
          document.querySelectorAll('img[alt]').forEach(img => {
            const alt = img.alt.trim();
            const src = img.src || img.dataset?.src || '';
            if (alt.length > 10 && src.length > 200 && !/logo|icon|map/i.test(alt)) {
              // Chercher du texte avec un prix à proximité
              const parent = img.closest('div, li, article, section');
              const nearby = parent?.textContent || '';
              const prices = nearby.match(/(\d[\d\s,]*[.,]\d{2})\s*€/g) || [];

              items.push({
                title: alt.slice(0, 80),
                image: src,
                originalPrice: prices[0]?.replace(/\s/g, '') || '',
                outletPrice: prices[1]?.replace(/\s/g, '') || prices[0]?.replace(/\s/g, '') || '',
              });
            }
          });
        }

        return items;
      });

      // Construire le nom de la marque
      const brandName = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/ Lv$/i, '');

      for (const p of products) {
        // Déterminer audience
        let audience = 'mixte';
        const t = p.title.toLowerCase();
        if (/\bhomme\b|men/i.test(t) && !/femme|women/i.test(t)) audience = 'homme';
        if (/\bfemme\b|women/i.test(t) && !/\bhomme\b|men/i.test(t)) audience = 'femme';
        if (/\benfant|child|kid/i.test(t)) audience = 'enfant';

        // Déterminer catégorie
        let category = 'accessoires';
        if (/sac\b|bag|tote|backpack/i.test(t)) category = 'sac';
        else if (/chaussure|basket|sneaker|shoe|pump|boot/i.test(t)) category = 'chaussures';
        else if (/chemise|shirt|blouse/i.test(t)) category = 'chemise';
        else if (/pantalon|jean|chino|pant|trouser/i.test(t)) category = 'pantalon';
        else if (/robe|dress/i.test(t)) category = 'robe';
        else if (/lunette|sunglass/i.test(t)) category = 'lunettes de soleil';
        else if (/parfum|fragrance/i.test(t)) category = 'parfum';
        else if (/montre|watch/i.test(t)) category = 'montre';
        else if (/veste|jacket|blouson|manteau|coat/i.test(t)) category = 'veste';
        else if (/pull|sweater|knit|maille/i.test(t)) category = 'pull';
        else if (/tshirt|t-shirt|tee/i.test(t)) category = 't-shirt';
        else if (/ceinture|belt/i.test(t)) category = 'accessoires';
        else if (/portefeuille|wallet|card.?holder/i.test(t)) category = 'accessoires';
        else if (/pantoufle|slipper|mule/i.test(t)) category = 'pantoufle';

        allProducts.push({
          Vendor: brandName,
          Audience: audience,
          Category: category,
          Title: p.title,
          Price: p.outletPrice || '',
          ComparePrice: p.originalPrice || '',
          DateVu: new Date().toISOString().split('T')[0],
          ImageUrl: p.image,
        });
      }

      const newCount = products.length;
      console.log(`  ✅ ${newCount} produits trouvés`);
    } catch (err) {
      console.log(`  ⚠️ Erreur: ${err.message}`);
    }

    // Sauvegarder après chaque marque (au cas où ça plante)
    if (allProducts.length > 0) {
      const headers = ['Vendor', 'Audience', 'Category', 'Title', 'Price', 'ComparePrice', 'DateVu', 'ImageUrl'];
      const csv = [
        headers.join(','),
        ...allProducts.map(p =>
          headers.map(h => `"${(p[h] || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');
      writeFileSync(OUTPUT, '﻿' + csv, 'utf-8');
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  await browser.close();
  console.log(`\n✅ Terminé ! ${allProducts.length} produits → ${OUTPUT}`);
  console.log('📤 Importe ce CSV dans Shopify → Produits → Importer');
}

scrape().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

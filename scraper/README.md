# PARISTOYOU — Scraper La Vallée Village

Scrape automatiquement les produits de La Vallée Village (104 marques) et génère
un CSV compatible avec l'import Shopify.

## Quick start

```bash
npm install
npm run scrape
```

Le script lance un navigateur headless, parcourt chaque page marque, attend le
rendu JavaScript, extrait les produits (nom, image, prix si dispo) et génère
`lavallee-products-YYYY-MM-DD.csv`.

## Fichiers

| Fichier | Description |
|---|---|
| `index.mjs` | Scraper principal (Node.js + Puppeteer) |
| `bookmarklet.js` | Version lightweight à coller dans la console du navigateur |

## Format CSV

```
Vendor,Audience,Category,Title,Price,ComparePrice,DateVu,ImageUrl
"Gucci","femme","sac","GG Marmont small","1290","1980","2026-07-09","data:image/..."
```

Colonnes compatibles avec l'import Shopify standard.

## Limitations

- **Prix** : La Vallée Village n'affiche pas les prix sur son site. À remplir manuellement ou via une autre source.
- **Qualité images** : Le site sert des thumbnails base64. Pour des images HD, utiliser les photos prises en boutique.
- **Respect du site** : Le script attend 2s entre chaque marque. Ne pas réduire ce délai.

## Roadmap

- [ ] Nettoyage des titres (retirer les balises HTML résiduelles)
- [ ] Détection des prix via API externe
- [ ] Déploiement en cron (Render / Railway) pour scraping quotidien
- [ ] Push automatique vers l'API Shopify (Admin API `POST /products.json`)

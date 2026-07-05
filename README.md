# PARISTOYOU — Thème Shopify (Liquid, OS 2.0)

Thème natif Shopify du service personal shopper Paris → Turquie. **Hébergé par Shopify**
(Online Store), checkout natif, tout se gère dans l'admin.

## Installer sur la boutique `dw0m10-py`

1. Admin Shopify → **Canal Online Store → Themes** (Boutique en ligne → Thèmes)
2. **Add theme → Upload zip file** → sélectionner **`PARISTOYOU-THEME-v1.zip`** (dans ce dossier)
3. Une fois importé : **Customize** pour ajuster, puis **Publish**.

## Aperçu local (sans Shopify)

`index.html` à la racine = réplique statique de la home (mêmes CSS/JS). Il n'est **pas**
dans le zip. Servir le dossier (`python3 -m http.server`) pour le voir.

## Page « My List » (constructeur de liste de shopping)

Le client navigue sur le **site officiel de la marque** (nouvel onglet — pas d'iframe,
bloquée par les marques et assimilable à du phishing), **copie le lien** de l'article
et le colle dans sa liste avec taille/prix/qté. La page calcule sous-total,
**commission 20 % (min 300 €)**, livraison Colissimo (poids/zone), total, note douane
destination — puis **envoi WhatsApp** ou copie presse-papiers. Aucun minimum d'achat.
100 % côté navigateur (localStorage), aucun backend.

**Activation après upload** : Contenu → Pages → Add page → titre « My list » →
à droite, **Template : `page.wishlist`** → Save, puis ajouter la page au menu `main-menu`.
Réglages (taux, minima, WhatsApp, tarifs Colissimo) : Customize → réglages du thème
et réglages de la section (tout est éditable sans code).

Aperçu local : `liste.html` (hors zip).

## Catalogue & banderole en PRODUITS SHOPIFY RÉELS (mode recommandé)

Les sections « Brand catalog » (page Catalogue) et « Price ticker » (banderole home)
fonctionnent en **2 modes** : produits Shopify réels (prioritaire) ou saisie texte
(repli automatique tant qu'aucune collection n'est choisie/remplie).

**Convention produit** (le modèle de données du service) :
- **Vendor** = la marque (« Gucci ») · **Type** = la catégorie standard
  (chemise, pantalon, robe, chaussures, accessoires, lunettes de soleil, sac,
  sous-vêtements, pantoufle, basket, montre, téléphone, ordinateur, tablette,
  montre connectée, parfum)
- **Tags** = audience (`homme` / `femme` / `enfant` / `mixte`) + `phare`
  + **date de constatation** `vu:AAAA-MM-JJ`
- **Prix** = prix outlet constaté · **Prix comparé** = prix public Europe
  (→ le −% s'affiche automatiquement partout)
- **Photo** = ta photo prise en boutique

**Mise en service (10 min)** :
1. Admin → Produits → **Importer** → `products-import.csv` (à la racine de ce repo :
   16 produits de démarrage pré-remplis, images des 6 premiers via GitHub).
2. Admin → Produits → Collections → **Créer une collection** « Phares »
   (handle `phares`), type **automatisée** : condition *Tag égal à* `phare`.
3. C'est tout : les templates pointent déjà sur `phares` — la page Catalogue et
   la banderole basculent d'elles-mêmes sur les vrais produits (filtres marque/
   audience/catégorie alimentés par Vendor/tags/Type, fiches cliquables → achat).
4. À chaque relevé en boutique : nouveau produit (ou édition en masse) avec photo,
   prix, prix comparé et tag `vu:` à jour. La date affichée sert de repère de
   réactualisation et de source pour les posts réseaux sociaux.

## Après l'upload — 4 réglages dans l'admin

1. **Menus** (Contenu → Menus) : `main-menu` (Brands `#brands`, How it works `#how`,
   Pricing `#pricing`, FAQ `#faq`) et `footer` (Terms, Shipping, Contact).
2. **Réglages du thème** (Customize → roue dentée) : WhatsApp (sans +), Instagram,
   email, taux de commission — palette et polices modifiables ici aussi.
3. **Produits** : créer chaque article avec **Vendor = la marque** (« Gucci »).
   Les cartes de la section Brands pointent automatiquement vers
   `/collections/vendors?q=Marque` (collection auto par vendor, native Shopify).
   Prix TTC commission incluse (note affichée sur la fiche produit, éditable).
4. **Section Brands** : la liste des 106 enseignes est un réglage texte
   (une ligne = `Nom|lavallee ou valdeurope|star`) — modifiable sans code.

## Structure

```
assets/      base.css, theme.js
config/      settings_schema.json (réglages), settings_data.json
layout/      theme.liquid
locales/     en.default.json
sections/    header, footer, hero (filmstrip), offer, how-it-works (6 étapes),
             pricing (+ simulateur), brands (mur de logos animé), featured-brands, faq,
             contact-cta, main-product, main-collection, main-cart, main-page,
             main-404, main-search, main-blog, main-article, main-list-collections
snippets/    product-card.liquid
templates/   index, product, collection, cart, page, 404, search, blog, article,
             list-collections, password (JSON, OS 2.0)
```

## Notes

- Tarification affichée : commission 20 % (min 300 €), AUCUN minimum d'achat,
  simulateur de commission intégré (100 €→300 € · 1 500 €→300 € · 2 000 €→400 €)
  avec comparateur de voyage (billet A/R réglable au curseur, défaut 300 € + nuits
  d'hôtel × 150 €/nuit, défaut 3 → « You save X € vs un voyage à Paris »)
  et exemple concret du jean (Turquie 180 € / Europe 100 € / mon prix outlet 50–70 €),
  livraison Colissimo dès 35,19 €, douane du pays de destination à charge client.
- Positionnement : Europe & international (sans visa, sans frais de voyage,
  produits souvent 2 à 2,5× moins chers qu'au pays).
- Traductions TR/FR : ajouter `locales/tr.json` / `fr.json` + activer les langues
  dans Settings → Languages (à la demande).
- Le workspace « navigateur intégré + liste dynamique » de l'app React n'existe pas
  dans ce modèle thème : le parcours d'achat = produits Shopify (panier/checkout natifs).

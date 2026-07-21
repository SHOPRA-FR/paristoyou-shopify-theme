# TODO — Thème PARISTOYOU

Backlog des améliorations identifiées (audit 13/07/2026). Les corrections déjà
appliquées ce jour-là : balises Open Graph/Twitter + favicon + meta description
de repli (`snippets/meta-tags.liquid`, `layout/theme.liquid`), unification
commission 20 % / min 300 € (fiche produit + wishlist), clés de traduction
`customer.*` manquantes.

> Rappel de deux choix assumés (ne pas « corriger ») :
> - Le numéro WhatsApp est un placeholder tant qu'aucun numéro n'est attribué.
> - Les moyens de contact sont volontairement réservés aux comptes connectés
>   (anti-spam) — le numéro ne doit pas être exposé publiquement.

## 1. Langues TR / FR (cible Turquie & Europe)

- [ ] Committer les fichiers `locales/` (fr, tr, ar, zh-CN) — actuellement non suivis par git
- [ ] Activer les langues dans l'admin : Settings → Languages (+ Shopify Markets si tarification par zone)
- [ ] Ajouter un sélecteur de langue dans le header ou le footer (`localization` form Liquid)
- [ ] Traduire les contenus de sections via l'app **Translate & Adapt** (les réglages de sections ne se traduisent pas tout seuls — seuls les fichiers `locales/` couvrent les libellés du thème)
- [ ] Vérifier les `hreflang` générés une fois les langues publiées (aujourd'hui : aucun)

## 2. Footer & pages légales

- [x] **Footer refait** (15/07/2026) : multi-colonnes (marque + description, menu Explore, menu Legal, colonne Contact), barre du bas avec mentions légales (richtext) + icônes de paiement (`shop.enabled_payment_types`) + copyright. Responsive.
- [ ] **Créer les pages légales** : mentions légales, CGV, confidentialité, livraison/remboursement (obligatoire — service marchand FR). `templates/page.legal.json` existe. **Puis les ajouter au menu `footer`** (Contenu → Menus) → elles apparaîtront dans la colonne « Legal & info » du footer.
- [ ] Optionnel : bloc newsletter (capture email pour relances — utile tant que WhatsApp n'est pas ouvert aux visiteurs)

### Pricing (moins intimidant) — fait le 15/07/2026
- [x] **Home** : simulateur/calculatrice retiré → fee card « 20% » + « what's included » (checklist) + 3 exemples concrets (500→300, 1500→300, 3000→600) + copy chaleureuse. **Page** : simulateur gardé mais sliders de voyage retirés (`show_travel:false`), + même checklist/exemples. Gros « 20% » réduit en `clamp()` sur mobile, exemples en ligne sur mobile.

## 3. Preuve sociale (confiance = barrière n°1 du personal shopping)

- [ ] Nouvelle section `testimonials` : captures de conversations clientes (anonymisées), photos de colis / tickets de caisse des boutiques
- [ ] Compteur de confiance (« X commandes livrées », « depuis 20XX »)
- [ ] L'intégrer sur la home — bonne place : à la place de la section « lettres flottantes » ou juste après le simulateur de prix
- [ ] Plus tard : avis produits via app (Judge.me ou équivalent) quand il y aura du volume

## 4. Design — pistes discutées

### Home (ordre actuel : hero → service → étapes → this week → selection → tarifs → lettres → FAQ → contact)

> **Passe home du 15/07/2026** : ticker (barre noire, faux produits) retiré ; « This week » (`weekly-offers`) affiche les **derniers produits** (`sort: published_at | reverse`) ; « The selection » (`featured-brands`) affiche de **vrais produits** dans le carousel (fini les placeholders `sel-*.jpg`, désormais inutilisés dans `assets/`) ; CTA hero → `/collections/all` ; accent hero bordeaux → doré (`#b8944a`) ; « The service » revu (divider doré, 3 points de réassurance, layout centré sans placeholder, image gérable via `image_asset`). Les deux sections produits pointent par défaut sur *tous les produits* — créer une collection « Nouveautés » et une « Sélection » pour les différencier.

- [ ] **Hero sans image** : le CSS de la composition visuelle (`.hero-composition`, arche + collage) existe dans `base.css` mais n'est plus rendu par `sections/hero.liquid`. Réactiver avec de **vraies photos** (Paris, boutiques, colis) — l'authenticité vend mieux que le stock. (Prévu : 1 image « the service » — même méthode `image_asset` que le how-it-works)
- [x] **Resserrer** : `how-it-works` + `offer` (3 bulles « why ») fusionnés dans la nouvelle section scrollytelling `how-scroll` (13/07/2026).
- [x] **Images How-it-works gérées depuis le thème** (15/07/2026) : les 3 illustrations vivent dans `assets/how-1.jpg` (commande faite), `how-2.jpg` (trouvé), `how-3.jpg` (colis reçu), référencées via `image_asset` dans `how-scroll` (home) + `how-it-works-page` (page) + leurs templates. **Plus jamais de disparition à un update** (contrairement à `image_picker` dont la référence est écrasée dans les JSON au push). Pour changer une image : remplacer le fichier dans `assets/` (même nom), pousser. Illustrations paysage affichées en `object-fit:contain` sur fond cream → aucune découpe.
- [ ] **Remonter la marchandise** : la sélection produits arrive en 7ᵉ position. Ordre suggéré : hero → ticker → sélection → 3 étapes → tarifs/simulateur → preuve sociale → FAQ → contact
- [x] **`weekly-offers`** → reconverti en « This week » = derniers produits ajoutés (15/07/2026).
- [ ] **`floating-letters`** : décoratif, 2 emplacements d'images jamais remplis → remplacer par témoignages ou feed Instagram
- [x] **CTA du hero** → pointe désormais vers `/collections/all` (15/07/2026). (Reste discutable : un CTA « Fais ta liste » servirait mieux le tunnel compte → My List → WhatsApp.)
- [ ] **Accent couleur checkout** : le bouton checkout est vert (`color_accent` #12b886) dans une DA beige/or → aligner sur l'or #b8944a ou brancher réellement `--accent`. (Note : l'accent du hero est déjà passé bordeaux → or.)
- [ ] Nettoyer `assets/sel-*.jpg` (6 images) + `products-import.csv` de démo, plus utilisés depuis que Selection tire de vrais produits
- [ ] Réglages fantômes : `font_heading`/`font_body` (font_picker) ne sont jamais utilisés (Playfair/Inter en dur) → brancher ou supprimer du schema

### Navigation & pages

- [x] **Header refait en 2 étages** (15/07/2026) : Amir veut garder les 9 entrées. Ligne 1 = logo centré + compte/panier à droite (burger à gauche en mobile) ; ligne 2 = barre de nav dédiée, tous les liens centrés au calme, souligné doré au survol + lien actif. Sous ~1024px → burger + menu déroulant (compte inclus). Aperçu : `open /tmp/preview-header.html`.
- [ ] Nav : idéalement resserrer à terme (Home redondant avec le logo), mais gardée à 9 par choix d'Amir
- [ ] **« Sign Up » pointe vers `/pages/profil`** → pointer vers `/account/register` (`routes.account_register_url`), ou en faire un bouton distinct plutôt qu'un item de menu
- [x] **Remplacer « Selection » par la liste des marques** : section `brand-directory` + template `page.brands` créés (13/07/2026) avec les 127 enseignes du CSV (89 La Vallée Village / 38 Val d'Europe), recherche + filtre par centre. Reste côté admin : affecter le template `page.brands` à la page (ou en créer une nouvelle « Brands ») et mettre à jour l'entrée du menu
- [x] **Logos des marques** : chaque carte affiche le logo réel (favicon HD Google/DuckDuckGo, vérifié un par un au build), fallback initiales stylisées. 7 marques en initiales (aucun logo exposé publiquement : Anne Fontaine, Berenice, Jacquemus, Mauboussin, Montblanc, Tommy Hilfiger, ZEGNA). Liens forcés en `www.` là où le domaine nu ne répond pas (Gucci, Fendi, Versace…). Clearbit (vrais logos vectoriels) est mort depuis le rachat HubSpot — seuls les favicons restent.
- [x] **Filtre luxe** (13/07/2026) : liste ramenée de 127 → **97 marques**. Retirés d'office la fast-fashion / budget (Primark, Zara, H&M, Mango, Uniqlo, Desigual, Bershka, Pull&Bear, Stradivarius, Springfield, GEOX, Skechers, Havaianas, Cabaïa, Parfois, Tezenis, JOTT, Guess, KIKO, NYX), la beauté grand public (Sephora, MAC, LUSH, Rituals, Yves Rocher), le bijou accessible (Swarovski, Pandora) et Victoria's Secret. Gardés : luxe + casual premium/heritage (Lacoste, Levi's, UGG, Birkenstock, Calvin Klein…) + sportswear désirable (Nike, adidas, lululemon, On, VEJA…). Doublons Lacoste/Levi's fusionnés.
  - **Format compact** `Nom|mall|host|logo` : logo vide = favicon Google auto, `-` = initiales, une URL = logo explicite (prioritaire). Default = 4165 car. (< limite Shopify 5000).
  - Régénérer après édition de `scraper/brands.csv` : `python3 scraper/build-brand-directory.py --inject` (filtre luxe dans la constante `EXCLUDE` du script).
  - Aperçu local (hors navigateur intégré, bloqué par le conflit deepseek) : `open /tmp/preview-brands.html`.
- [ ] **Ajouter une page « Livraison & douanes »** : LA question n°1 en achat cross-border (délais, tarifs Colissimo par poids, douane ~20 % à destination, suivi). Aujourd'hui l'info est éparpillée entre FAQ, pricing et notes produit
- [ ] Page FAQ dédiée (SEO + lien rapide à envoyer sur WhatsApp) ; la section FAQ de la home reste en résumé de 3-4 questions

## 5. Backlog technique (plus tard)

- [x] **Page catalogue (`/collections/all`) refaite** (15/07/2026) : elle utilisait des `.sel-card` nus (aucun style hors carousel → « dégueulasse ») ; bascule sur le vrai composant `.product-card` (cadre, hover avec zoom image + ombre, prix en Playfair, badge remise −%, badge sold-out — ces badges n'avaient aucun CSS). Ajout du CSS manquant `.pagination` / `.empty-state`, toolbar recherche + compteur. Réglages de la section ajoutés (kicker, placeholder, labels). Aperçu : `open /tmp/preview-catalog.html`.
- [x] **Filtres du catalogue** (15/07/2026) : marque, audience (femme/homme/enfant/mixte), type, + tri (prix ↑/↓, plus grosse remise) + recherche + reset. 100 % côté client (theme.js, bloc `CollGrid`), selects marque/type auto-remplis depuis les produits. Les data-* de filtre sont calculés dans le snippet `product-card` (`data-brand`=Vendor, `data-aud`=tag, `data-type`=Type, `data-price`, `data-disc`). Chargement `paginate by 50` (les filtres couvrent jusqu'à 50 produits par page).
  - ⚠️ **ACTION DONNÉES (Amir)** : les filtres se remplissent depuis les champs produit, or les 14 produits en ligne ont tous `Vendor = "PARIS TO YOU"`, **aucun Type**, **aucun tag d'audience** → filtres vides tant que ce n'est pas corrigé. À faire dans l'admin (ou par import CSV / édition en masse) : **Vendor = la marque** (Gucci, Moncler…), **Type = la catégorie** (sac, chaussures, chemise…), **Tag** `homme`/`femme`/`enfant`/`mixte`. (Modèle déjà décrit dans le README.)
  - Si le catalogue dépasse ~50 produits : passer aux filtres natifs Shopify (Search & Discovery) car le client-side ne voit qu'une page.
- [x] `srcset`/`sizes` sur les **cartes** produit (snippet `product-card`) — fait le 15/07/2026. Reste la **fiche** produit (`main-product.liquid`, image principale encore en largeur fixe).
- [ ] Ruban de marques : ~140 `<img>` de favicons Google (35 marques × 4 boucles, requêtes tierces) → logos auto-hébergés ou texte seul
- [ ] JSON-LD (`Product`, `Organization`) pour les rich snippets Google
- [ ] Panier : label « Update » en dur (non traduit) + auto-submit au changement de quantité ; textes en dur aussi dans `main-collection.liquid` (« Search in this collection… », « products »)
- [ ] Fiche produit : afficher la date « vu le » (tag `vu:AAAA-MM-JJ` déjà exploité par le ticker)
- [ ] Accessibilité : marquee `aria-hidden="true"` avec liens focusables ; le carousel JS auto-avance sans respecter `prefers-reduced-motion` (le burger a désormais `aria-expanded`, fait le 15/07/2026)
- [ ] Hygiène git : committer les modifs en attente + fichiers non suivis (locales, sections about/legal/how-it-works-page) — le thème live (t/5) et le repo divergent

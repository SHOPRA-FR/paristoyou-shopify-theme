#!/usr/bin/env python3
"""
Génère la liste par défaut de la section `brand-directory` à partir de brands.csv.

- Filtre LUXE : ne garde que les marques luxe / premium-accessible / sportswear
  désirable (voir KEEP_EXTRA + exclusion EXCLUDE). La fast-fashion et le budget
  (Primark, Zara, H&M, Mango, Uniqlo…) sont retirés.
- Pour chaque marque : host joignable pour le lien (domaine nu, ou www. si le nu
  ne répond pas) + meilleure source de logo VÉRIFIÉE sur ce host.

Format de sortie compact `Nom|mall|host|logo` où logo vaut :
    ""          → favicon Google reconstruit en Liquid : .../favicons?domain=HOST&sz=128
    "-"         → aucun logo fiable → initiales stylisées
    "https://…" → URL explicite (source non-Google vérifiée, ou override manuel)

Usage :
    python3 scraper/build-brand-directory.py            # imprime la liste
    python3 scraper/build-brand-directory.py --inject   # réécrit le default de la section
"""
import csv, sys, re, json, ssl, concurrent.futures, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "scraper" / "brands.csv"
SECTION = ROOT / "sections" / "brand-directory.liquid"
HERO = ROOT / "sections" / "hero.liquid"
MALL = {"La Vallée Village": "lavallee", "Val d'Europe": "valdeurope"}

# --- Filtre luxe -----------------------------------------------------------
# Marques explicitement RETIRÉES (fast-fashion, budget, mass-market, beauté de
# masse et bijou accessible écartés par choix de positionnement).
EXCLUDE = {
    "Bershka", "Cabaïa", "Desigual", "GEOX", "Guess", "H&M", "Havaianas", "JOTT",
    "KIKO Cosmetics", "Mango", "NYX Cosmetics", "Parfois", "Primark", "Pull & Bear",
    "SKECHERS", "Springfield", "Stradivarius", "Tezenis", "Uniqlo", "Zara",
    "Swarovski", "Pandora",
    "Sephora", "MAC Cosmetics", "LUSH", "Rituals", "Yves Rocher",
    "Victoria's Secret",
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
UA = {"User-Agent": "Mozilla/5.0"}


def _get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=12, context=ctx)
        return r.status, r.read(), r.headers.get("Content-Type", "").split(";")[0]
    except Exception:
        return 0, b"", ""


def _is_image(status, data, ct):
    return status == 200 and len(data) > 600 and (
        ct.startswith("image") or data[:4] in (b"\x89PNG", b"\x00\x00\x01\x00", b"GIF8") or data[:2] == b"\xff\xd8"
    )


def _reachable(host):
    for method in ("HEAD", "GET"):
        try:
            urllib.request.urlopen(urllib.request.Request("https://" + host, method=method, headers=UA), timeout=10, context=ctx)
            return True
        except urllib.error.HTTPError:
            return True  # répond (même 4xx) = joignable
        except Exception:
            continue
    return False


def _google(host):
    return f"https://www.google.com/s2/favicons?domain={host}&sz=128"


def _logo_ok(url):
    return _is_image(*_get(url))


def _logo(host, alt):
    """'' si favicon Google OK sur host (reconstruit en Liquid) ; sinon URL
    explicite d'une source vérifiée (Google/DDG/direct sur host ou alt) ; sinon '-'."""
    if _logo_ok(_google(host)):
        return ""
    for h in (host, alt):
        for url in (_google(h), f"https://icons.duckduckgo.com/ip3/{h}.ico", f"https://{h}/favicon.ico"):
            if _logo_ok(url):
                return url
    return "-"


def build_row(row):
    name = row["marque"].strip()
    mall = MALL.get(row["centre_commercial"].strip(), "lavallee")
    bare = (row["site"] or "").strip().replace("https://", "").replace("http://", "").rstrip("/")
    if bare.startswith("www."):
        bare = bare[4:]
    host = bare if _reachable(bare) else "www." + bare
    alt = ("www." + bare) if host == bare else bare
    return name, mall, host, _logo(host, alt)


def main():
    rows = [r for r in csv.DictReader(open(CSV)) if r["marque"].strip() not in EXCLUDE]
    # Dédoublonnage par marque (certaines sont dans les deux centres) : on garde
    # l'entrée La Vallée Village (cadrage luxe).
    seen = {}
    for r in rows:
        name = r["marque"].strip()
        if name not in seen or r["centre_commercial"].strip() == "La Vallée Village":
            seen[name] = r
    rows = list(seen.values())
    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as ex:
        built = list(ex.map(build_row, rows))
    built.sort(key=lambda e: e[0].lower())
    blob = "\n".join(f"{n}|{m}|{h}|{l}" for n, m, h, l in built)

    have = sum(1 for b in built if b[3] != "-")
    sys.stderr.write(f"{len(built)} marques gardées · logo: {have} · initiales: {len(built)-have} · default: {len(blob)} car.\n")
    sys.stderr.write("initiales: " + ", ".join(n for n, m, h, l in built if l == "-") + "\n")

    if "--inject" in sys.argv:
        # Page Brands (Nom|mall|host|logo)
        src = SECTION.read_text()
        pattern = re.compile(r'("id":\s*"brands".*?"default":\s*)"(?:[^"\\]|\\.)*"', re.S)
        new, n = pattern.subn(lambda mm: mm.group(1) + json.dumps(blob, ensure_ascii=False), src)
        assert n == 1, f"expected 1 replacement, got {n}"
        SECTION.write_text(new)
        sys.stderr.write(f"→ injecté dans {SECTION.relative_to(ROOT)}\n")

        # Ruban du hero (Nom|host|logo, même source → reste synchronisé)
        hero_blob = "\n".join(f"{name}|{host}|{logo}" for name, mall, host, logo in built)
        hsrc = HERO.read_text()
        hpat = re.compile(r'("id":\s*"brands_list".*?"default":\s*)"(?:[^"\\]|\\.)*"', re.S)
        hnew, hn = hpat.subn(lambda mm: mm.group(1) + json.dumps(hero_blob, ensure_ascii=False), hsrc)
        assert hn == 1, f"hero: expected 1 replacement, got {hn}"
        HERO.write_text(hnew)
        sys.stderr.write(f"→ ruban hero synchronisé ({HERO.relative_to(ROOT)})\n")
    else:
        print(blob)


if __name__ == "__main__":
    main()

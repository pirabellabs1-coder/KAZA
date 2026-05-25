# Icons KAZA (PWA)

Icones de l'application progressive web (PWA) KAZA.

## Fichiers

- `icon-192.svg` : 192x192, fond Navy `#1A3A52`, lettre "K" blanche, toit de maison schematique. Reference dans `manifest.json` (`sizes: "192x192"`).
- `icon-512.svg` : 512x512, meme charte, version haute resolution pour ecrans d'accueil iOS/Android et splash screens.

## Compatibilite

| Plateforme       | Format recommande |
| ---------------- | ----------------- |
| Chrome / Edge    | SVG (OK)          |
| Firefox          | SVG (OK)          |
| Android (Chrome) | SVG ou PNG        |
| iOS Safari       | PNG (preferable)  |

Le SVG est suffisant pour le MVP web. Pour distribuer sur stores ou eviter tout probleme iOS, generer des PNG.

## Conversion SVG -> PNG

Sans installer de dependance npm :

```bash
# Option 1 : svgexport (CLI Node.js, npx)
npx svgexport icon-192.svg icon-192.png 192:192
npx svgexport icon-512.svg icon-512.png 512:512

# Option 2 : ImageMagick (si installe)
magick convert -background none icon-192.svg -resize 192x192 icon-192.png
magick convert -background none icon-512.svg -resize 512x512 icon-512.png

# Option 3 : Inkscape (si installe)
inkscape icon-512.svg --export-type=png --export-filename=icon-512.png -w 512 -h 512
```

## Mise a jour du manifest

Apres generation des PNG, mettre a jour `public/manifest.json` :

```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

## Charte graphique

- Fond : Navy Blue `#1A3A52`
- Symbole : Toit de maison + lettre "K" blanche
- Coins arrondis : `rx=32` (192px) / `rx=88` (512px) pour respecter les guidelines iOS/Android.

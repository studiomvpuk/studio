# Project screenshots

Drop your real site screenshots into the matching project folder here. Filenames
are flexible — once files are in, the data module (`app/(site)/projects.ts`) is
pointed at them and they're picked up by the R2 sync script
(`npm run images:r2`), which uploads everything under `public/work/**`.

## Folders (one per project)

```
public/work/letsgohalf/
public/work/usa-errands/
public/work/pirate/
public/work/sendreach/
public/work/nuhr-studio/
public/work/nimi-events/
public/work/tiara-shades/
public/work/the-colour-studio/
public/work/glamour-clinic/
```

## Suggested filenames (per folder)

| File            | Used for                                              |
| --------------- | ----------------------------------------------------- |
| `hero.jpg`      | Detail-page hero **and** the showcase background      |
| `shot-1.jpg`    | Showcase mockup (front) — e.g. a desktop section      |
| `shot-2.jpg`    | Showcase mockup (back) — e.g. a mobile view           |
| `gallery-1.jpg` | Case-study gallery (full-bleed)                       |
| `gallery-2.jpg` | Case-study gallery (pairs side-by-side)               |
| `gallery-3.jpg` | Case-study gallery                                    |

Notes:

- `hero.jpg` is the only one really worth having for every project; the rest are
  optional and I'll adapt the layout to whatever you provide.
- `.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` are all fine.
- Wide/landscape shots work best for `hero`; the gallery handles any aspect ratio.
- When you've added files, tell me and I'll wire each project to its real captures
  (keeping the current stock imagery as a fallback for anything you skip).

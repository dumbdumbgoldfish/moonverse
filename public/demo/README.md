# Demo profile images (avatars & banners)

Place **local** avatar and banner images here for the demo user profile refresh.

## Supported formats

- `.png` (recommended)
- `.jpg` / `.jpeg`
- `.webp`
- `.svg` (fallback only — used when no raster images exist)

## Folders

- `public/demo/avatars/` — square character portraits (1:1), webtoon/manhwa style
- `public/demo/banners/` — landscape profile covers that are cropped responsively by the UI

## Adding your own images

1. Save images you have rights to use (official art you licensed, commissions, or AI-generated originals).
2. **Do not** commit copyrighted webtoon panels scraped from Google unless you own the rights.
3. Drop files into the folders above (any filename; sorted alphabetically).
4. Re-apply to users:

```bash
npm run demo:refresh:user-profiles -- --images-only --confirm
```

`--images-only` updates avatars and banners only; display names stay as-is.

## Bundled webtoon-style set

The bundled `avatar-webtoon-*.png` and `banner-webtoon-*.png` files are original, project-specific AI-generated demo artwork created for MoonVerse in August 2026.

They were not copied from webtoon panels, image-search results, or existing character artwork, and they are not intended to depict recognisable copyrighted characters. They are included as non-commercial academic/demo assets.

For commercial deployment, replace these files if different provenance or licensing requirements apply.

To expand the pool, add more PNGs and re-run the refresh command.

## Image optimisation

Resize and recompress the bundled PNGs without renaming files or changing URL paths:

```bash
npm run demo:images:optimize
npm run demo:images:optimize -- --write
```

- Dry-run (`npm run demo:images:optimize`) reports projected sizes and writes nothing.
- Write mode (`npm run demo:images:optimize -- --write`) replaces files only after every PNG has been validated in memory.
- PNG filenames and URL paths are preserved.
- Bundled avatars are limited to 512×512.
- Bundled banners are limited to 1024×683.
- SVG fallback assets are not modified.

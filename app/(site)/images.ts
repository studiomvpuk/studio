// Image source layer.
//
// Every showcase/case-study image is an Unsplash photo (the same assets the
// live client sites serve). To move them onto Cloudflare R2:
//   1. Set NEXT_PUBLIC_ASSET_BASE_URL in .env.local to your bucket's public
//      base URL (e.g. https://pub-xxxx.r2.dev  or  https://assets.studiomvp.co.uk).
//   2. Run `node scripts/sync-images-to-r2.mjs <bucket-name>` to upload them.
//
// When the env var is set, images resolve to `${BASE}/work/<id>-w<width>.jpg`
// in your bucket. When it is not set, they fall back to the original Unsplash
// URL, so the site keeps working before/while the bucket is being populated.

const BASE = (process.env.NEXT_PUBLIC_ASSET_BASE_URL || "").replace(/\/+$/, "");

/** Stable R2 object key for a given Unsplash photo id + render width. */
export const keyFor = (id: string, w: number) => `work/${id}-w${w}.jpg`;

/** Original Unsplash source URL (forced to jpeg so bytes match the .jpg key). */
export const sourceFor = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?fit=crop&w=${w}&q=80&fm=jpg`;

/** Resolve an image: R2 when configured, otherwise the original source. */
export const img = (id: string, w: number) =>
  BASE ? `${BASE}/${keyFor(id, w)}` : sourceFor(id, w);

/**
 * Resolve a self-hosted screenshot/asset that lives under /public.
 * e.g. local("/work/tiara-shades/hero.jpg") → served from /public in dev,
 * and from `${BASE}/work/tiara-shades/hero.jpg` on R2 in production.
 * The sync script uploads everything under public/work to the matching key.
 */
export const local = (path: string) => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return BASE ? `${BASE}${clean}` : clean;
};

/** True when images are being served from R2 (env var configured). */
export const usingR2 = () => Boolean(BASE);

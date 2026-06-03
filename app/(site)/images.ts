// Image source layer.
//
// Case-study product mockups, heroes and galleries are real screenshots of the
// live sites, committed under public/work/<slug>/… and served straight from
// /public. Atmospheric showcase backgrounds use Unsplash stock.

/** Unsplash stock image — used for showcase backgrounds and occasional fills. */
export const img = (id: string, w = 2000) =>
  `https://images.unsplash.com/photo-${id}?fit=crop&w=${w}&q=80&fm=jpg`;

/** A self-hosted asset under /public, e.g. local("/work/tiara-shades/hero.jpg"). */
export const local = (path: string) => (path.startsWith("/") ? path : `/${path}`);

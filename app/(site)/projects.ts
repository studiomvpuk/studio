// Single source of truth for project/case-study data.
// Used by the home/work Showcase, the Work filter list, and the
// /work/[slug] detail pages so everything stays in sync.
//
// Product mockups, case-study heroes and galleries use real screenshots of the
// live sites (public/work/<slug>/…), served straight from /public. Showcase
// backgrounds stay atmospheric (Unsplash stock) for legibility behind the white
// project name. Where a real screenshot is missing for a slot, a stock image is
// used as a graceful fallback.
import { img, local } from "./images";
const U = (id: string, w = 2000) => img(id, w);
const P = (id: string) => img(id, 900);

// A gallery row holds one image (full-bleed) or two images (side-by-side pair).
export type GalleryRow = { images: string[]; alt?: string };

export type Project = {
  slug: string;
  name: string;
  /** Live site URL. */
  liveUrl: string;
  /** Short line used on the showcase stage. */
  desc: string;
  /** Discipline label on the showcase stage, e.g. "Web · Brand". */
  disc: string;
  /** Showcase background image (atmospheric). Currently unused — the showcase
   *  renders on a flat dark canvas so only real screenshots show. */
  bg: string;
  /** Real screenshots from public/work/<slug> for the showcase stage.
   *  1 → a single framed card, 2 → a stacked pair. Stock is never used here. */
  shots: string[];
  /** Detail-page header fields (MetaLab-style). */
  projectType: string;
  stage: string;
  deliverables: string;
  /** Detail-page intro paragraph. */
  intro: string;
  /** Detail-page hero image (large). */
  hero: string;
  /** Detail-page gallery, top to bottom. */
  gallery: GalleryRow[];
  /** Categories for the Work filter list. */
  cats: string[];
  /** Showcase device frame. "browser" (default) suits landscape web screenshots;
   *  "phone" suits portrait mobile screenshots (≈9:19.5). */
  frame?: "browser" | "phone";
};

export const projects: Project[] = [
  {
    slug: "letsgohalf",
    name: "LetsGoHalf",
    liveUrl: "https://www.letsgohalf.com/",
    desc: "A social payments app that helps people split and match the cost of anything — roommates, subscriptions, carpools and more.",
    disc: "Product Design · iOS Engineering",
    bg: U("1451187580459-43490279c0fa"),
    shots: [local("/work/letsgohalf/shot-1.jpg"), local("/work/letsgohalf/shot-2.jpg")],
    projectType: "Full Build",
    stage: "Startup",
    deliverables: "Product Design, iOS Engineering",
    intro:
      "LetsGoHalf makes sharing costs feel effortless. We shaped a social payments experience where people find the right match to split bills, rent, subscriptions and journeys — turning an awkward money conversation into a few taps.",
    hero: local("/work/letsgohalf/hero.jpg"),
    gallery: [
      { images: [local("/work/letsgohalf/gallery-1.jpg")] },
      { images: [local("/work/letsgohalf/shot-1.jpg"), local("/work/letsgohalf/shot-2.jpg")] },
    ],
    cats: ["fintech", "ios"],
    // LetsGoHalf is an iOS app. Its current shots are landscape, so it stays on
    // the browser frame for now — add portrait phone screenshots (≈9:19.5) to
    // public/work/letsgohalf and switch this to "phone" to use the phone mockup.
    frame: "browser",
  },
  {
    slug: "usa-errands",
    name: "USA Errands",
    liveUrl: "https://www.myusaerrands.com/",
    desc: "U.S. logistics infrastructure for international sellers — hold inventory stateside and ship every order locally, no U.S. business required.",
    disc: "Product Design · Web App",
    bg: U("1556742049-0cfed4f6a45d"),
    // only a hero screenshot exists so far; add shot-1.jpg/shot-2.jpg for a stacked pair
    shots: [local("/work/usa-errands/hero.jpg")], // was [..., P("1521791136064-7986c2920216")]
    projectType: "Full Build",
    stage: "Startup",
    deliverables: "Product Design, Web App, Engineering",
    intro:
      "USA Errands gives sellers anywhere a foothold in American retail. We designed a single platform that unifies warehousing, fulfilment and a personal-shopper desk — one warehouse, one ledger, one checkout — so international sellers can reach U.S. customers without setting up a local entity.",
    hero: local("/work/usa-errands/hero.jpg"),
    gallery: [
      { images: [P("1460925895917-afdab827c52f")] },
      { images: [P("1521791136064-7986c2920216"), P("1552664730-d307ca884978")] },
    ],
    cats: ["web"],
  },
  {
    slug: "pirate",
    name: "Pirate",
    liveUrl: "https://pirate-psi.vercel.app/",
    desc: "24/7 self-service studios for musicians, podcasters and dancers — book online, let yourself in, and create.",
    disc: "Brand · Web · Booking",
    bg: U("1513829596324-4bb2800c5efb"),
    shots: [local("/work/pirate/shot-1.jpg"), local("/work/pirate/shot-2.jpg")],
    projectType: "Brand & Web",
    stage: "Concept",
    deliverables: "Brand, Web Design, Engineering",
    intro:
      "Pirate reimagines the creative studio as something you can book in under a minute and unlock from your phone, any hour of the day. We built the brand and booking experience for a network of soundproofed DJ, recording, rehearsal, podcast and dance rooms across the UK, US and Germany.",
    hero: local("/work/pirate/hero.jpg"),
    gallery: [
      { images: [local("/work/pirate/shot-1.jpg")] },
      { images: [local("/work/pirate/shot-2.jpg"), P("1516223725307-6f76b9ec8742")] },
    ],
    cats: ["web"],
  },
  {
    slug: "sendreach",
    name: "SendReach",
    liveUrl: "https://sendreach.app/",
    desc: "An influencer marketing platform that connects businesses with creators who deliver — campaigns, payouts and analytics in one place.",
    disc: "Product Design · Web Platform",
    bg: U("1611432579699-484f7990b127"),
    shots: [local("/work/sendreach/shot-1.jpg"), local("/work/sendreach/shot-2.jpg")],
    projectType: "Full Build",
    stage: "Startup",
    deliverables: "Product Design, Web App, Engineering",
    intro:
      "SendReach cuts the agencies and middlemen out of influencer marketing. We designed and built a two-sided platform where businesses launch campaigns and verified creators apply — with real-time analytics, fraud prevention and multi-currency payouts handled end to end.",
    hero: local("/work/sendreach/hero.jpg"),
    gallery: [
      { images: [local("/work/sendreach/gallery-1.jpg")] },
      { images: [local("/work/sendreach/shot-1.jpg"), local("/work/sendreach/shot-2.jpg")] },
    ],
    cats: ["web"],
  },
  {
    slug: "oraql",
    name: "OraQL",
    liveUrl: "https://ora-ql.vercel.app/",
    desc: "Probability-driven sports-betting intelligence — ranked picks, transparent reasoning and multi-match strategy building.",
    disc: "Product Design · Web App",
    bg: U("1460925895917-afdab827c52f"),
    // only a hero screenshot exists so far; add shot-1.jpg/shot-2.jpg for a stacked pair
    shots: [local("/work/oraql/hero.jpg")], // was [..., P("1551288049-bebda4e38f71")]
    projectType: "Full Build",
    stage: "Startup",
    deliverables: "Product Design, Web App, Engineering",
    intro:
      "OraQL turns raw match data into betting decisions you can actually reason about. We designed and built a probability engine and interface that ingests fixtures, stats and odds, computes Poisson-based market probabilities with recency and injury weighting, and surfaces value bets — each with a plain-language explanation of why.",
    hero: local("/work/oraql/hero.jpg"),
    gallery: [
      { images: [P("1460925895917-afdab827c52f")] },
      { images: [P("1551288049-bebda4e38f71"), P("1556742049-0cfed4f6a45d")] },
    ],
    cats: ["web"],
  },
  {
    slug: "nuhr-studio",
    name: "Nuhr Studio",
    liveUrl: "https://nuhrstudio.vercel.app/",
    desc: "Bradford's first dedicated content studio and event space — light-filled, beautifully styled, and ready to book.",
    disc: "Web · Brand",
    bg: U("1631679706909-1844bbd07221"),
    shots: [local("/work/nuhr-studio/shot-1.jpg"), local("/work/nuhr-studio/shot-2.jpg")],
    projectType: "Brand & Web",
    stage: "Launch",
    deliverables: "Brand, Web Design",
    intro:
      "Nuhr Studio is Bradford's first dedicated content studio and event space. We crafted a brand and site as calm and considered as the room itself — a light-filled space for content shoots, intimate events and brand moments, with booking that's as simple as a message.",
    hero: local("/work/nuhr-studio/hero.jpg"),
    gallery: [
      { images: [local("/work/nuhr-studio/gallery-1.jpg")] },
      { images: [local("/work/nuhr-studio/shot-1.jpg"), local("/work/nuhr-studio/shot-2.jpg")] },
    ],
    cats: ["web"],
  },
  {
    slug: "nimi-events",
    name: "Nimi Events",
    liveUrl: "https://www.nimievents.com/",
    desc: "Authentically African catering, considered event planning and gifting — where good food gathers.",
    disc: "Web · Brand · E-commerce",
    bg: U("1519225421980-715cb0215aed"),
    shots: [local("/work/nimi-events/shot-1.jpg"), local("/work/nimi-events/shot-2.jpg")],
    projectType: "Brand & Web",
    stage: "Established",
    deliverables: "Brand, Web Design, E-commerce",
    intro:
      "Nimi Events is a family kitchen scaled with care. We built a brand and online home for their four services — catering, event planning, gifting and content — plus the Nimi Indulgence Club, bringing authentically African flavours and considered hospitality together under one standard.",
    hero: local("/work/nimi-events/hero.jpg"),
    gallery: [
      { images: [local("/work/nimi-events/shot-1.jpg")] },
      { images: [local("/work/nimi-events/shot-2.jpg"), P("1493809842364-78817add7ffb")] },
    ],
    cats: ["web"],
  },
  {
    slug: "tiara-shades",
    name: "Tiara Shades",
    liveUrl: "https://tiara-eta.vercel.app/",
    desc: "A boutique hair & beauty salon by Nesrin — refined craft in a calm, luxurious New Islington setting.",
    disc: "Web · Brand",
    bg: U("1633681926022-84c23e8cb2d6"),
    // only a hero screenshot exists so far; add shot-1.jpg/shot-2.jpg for a stacked pair
    shots: [local("/work/tiara-shades/hero.jpg")], // was [..., P("1502323777036-f29e3972d82f")]
    projectType: "Brand & Web",
    stage: "Launch",
    deliverables: "Brand, Web Design",
    intro:
      "Tiara Shades is a boutique hair and beauty salon led by Nesrin in the heart of New Islington, Manchester. We translated her belief that 'your beauty is worth my time' into a calm, luxurious site — showcasing cutting, colour, brows, makeup and more, with booking a WhatsApp message away.",
    hero: local("/work/tiara-shades/hero.jpg"),
    gallery: [
      { images: [P("1633681926022-84c23e8cb2d6")] },
      { images: [P("1488426862026-3ee34a7d66df"), P("1487412947147-5cebf100ffc2")] },
    ],
    cats: ["beauty", "web"],
  },
  {
    slug: "the-colour-studio",
    name: "The Colour Studio",
    liveUrl: "https://colourstudio.vercel.app/",
    desc: "Manchester's home of colour & glamour — hair, makeup, brows, nails, facials and more, in one Prestwich studio.",
    disc: "Web · Brand",
    bg: U("1500917293891-ef795e70e1f6"),
    // no screenshots in public/work/the-colour-studio yet — add hero.jpg (+ shot-1/shot-2)
    // and it will appear in the showcase. Was [P("1560869713-..."), P("1604654894610-...")].
    shots: [],
    projectType: "Brand & Web",
    stage: "Established",
    deliverables: "Brand, Web Design",
    intro:
      "The Colour Studio brings hair, makeup and beauty together under one roof in Prestwich. We designed a warm, modern site that captures the studio's love of colour and transformation — every service, from balayage to bridal glam, presented with the calm and care of its private room.",
    hero: U("1500917293891-ef795e70e1f6", 2500),
    gallery: [
      { images: [P("1633681926022-84c23e8cb2d6")] },
      { images: [P("1488426862026-3ee34a7d66df"), P("1487412947147-5cebf100ffc2")] },
      { images: [P("1595476108010-b4d1f102b1b1")] },
    ],
    cats: ["beauty", "web"],
  },
  {
    slug: "glamour-clinic",
    name: "Glamour Skin & Laser",
    liveUrl: "https://glamour-nine.vercel.app/",
    desc: "A luxury skin & laser clinic in Prestwich — facials, laser, aesthetics and massage in a calm, beautiful space.",
    disc: "Web · Brand",
    bg: U("1596755389378-c31d21fd1273"),
    shots: [local("/work/glamour-clinic/shot-1.jpg"), local("/work/glamour-clinic/hero.jpg")],
    projectType: "Brand & Web",
    stage: "Established",
    deliverables: "Brand, Web Design",
    intro:
      "Glamour Skin & Laser Clinic is a luxury sanctuary in Prestwich, Manchester. We built an elegant, trustworthy site for a clinic offering advanced facials, laser, aesthetics, PRP and massage — pairing premium visuals with clear treatment information to guide visitors from curiosity to booking.",
    hero: local("/work/glamour-clinic/hero.jpg"),
    gallery: [
      { images: [P("1556228453-efd6c1ff04f6")] },
      { images: [P("1629909613654-28e377c37b09"), P("1519823551278-64ac92734fb1")] },
      { images: [P("1505944270255-72b8c68c6a70")] },
    ],
    cats: ["beauty", "health", "web"],
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);

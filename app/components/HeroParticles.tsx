// "use client";

// import { useEffect, useRef } from "react";

// /**
//  * Hero motion — concept #3: thousands of fine dots scatter in dark space,
//  * converge to form the silhouette of an app/phone screen, hold + breathe,
//  * then disperse and loop. Pure canvas: light, crisp, no video asset.
//  */

// // Rounded-rect path helper (works without ctx.roundRect support).
// function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
//   const k = Math.min(r, w / 2, h / 2);
//   ctx.beginPath();
//   ctx.moveTo(x + k, y);
//   ctx.arcTo(x + w, y, x + w, y + h, k);
//   ctx.arcTo(x + w, y + h, x, y + h, k);
//   ctx.arcTo(x, y + h, x, y, k);
//   ctx.arcTo(x, y, x + w, y, k);
//   ctx.closePath();
// }

// type P = { hx: number; hy: number; tx: number; ty: number; s: number; ph: number };

// export default function HeroParticles() {
//   const ref = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = ref.current;
//     const ctx = canvas?.getContext("2d");
//     if (!canvas || !ctx) return;

//     const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
//     let particles: P[] = [];
//     let raf = 0;
//     let start = performance.now();

//     // Sample points from an offscreen render of an app/phone silhouette.
//     function shapePoints(): { x: number; y: number }[] {
//       const ow = 420, oh = 560;
//       const off = document.createElement("canvas");
//       off.width = ow; off.height = oh;
//       const o = off.getContext("2d");
//       if (!o) return [];
//       o.fillStyle = "#fff";

//       const pad = 22;
//       rr(o, pad, pad, ow - pad * 2, oh - pad * 2, 56); o.fill(); // device body
//       // cut the screen out, then paint UI elements inside it
//       o.globalCompositeOperation = "destination-out";
//       rr(o, pad + 16, pad + 60, ow - (pad + 16) * 2, oh - (pad + 60) - (pad + 54), 30); o.fill();
//       o.globalCompositeOperation = "source-over";
//       const sx = pad + 30, sw = ow - (pad + 30) * 2;
//       rr(o, sx, pad + 76, sw * 0.62, 26, 8); o.fill();              // header bar
//       for (let i = 0; i < 3; i++) { rr(o, sx, pad + 124 + i * 70, sw, 46, 12); o.fill(); } // content cards
//       rr(o, sx, oh - (pad + 54) - 40, sw, 38, 12); o.fill();        // bottom nav

//       const data = o.getImageData(0, 0, ow, oh).data;
//       const pts: { x: number; y: number }[] = [];
//       const step = 6;
//       for (let y = 0; y < oh; y += step) {
//         for (let x = 0; x < ow; x += step) {
//           if (data[(y * ow + x) * 4 + 3] > 128) pts.push({ x: x / ow - 0.5, y: y / oh - 0.5 });
//         }
//       }
//       return pts;
//     }

//     function layout() {
//       const rect = canvas.getBoundingClientRect();
//       w = rect.width; h = rect.height;
//       canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
//       ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

//       const pts = shapePoints();
//       const small = w < 820;
//       const scale = Math.min(w * (small ? 0.62 : 0.36), h * 0.78);
//       const shapeH = scale, shapeW = scale * (420 / 560);
//       const cx = small ? w * 0.5 : w * 0.66;
//       const cy = h * 0.5;

//       const cap = Math.min(pts.length, small ? 1300 : 2600);
//       const stepT = pts.length / cap;
//       particles = [];
//       for (let i = 0; i < cap; i++) {
//         const t = pts[Math.floor(i * stepT)];
//         const ang = Math.random() * Math.PI * 2;
//         const rad = Math.max(w, h) * (0.28 + Math.random() * 0.55);
//         particles.push({
//           tx: cx + t.x * shapeW,
//           ty: cy + t.y * shapeH,
//           hx: cx + Math.cos(ang) * rad,
//           hy: cy + Math.sin(ang) * rad * 0.7,
//           s: 0.7 + Math.random() * 1.2,
//           ph: Math.random() * Math.PI * 2,
//         });
//       }
//     }

//     const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
//     const LOOP = 11000;
//     function assembly(p: number) {
//       if (p < 0.3) return easeInOut(p / 0.3);            // converge
//       if (p < 0.66) return 1;                            // hold
//       if (p < 0.86) return 1 - easeInOut((p - 0.66) / 0.2); // disperse
//       return 0;                                          // scattered
//     }

//     function frame(now: number) {
//       const a = reduce ? 1 : assembly(((now - start) % LOOP) / LOOP);
//       const breathe = a > 0.95 ? Math.sin(now * 0.0013) * 1.6 : 0;

//       ctx.clearRect(0, 0, w, h);
//       ctx.fillStyle = "#ffffff";
//       ctx.globalAlpha = 0.16 + 0.5 * a;
//       for (const pt of particles) {
//         const x = pt.hx + (pt.tx - pt.hx) * a + breathe * Math.cos(pt.ph);
//         const y = pt.hy + (pt.ty - pt.hy) * a + breathe * Math.sin(pt.ph);
//         ctx.fillRect(x, y, pt.s, pt.s);
//       }
//       ctx.globalAlpha = 1;
//       if (!reduce) raf = requestAnimationFrame(frame);
//     }

//     layout();
//     if (reduce) frame(performance.now());
//     else { start = performance.now(); raf = requestAnimationFrame(frame); }

//     let resizeT: number;
//     const onResize = () => {
//       window.clearTimeout(resizeT);
//       resizeT = window.setTimeout(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); layout(); }, 150);
//     };
//     window.addEventListener("resize", onResize);
//     return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.clearTimeout(resizeT); };
//   }, []);

//   return <canvas ref={ref} className="hero-particles" aria-hidden="true" />;
// }

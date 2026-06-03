"use client";

import { useEffect } from "react";

export default function ClientEffects() {
  useEffect(() => {
    // live UK clock
    const clock = document.getElementById("clock");
    const tick = () => {
      if (clock) {
        clock.textContent =
          "UK " +
          new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      }
    };
    tick();
    const clockId = window.setInterval(tick, 15000);

    // reveal on scroll
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".mvp .reveal").forEach((el) => io.observe(el));

    // count-up stats
    const cio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const t = Number(el.dataset.count || 0);
          const s = el.dataset.suffix || "";
          const start = performance.now();
          const frame = (now: number) => {
            const p = Math.min((now - start) / 1400, 1);
            el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * t).toLocaleString() + s;
            if (p < 1) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
          cio.unobserve(el);
        }),
      { threshold: 0.5 }
    );
    document.querySelectorAll(".mvp [data-count]").forEach((el) => cio.observe(el));

    // nav theme: light when a light section sits under the top of the viewport
    const navEl = document.getElementById("nav");
    const navTheme = () => {
      let light = false;
      document.querySelectorAll(".mvp section, .mvp header").forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= 64 && r.bottom > 64) light = s.classList.contains("light-sec");
      });
      if (navEl) navEl.classList.toggle("light", light);
    };
    navTheme();
    window.addEventListener("scroll", navTheme, { passive: true });

    return () => {
      window.clearInterval(clockId);
      io.disconnect();
      cio.disconnect();
      window.removeEventListener("scroll", navTheme);
    };
  }, []);

  return null;
}

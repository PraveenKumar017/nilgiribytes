"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    refreshReveals?: (scope?: ParentNode | null) => void;
    NILGIRI_MOTION_READY?: boolean;
  }
}

function pageFor(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/cart")) return "cart";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/policies")) return "legal";
  return "page";
}

export function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    root.dataset.motion = "golden-reveal";
    window.NILGIRI_MOTION_READY = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer =
      !reduceMotion && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add("is-visible");
                observer?.unobserve(entry.target);
              }
            },
            { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
          )
        : null;

    function refresh(scope?: ParentNode | null) {
      const container = scope ?? document;
      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>("[data-reveal], .reveal")
      );
      nodes.forEach((node, index) => {
        node.style.setProperty("--i", String(index % 8));
        if (node.classList.contains("is-visible")) return;
        if (observer) observer.observe(node);
        else node.classList.add("is-visible");
      });
    }

    window.refreshReveals = refresh;

    const failsafe = window.setTimeout(() => {
      if (!window.NILGIRI_MOTION_READY) root.classList.remove("js");
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      observer?.disconnect();
      delete window.refreshReveals;
    };
  }, []);

  useEffect(() => {
    document.body.dataset.page = pageFor(pathname);
    document.body.classList.remove("nav-is-open", "is-locked");
    window.setTimeout(() => window.refreshReveals?.(document), 40);
  }, [pathname]);

  return null;
}

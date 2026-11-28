"use client";

import { useEffect, useRef } from "react";

export function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const source = video.querySelector("source");

    const syncPlayback = () => {
      if (reduceMotion || document.body.classList.contains("is-locked")) {
        video.pause();
        return;
      }
      void video.play().catch(() => {});
    };

    const applySource = () => {
      if (!source) return;
      const nextSrc = mobileQuery.matches
        ? "/assets/hero_bg_mobile.mp4"
        : "/assets/hero_bg.mp4";
      if (source.getAttribute("src") === nextSrc) return;
      source.setAttribute("src", nextSrc);
      video.load();
      syncPlayback();
    };

    applySource();
    syncPlayback();
    mobileQuery.addEventListener("change", applySource);

    if (reduceMotion) {
      return () => mobileQuery.removeEventListener("change", applySource);
    }

    const observer = new MutationObserver(syncPlayback);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", applySource);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-background_video"
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source
        media="(max-width: 768px)"
        src="/assets/hero_bg_mobile.mp4"
        type="video/mp4"
      />
      <source src="/assets/hero_bg.mp4" type="video/mp4" />
    </video>
  );
}

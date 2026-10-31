"use client";

import { useEffect, useRef, type ReactNode } from "react";

const SPEED_PX_PER_SECOND = 38;
const RESUME_DELAY_MS = 2500;

export function PartnersMarquee({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      const delta = Math.min(now - last, 64);
      last = now;

      if (!pausedRef.current) {
        const half = scroller.scrollWidth / 2;
        if (half > 0) {
          let next = scroller.scrollLeft + (SPEED_PX_PER_SECOND * delta) / 1000;
          if (next >= half) next -= half;
          scroller.scrollLeft = next;
        }
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    const clearResume = () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const pause = () => {
      clearResume();
      pausedRef.current = true;
    };

    const resume = () => {
      clearResume();
      pausedRef.current = false;
    };

    const pauseThenResume = () => {
      pause();
      resumeTimerRef.current = window.setTimeout(resume, RESUME_DELAY_MS);
    };

    scroller.addEventListener("pointerenter", pause);
    scroller.addEventListener("pointerleave", resume);
    scroller.addEventListener("focusin", pause);
    scroller.addEventListener("focusout", resume);
    scroller.addEventListener("touchstart", pause, { passive: true });
    scroller.addEventListener("touchend", pauseThenResume, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearResume();
      scroller.removeEventListener("pointerenter", pause);
      scroller.removeEventListener("pointerleave", resume);
      scroller.removeEventListener("focusin", pause);
      scroller.removeEventListener("focusout", resume);
      scroller.removeEventListener("touchstart", pause);
      scroller.removeEventListener("touchend", pauseThenResume);
    };
  }, []);

  return (
    <div
      className="wholesale-partners_marquee"
      ref={scrollerRef}
      role="region"
      tabIndex={0}
      aria-label="Ways to work with Nilgiribytes"
    >
      {children}
    </div>
  );
}

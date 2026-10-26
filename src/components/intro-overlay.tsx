"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "veb_intro_seen";

export function IntroOverlay() {
  const [state, setState] = useState<"idle" | "active" | "done">("idle");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      seen = false;
    }
    if (reduceMotion || seen) {
      setState("done");
      return;
    }
    setState("active");
    document.body.classList.add("is-locked");
    const timer = window.setTimeout(() => finish(), 1800);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("is-locked");
    };
  }, []);

  function finish() {
    setState("done");
    document.body.classList.remove("is-locked");
    try {
      window.sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }

  if (state === "done") return null;

  return (
    <div
      className={`intro${state === "active" ? " is-active" : ""}`}
      id="intro"
      aria-hidden={state === "active" ? "false" : "true"}
    >
      <div className="intro_inner">
        <span className="logo-loader logo-loader--intro" role="status">
          <span className="logo-loader_mark" aria-hidden="true" />
          <span className="sr-only">Loading Nilgiribytes</span>
        </span>
        <span className="intro_brand">Nilgiribytes</span>
        <span className="intro_rule" aria-hidden="true" />
      </div>
      <button className="intro_skip" type="button" onClick={finish}>
        Skip
      </button>
    </div>
  );
}

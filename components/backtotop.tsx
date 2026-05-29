"use client";
import { useEffect, useState } from "react";

// Flytande "till toppen"-knapp. Dyker upp först när man scrollat en bit ner
// (så den inte stör överst på sidan) och tar dig mjukt tillbaka till toppen.
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`backtotop ${show ? "show" : ""}`}
      aria-label="Till toppen av sidan"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}

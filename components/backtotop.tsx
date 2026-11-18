"use client";
import { useEffect, useState } from "react";

// Flytande "till toppen"-knapp. Dyker upp först när man scrollat en bit ner
// (så den inte stör överst på sidan) och tar dig mjukt tillbaka till toppen.
//
// VID SIDFOTEN GÖMS DEN PÅ MOBILEN (`.backtotop.vid-fot` i globals.css). Där är
// sidfoten lika bred som skärmen, och knappen låg ovanpå den högra länkspalten
// och sista radens länkar. Sidfoten har en egen "Till toppen" i stället
// (components/till-toppen-lank.tsx). På dator står knappen utanför spalterna
// och får vara kvar.
export function BackToTop() {
  const [show, setShow] = useState(false);
  const [vidFot, setVidFot] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const fot = document.querySelector("body > footer, footer");
    if (!fot || typeof IntersectionObserver === "undefined") return;
    // Nedre marginalen är knappens plats på mobilen (84 px upp): sidfoten
    // räknas som framme när dess överkant når knappens underkant.
    const io = new IntersectionObserver(([e]) => setVidFot(e.isIntersecting), { rootMargin: "0px 0px -84px 0px" });
    io.observe(fot);
    return () => io.disconnect();
  }, []);
  return (
    <button
      type="button"
      className={`backtotop${show ? " show" : ""}${vidFot ? " vid-fot" : ""}`}
      aria-label="Till toppen av sidan"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}

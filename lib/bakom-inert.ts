// lib/bakom-inert.ts
//
// Gör allt utom ett element oåtkomligt medan ett lager täcker sidan.
//
// Mobilens sökläge (components/searchbox.tsx) täcker hela skärmen, men sidan
// under låg kvar i tabbordningen och för skärmläsare: tabben gick från sista
// sökförslaget rakt in i produktkort som inte syns, och axe räknade sidans
// rullande bildrader som fel i ett läge där ingen kan nå dem (2026-11-20).
//
// `inert` sätts på syskonen till elementet och till var och en av dess
// förfäder upp till roten. Elementet självt och vägen dit lämnas. Det som
// redan är inert (stängda lådor) rörs inte och ställs inte tillbaka.
// Webbläsare utan inert (Safari före 15.5) gör ingenting av attributet.

type Nod = {
  tagName: string;
  parentElement: Nod | null;
  children: ArrayLike<Nod>;
  hasAttribute(namn: string): boolean;
  setAttribute(namn: string, varde: string): void;
  removeAttribute(namn: string): void;
};

const UTAN_YTA = /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/;

/** Sätter inert på allt utom `kvar` och vägen dit, och ger en funktion som ställer tillbaka. */
export function gorBakomInert(kvar: Nod, rot: Nod): () => void {
  const satta: Nod[] = [];
  for (let e: Nod | null = kvar; e && e !== rot; e = e.parentElement) {
    const foralder: Nod | null = e.parentElement;
    if (!foralder) break;
    for (const syskon of Array.from(foralder.children)) {
      if (syskon === e || UTAN_YTA.test(syskon.tagName) || syskon.hasAttribute("inert")) continue;
      syskon.setAttribute("inert", "");
      satta.push(syskon);
    }
  }
  let aterstalld = false;
  return () => {
    if (aterstalld) return;
    aterstalld = true;
    for (const s of satta) s.removeAttribute("inert");
  };
}

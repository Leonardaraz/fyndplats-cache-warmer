"use client";

// Länken på produktkortet, underkategorichipsen, kategorisidans brödsmulor
// och startsidans avdelningskort — med förhämtning vid AVSIKT i stället för vid syn.
//
// ☠️ VARFÖR INTE BARA prefetch={null}. Nexts förval hämtar rutten så fort
// länken syns i vyn. En listsida renderar 24 kort direkt och fler medan man
// bläddrar; produktsidorna är statiska, så "auto" hämtar HELA rutten för
// varenda ett. Det är megabyte av förhämtning för kort kunden aldrig klickar,
// på en mobil som redan har fullt upp med att hydrera listan.
//
// ☠️ MEN prefetch={false} ENSAMT ÄR FÖR TRUBBIGT. Dokumentationen för Next 16
// är uttrycklig: "false: Prefetching will never happen both on entering the
// viewport and on hover." Kortet hade alltså ingen förhämtning alls, och varje
// klick började från noll — mätt på skarp sajt 2026-09-04: 0,19–0,72 s TTFB
// innan navigeringen ens kunde börja rita. Det var precis det Leonard
// rapporterade som "tar tid tills jag går vidare till produkten".
//
// Lösningen är att hämta när kunden visar avsikt men innan hen släpper:
//
//   onPointerEnter  — muspekaren når kortet, typiskt 200–600 ms före klick
//   onTouchStart    — fingret nuddar skärmen, ~100–200 ms före touchend
//
// På mobil är det den enda signal som finns, och den räcker: hämtningen och
// tryckets resterande tid överlappar. Samma mönster som sökrutan använder
// sedan 2026-09-01.
//
// Förhämtas EN gång per kort (hämtat-flaggan). Utan den fyrar pointerenter
// om vid varje passage över kortet i ett rutnät.

// Medlemspriset (2026-11-13): på ett produktkort startar samma avsikt också
// hämtningen av medlemspriset, så att rutan på produktsidan har sitt svar när
// sidan ritas. Bara med tecknet fp_medlem_inne, en gång per kort, och vid
// pekaren först efter en kort stund, så att en mus som drar över rutnätet
// inte hämtar för varje kort den passerar.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, type ReactNode } from "react";
import { hamtaMedlemspris, sparatSvar } from "../lib/medlem/medlemspris-klient";

/** Så länge pekaren ska vila på kortet innan medlemspriset hämtas. */
const MEDLEM_VILA_MS = 120;

export function PrefetchLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
  medlemspris,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  /** Produktens id: kortet förhämtar också medlemspriset för en inloggad medlem. */
  medlemspris?: string;
}) {
  const router = useRouter();
  const hamtat = useRef(false);
  const medlemHamtat = useRef(false);
  const vila = useRef<number | null>(null);

  const medlem = useCallback(() => {
    if (!medlemspris || medlemHamtat.current) return;
    medlemHamtat.current = true;
    if (sparatSvar(medlemspris) === undefined) hamtaMedlemspris(medlemspris);
  }, [medlemspris]);

  const forhamta = useCallback(() => {
    if (hamtat.current) return;
    hamtat.current = true;
    // router.prefetch kastar aldrig; en misslyckad förhämtning ska inte kunna
    // fälla ett kort som annars fungerar. Klicket hämtar då som förut.
    try {
      router.prefetch(href);
    } catch {
      hamtat.current = false;
    }
  }, [router, href]);

  return (
    <Link
      className={className}
      href={href}
      aria-label={ariaLabel}
      prefetch={false}
      onPointerEnter={() => {
        forhamta();
        if (medlemspris && !medlemHamtat.current) vila.current = window.setTimeout(medlem, MEDLEM_VILA_MS);
      }}
      onPointerLeave={() => {
        if (vila.current !== null) window.clearTimeout(vila.current);
        vila.current = null;
      }}
      onPointerDown={medlem}
      onTouchStart={() => {
        forhamta();
        medlem();
      }}
    >
      {children}
    </Link>
  );
}

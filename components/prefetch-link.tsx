"use client";

// Länken på produktkortet — med förhämtning vid AVSIKT i stället för vid syn.
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

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, type ReactNode } from "react";

export function PrefetchLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const hamtat = useRef(false);

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
      prefetch={false}
      onPointerEnter={forhamta}
      onTouchStart={forhamta}
    >
      {children}
    </Link>
  );
}

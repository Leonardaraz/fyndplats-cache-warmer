"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBox() {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <form
      className="search"
      onSubmit={(e) => { e.preventDefault(); const t = q.trim(); if (t) router.push(`/sok?q=${encodeURIComponent(t)}`); }}
      role="search"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Sök efter produkter…"
        aria-label="Sök efter produkter"
        autoComplete="off"
      />
    </form>
  );
}

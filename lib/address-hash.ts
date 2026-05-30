// lib/address-hash.ts
// Deterministic hashing of a shipping address so we can compare across orders without
// storing the raw PII in a lookup column. Lowercases + strips whitespace/non-alnum from
// each field then joins with `|` so subtle formatting differences don't break matches.

import { createHash } from 'node:crypto';

export interface NormalisableAddress {
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null; // ISO-2 ideally
}

function norm(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics so "Östermalm" matches "Ostermalm"
    .replace(/[^a-z0-9]/g, '');
}

export function hashAddress(addr: NormalisableAddress | null | undefined): string | null {
  if (!addr) return null;
  const parts = [
    norm(addr.addressLine1),
    norm(addr.addressLine2),
    norm(addr.postalCode),
    norm(addr.city),
    norm(addr.country ?? 'se'),
  ];
  if (parts.every((p) => p === '')) return null;
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

export function normalisePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Keep leading + then digits only. Strips spaces, dashes, parens.
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  // Swedish numbers: convert leading 0 to +46 so a phone is comparable across entry styles.
  if (/^0\d{8,9}$/.test(cleaned)) return '+46' + cleaned.slice(1);
  return cleaned;
}

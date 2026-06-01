// Perceptual hash (pHash) — DCT-baserad, körs HELT lokalt i Node via `sharp`.
// Inga externa API:er, inga AI-anrop ($0). Används av dubblett-detektorn (Feature 1)
// för att hitta produkter med visuellt identisk huvudbild även om titel/pris skiljer.
//
// Algoritm (kanonisk pHash):
//   1. Avkoda bilden → gråskala → skala till 32×32 (fit:fill).
//   2. 2D DCT-II på 32×32-matrisen.
//   3. Ta lågfrekvensblocket 8×8 (övre vänstra hörnet).
//   4. Median av de 64 koefficienterna (exkl. DC-termen [0,0]).
//   5. Bit = 1 om koefficient > median, annars 0 → 64 bitar → 16 hex-tecken.
//
// Avstånd mellan två hashar = Hamming-avstånd (antal skilda bitar). < 10 ≈ samma bild.

import sharp from "sharp";

const HASH_SIZE = 8; // 8×8 lågfrekvensblock → 64 bitar.
const IMG_SIZE = 32; // DCT körs på 32×32 (4× hash-storleken, standard).

/** Förberäknad DCT-cosinusmatris per N (memoiserad). cos[(2x+1)·u·π / 2N]. */
const cosCache = new Map<number, number[][]>();
function cosMatrix(n: number): number[][] {
  const cached = cosCache.get(n);
  if (cached) return cached;
  const m: number[][] = [];
  for (let u = 0; u < n; u++) {
    const row = new Array<number>(n);
    for (let x = 0; x < n; x++) {
      row[x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * n));
    }
    m.push(row);
  }
  cosCache.set(n, m);
  return m;
}

/** 1D DCT-II av en vektor med längd n (oviktad — vi behöver bara relativ storlek). */
function dct1d(vec: number[], cos: number[][]): number[] {
  const n = vec.length;
  const out = new Array<number>(n).fill(0);
  for (let u = 0; u < n; u++) {
    let sum = 0;
    const cu = cos[u];
    for (let x = 0; x < n; x++) sum += vec[x] * cu[x];
    out[u] = sum;
  }
  return out;
}

/**
 * Beräknar pHash ur en gråskalematris (row-major, längd size·size, värden 0–255).
 * Ren funktion utan I/O — enhetstestbar utan `sharp`. Returnerar 16 hex-tecken.
 */
export function pHashFromGrayscale(gray: ArrayLike<number>, size = IMG_SIZE): string {
  if (gray.length !== size * size) {
    throw new Error(`pHashFromGrayscale: förväntade ${size * size} pixlar, fick ${gray.length}`);
  }
  const cos = cosMatrix(size);

  // 2D DCT separabelt: DCT på rader, sedan på kolumner.
  const rows: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row = new Array<number>(size);
    for (let x = 0; x < size; x++) row[x] = gray[y * size + x];
    rows.push(dct1d(row, cos));
  }
  // DCT på kolumner.
  const dct: number[][] = Array.from({ length: size }, () => new Array<number>(size));
  for (let x = 0; x < size; x++) {
    const col = new Array<number>(size);
    for (let y = 0; y < size; y++) col[y] = rows[y][x];
    const dctCol = dct1d(col, cos);
    for (let y = 0; y < size; y++) dct[y][x] = dctCol[y];
  }

  // Lågfrekvensblock 8×8.
  const block: number[] = [];
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) block.push(dct[y][x]);
  }

  // Median exkl. DC-termen (block[0]) — DC dominerar och skulle snedvrida medianen.
  const ac = block.slice(1).sort((a, b) => a - b);
  const median = ac[Math.floor(ac.length / 2)];

  // Bygg 64-bitarshashen → hex. Bit i = block[i] > median.
  let hex = "";
  for (let nibble = 0; nibble < 16; nibble++) {
    let val = 0;
    for (let bit = 0; bit < 4; bit++) {
      const i = nibble * 4 + bit;
      if (block[i] > median) val |= 1 << (3 - bit);
    }
    hex += val.toString(16);
  }
  return hex;
}

const POPCOUNT4 = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/**
 * Hamming-avstånd mellan två hex-hashar (antal skilda bitar). Lika längd krävs.
 * Returnerar Infinity om någon hash är ogiltig/olika längd (→ aldrig en match).
 */
export function hammingDistanceHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    if (Number.isNaN(x)) return Infinity;
    dist += POPCOUNT4[x];
  }
  return dist;
}

/** Hämtar en bild som Buffer med timeout. Returnerar null vid fel (fail-open). */
export async function fetchImageBuffer(url: string, timeoutMs = 10_000): Promise<Buffer | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (FyndplatsImport pHash)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

/** Avkodar en bild-Buffer → gråskala 32×32 → pHash. Null vid avkodningsfel. */
export async function pHashFromBuffer(buf: Buffer): Promise<string | null> {
  try {
    const raw = await sharp(buf)
      .greyscale()
      .resize(IMG_SIZE, IMG_SIZE, { fit: "fill" })
      .raw()
      .toBuffer();
    if (raw.length !== IMG_SIZE * IMG_SIZE) return null;
    return pHashFromGrayscale(raw, IMG_SIZE);
  } catch {
    return null;
  }
}

/** Bekvämlighet: hämtar URL:en och returnerar dess pHash (eller null). */
export async function pHashFromUrl(url: string): Promise<string | null> {
  const buf = await fetchImageBuffer(url);
  if (!buf) return null;
  return pHashFromBuffer(buf);
}

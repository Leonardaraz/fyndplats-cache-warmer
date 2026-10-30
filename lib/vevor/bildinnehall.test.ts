import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hamtaNyckel, innehallsnycklar } from "./bildinnehall";
import { ANVANDARAGENT } from "./hamtning";

const BYTE = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
const MD5 = createHash("md5").update(BYTE).digest("hex");
const BILD = "https://img.vevorstatic.com/us%2FTESTMAPP%2Foriginal_img-v1%2Ftest-m100-1.2.jpg?timestamp=1";

function fejkFetch(svar: (url: string) => Response) {
  const anrop: { url: string; ua: string | null }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    anrop.push({ url, ua: new Headers(init?.headers).get("User-Agent") });
    const r = svar(url);
    Object.defineProperty(r, "url", { value: url });
    return r;
  }) as unknown as typeof fetch;
  return { f, anrop };
}

describe("hamtaNyckel", () => {
  it("ger md5 av bildens byte, samma som Wix hash, och hämtar med vår egen användaragent", async () => {
    const { f, anrop } = fejkFetch(() => new Response(BYTE));
    expect(await hamtaNyckel(BILD, f)).toBe(MD5);
    expect(anrop[0].ua).toBe(ANVANDARAGENT);
  });

  it("☠️ hämtar aldrig från någon annan värd än VEVOR:s bildserver", async () => {
    const { f, anrop } = fejkFetch(() => new Response(BYTE));
    expect(await hamtaNyckel("https://eur.vevor.com/api/something", f)).toBeNull();
    expect(await hamtaNyckel("https://example.test/bild.jpg", f)).toBeNull();
    expect(anrop).toEqual([]);
  });

  it("ett fel eller en tom bild ger ingen nyckel", async () => {
    expect(await hamtaNyckel(BILD, fejkFetch(() => new Response("", { status: 404 })).f)).toBeNull();
    expect(await hamtaNyckel(BILD, fejkFetch(() => new Response(new Uint8Array())).f)).toBeNull();
    const kastar = (async () => {
      throw new Error("nät");
    }) as unknown as typeof fetch;
    expect(await hamtaNyckel(BILD, kastar)).toBeNull();
  });
});

describe("innehallsnycklar", () => {
  it("hämtar varje adress en gång och utelämnar dem som inte gick", async () => {
    const hamtade: string[] = [];
    const n = await innehallsnycklar(["a", "b", "a", "c"], async (u) => {
      hamtade.push(u);
      return u === "c" ? null : `md5-${u}`;
    });
    expect(hamtade.sort()).toEqual(["a", "b", "c"]);
    expect([...n]).toEqual(expect.arrayContaining([["a", "md5-a"], ["b", "md5-b"]]));
    expect(n.has("c")).toBe(false);
  });
});

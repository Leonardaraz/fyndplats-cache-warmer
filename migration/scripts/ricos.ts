// Konverterar HTML → Ricos rich-content-document via Wix officiella API.

const WIX_BASE = "https://www.wixapis.com";

function headers(token: string, siteId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: token,
    "wix-site-id": siteId,
  };
}

export async function convertHtmlToRicos(
  token: string,
  siteId: string,
  html: string,
): Promise<unknown> {
  const res = await fetch(`${WIX_BASE}/ricos/v1/ricos-document/convert/to-ricos`, {
    method: "POST",
    headers: headers(token, siteId),
    body: JSON.stringify({
      html,
      options: { plugins: ["image", "link", "textColor", "heading"] },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ricos convert misslyckades (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { document?: unknown };
  return data.document;
}

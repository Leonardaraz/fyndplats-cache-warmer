// Delad HTML-escaping för mejlen. En definition, så att driftmejlen och
// kundmejlen escapar exakt samma tecken.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

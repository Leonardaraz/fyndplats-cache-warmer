import type { ReactNode } from "react";

export const metadata = {
  title: "Fyndplats — Import & Sync",
  description: "Internt verktyg för produktimport, lagersync och orderhantering.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}

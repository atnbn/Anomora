import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anomora | Next.js lernen",
  description: "Dein dokumentiertes Next.js-Grundgerüst.",
};

// Das Root Layout umschließt alle Seiten im App Router.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

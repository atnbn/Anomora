import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/app/providers";
import { getLiveCatalog } from "@/lib/anime-api/anilist";
import { accentBootScript } from "@/features/themes/accent";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ANIMORA – Deine Anime-Community",
    template: "%s · ANIMORA",
  },
  description:
    "Anime entdecken, Lieblingsserien verfolgen und Episoden mit der Community diskutieren.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
    { media: "(prefers-color-scheme: light)", color: "#f8f6f3" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Gecacht (cacheLife „hours“): eine AniList-Anfrage pro Stunde für alle Besucher.
  const catalog = await getLiveCatalog();
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${jakarta.variable} ${barlow.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body>
        <Providers
          catalog={catalog?.items ?? null}
          fetchedAt={catalog?.fetchedAt ?? null}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}

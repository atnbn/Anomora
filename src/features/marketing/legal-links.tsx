import Link from "next/link";
import { cn } from "@/lib/utils";

export const legalPages = [
  { slug: "impressum", title: "Impressum" },
  { slug: "datenschutz", title: "Datenschutz" },
  { slug: "nutzungsbedingungen", title: "Nutzungsbedingungen" },
  { slug: "community-richtlinien", title: "Community-Richtlinien" },
] as const;

export type LegalSlug = (typeof legalPages)[number]["slug"];

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Rechtliches" className={className}>
      <ul className={cn("flex flex-wrap gap-x-4 gap-y-1")}>
        {legalPages.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/legal/${page.slug}`}
              className="inline-flex min-h-8 items-center rounded-sm hover:text-foreground hover:underline"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

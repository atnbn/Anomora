import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { legalDocuments } from "@/features/marketing/legal-content";
import { legalPages, type LegalSlug } from "@/features/marketing/legal-links";
import { cn } from "@/lib/utils";

type Props = PageProps<"/legal/[slug]">;

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

function getDocument(slug: string) {
  return slug in legalDocuments ? legalDocuments[slug as LegalSlug] : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const document = getDocument((await params).slug);
  return { title: document?.title ?? "Seite nicht gefunden" };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const document = getDocument(slug);
  if (!document) notFound();

  return (
    <div className="mx-auto grid max-w-[77.5rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-16">
      <nav
        aria-label="Rechtliche Seiten"
        className="lg:sticky lg:top-24 lg:self-start"
      >
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {legalPages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/legal/${page.slug}`}
                aria-current={page.slug === slug ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground lg:flex lg:border-0",
                  page.slug === slug &&
                    "border-primary bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
                )}
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="max-w-[68ch]">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{document.summary}</p>
        {document.placeholder && (
          <p
            role="note"
            className="mt-6 flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
          >
            <TriangleAlertIcon
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            Layout-Vorlage: Dieser Text ist nicht rechtsverbindlich. Markierte
            Platzhalter müssen vor dem Livegang vom Betreiber ergänzt werden.
          </p>
        )}
        {document.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-xl font-bold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}

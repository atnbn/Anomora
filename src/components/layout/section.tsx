import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Abschnitt mit Überschrift und optionalem „Alle anzeigen“-Link. */
export function Section({
  title,
  description,
  href,
  hrefLabel = "Alle anzeigen",
  action,
  children,
  className,
  headingLevel = 2,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-")}`;

  return (
    <section aria-labelledby={id} className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <Heading
            id={id}
            className="text-[1.0625rem] leading-tight font-bold tracking-tight"
          >
            {title}
          </Heading>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
        {href && (
          <Link
            href={href}
            className="-mr-1 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-sm font-semibold text-brand hover:underline hover:underline-offset-2"
          >
            {hrefLabel}
            <ChevronRightIcon className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Ruhige Fläche für zusammengehörige Inhalte – bewusst ohne verschachtelte Karten. */
export function Panel({
  children,
  className,
  as: Component = "div",
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "aside" | "article";
  labelledBy?: string;
}) {
  return (
    <Component
      aria-labelledby={labelledBy}
      className={cn(
        "rounded-lg border bg-card text-card-foreground",
        className,
      )}
    >
      {children}
    </Component>
  );
}

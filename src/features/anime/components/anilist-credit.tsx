import { cn } from "@/lib/utils";

/** Quellenangabe für Daten und Bilder von AniList. */
export function AniListCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Daten & Bilder:{" "}
      <a
        href="https://anilist.co"
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline-offset-2 hover:text-foreground hover:underline"
      >
        AniList
      </a>
    </p>
  );
}

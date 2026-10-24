"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Verdeckt Spoiler, bis sie bewusst aufgedeckt werden. Der verdeckte Inhalt
 * ist für Screenreader und Tastatur nicht erreichbar (inert).
 */
export function SpoilerGuard({
  active,
  reason = "Enthält Spoiler",
  children,
  className,
}: {
  active: boolean;
  reason?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const hidden = active && !revealed;

  return (
    <div className={cn("relative", className)}>
      <div
        inert={hidden}
        aria-hidden={hidden || undefined}
        className={cn(
          "transition-[filter] duration-200",
          hidden && "pointer-events-none min-h-12 blur-md select-none",
        )}
      >
        {children}
      </div>
      {hidden && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border bg-popover/95 px-4 text-sm font-semibold shadow-sm hover:bg-popover"
          >
            <EyeIcon className="size-4 text-brand" aria-hidden="true" />
            {reason} – anzeigen
          </button>
        </div>
      )}
      {active && revealed && (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <EyeOffIcon className="size-3.5" aria-hidden="true" />
          Spoiler wieder verdecken
        </button>
      )}
    </div>
  );
}

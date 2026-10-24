"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = { label: string; href?: string; onClick?: () => void };

function ActionButton({
  action,
  primary,
}: {
  action: Action;
  primary?: boolean;
}) {
  const variant = primary ? "default" : "outline";
  if (action.href) {
    return (
      <Link href={action.href} className={buttonVariants({ variant })}>
        {action.label}
      </Link>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/** Leerer Zustand: erklärt, warum nichts da ist, und bietet den nächsten Schritt an. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: Action;
  secondaryAction?: Action;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-semibold text-balance">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground text-balance">
            {description}
          </p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {action && <ActionButton action={action} primary />}
          {secondaryAction && <ActionButton action={secondaryAction} />}
        </div>
      )}
    </div>
  );
}

/** Fehlerzustand mit Wiederholen-Aktion. */
export function ErrorState({
  title = "Das hat nicht geklappt",
  description = "Die Inhalte konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <TriangleAlertIcon
        className="size-6 text-destructive"
        aria-hidden="true"
      />
      <div className="max-w-sm space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCwIcon aria-hidden="true" />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

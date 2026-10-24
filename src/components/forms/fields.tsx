"use client";

import { forwardRef, useId, useState } from "react";
import {
  CheckIcon,
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  FlaskConicalIcon,
  XIcon,
} from "lucide-react";
import type { PasswordCheck } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full min-w-0 rounded-md border bg-background px-3.5 text-[0.9375rem] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:opacity-60";

type FieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  /** Rechts neben dem Label, z. B. „Passwort vergessen?“ */
  labelAside?: React.ReactNode;
  optional?: boolean;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  labelAside,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  labelAside?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {optional && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </label>
        {labelAside}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <CircleAlertIcon
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint: unknown, error: unknown) {
  return (
    [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(
  function TextField(
    { label, hint, error, labelAside, optional, className, ...props },
    ref,
  ) {
    const id = useId();
    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        labelAside={labelAside}
        optional={optional}
      >
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(inputClass, className)}
          {...props}
        />
      </FieldShell>
    );
  },
);

/** Passwortfeld mit Anzeigen/Verbergen und optionaler Anforderungsliste. */
export const PasswordField = forwardRef<
  HTMLInputElement,
  FieldProps & { checks?: PasswordCheck[] }
>(function PasswordField(
  { label, hint, error, labelAside, checks, className, ...props },
  ref,
) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      labelAside={labelAside}
    >
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy(id, hint, error), checks ? `${id}-checks` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(inputClass, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
          className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {visible ? (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {checks && (
        <ul id={`${id}-checks`} className="grid gap-1 pt-0.5 text-xs">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-1.5",
                check.met ? "text-success" : "text-muted-foreground",
              )}
            >
              {check.met ? (
                <CheckIcon className="size-3.5" aria-hidden="true" />
              ) : (
                <XIcon className="size-3.5" aria-hidden="true" />
              )}
              <span>
                {check.label}
                <span className="sr-only">
                  {check.met ? " – erfüllt" : " – noch nicht erfüllt"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
});

/** Fehlermeldung oberhalb des Formulars, z. B. falsche Zugangsdaten. */
export function FormAlert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-foreground"
          : "border-brand/30 bg-brand-soft",
      )}
    >
      <CircleAlertIcon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "error" ? "text-destructive" : "text-brand",
        )}
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}

/** Kennzeichnet simulierte Funktionen eindeutig. */
export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-dashed px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
      <FlaskConicalIcon
        className="mt-0.5 size-4 shrink-0 text-brand"
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}

/** Setzt den Fokus auf das erste Feld mit Fehler (in DOM-Reihenfolge). */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  });
}

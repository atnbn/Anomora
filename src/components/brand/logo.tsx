import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
      fill="none"
    >
      <circle cx="16" cy="16" r="16" className="fill-primary" />
      <path
        d="M9.5 23.5 16 8.5l6.5 15"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18.6c3.6-1.9 8.4-2.3 12.6-.4"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[0.14em]">
          ANIMORA
        </span>
      )}
    </span>
  );
}

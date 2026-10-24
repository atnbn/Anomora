"use client";

import Link from "next/link";
import { BanIcon } from "lucide-react";
import { useActiveBan } from "@/features/moderation/hooks";
import { useViewer } from "@/features/profiles/hooks";
import { formatDateTime } from "@/lib/format";

/** Hinweis für gesperrte Konten – sichtbar auf allen App-Seiten. */
export function BanBanner() {
  const { viewer } = useViewer();
  const ban = useActiveBan(viewer?.id);
  if (!ban) return null;

  return (
    <div
      role="status"
      className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm sm:px-6 lg:px-8"
    >
      <p className="mx-auto flex max-w-[77.5rem] items-start gap-2.5">
        <BanIcon
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <span>
          <span className="font-semibold">
            Dein Konto ist{" "}
            {ban.untilTime
              ? `bis ${formatDateTime(ban.untilTime)} Uhr gesperrt`
              : "dauerhaft gesperrt"}
            .
          </span>{" "}
          Du kannst lesen, aber nichts veröffentlichen. Grund: {ban.reason}{" "}
          <Link
            href="/legal/community-richtlinien"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Community-Richtlinien
          </Link>
        </span>
      </p>
    </div>
  );
}

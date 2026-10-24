"use client";

import { useClock } from "@/features/demo/clock";
import { formatDateTime, formatRelative } from "@/lib/format";

export function RelativeTime({
  time,
  className,
}: {
  time: number;
  className?: string;
}) {
  const { now } = useClock();
  return (
    <time
      dateTime={new Date(time).toISOString()}
      title={formatDateTime(time)}
      className={className}
    >
      {formatRelative(time, now)}
    </time>
  );
}

import { ModerationShell } from "@/features/moderation/moderation-shell";

export default function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModerationShell>{children}</ModerationShell>;
}

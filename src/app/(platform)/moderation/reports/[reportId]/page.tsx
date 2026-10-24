import type { Metadata } from "next";
import { ModerationGate } from "@/features/moderation/moderation-shell";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDetailView } from "@/features/moderation/report-detail-view";

type Props = PageProps<"/moderation/reports/[reportId]">;

export const metadata: Metadata = { title: "Meldung · Moderation" };

async function ReportDetail({ params }: Pick<Props, "params">) {
  const { reportId } = await params;
  return (
    <ModerationGate>
      <ReportDetailView reportId={reportId} />
    </ModerationGate>
  );
}

export default function ReportDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
      <ReportDetail params={params} />
    </Suspense>
  );
}

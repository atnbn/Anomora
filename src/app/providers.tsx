"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Anime } from "@/features/anime/types";
import { CatalogProvider } from "@/features/anime/catalog-provider";
import { DemoProvider } from "@/features/demo/demo-provider";

export function Providers({
  catalog,
  fetchedAt,
  children,
}: {
  catalog: Anime[] | null;
  fetchedAt: number | null;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <CatalogProvider catalog={catalog} fetchedAt={fetchedAt}>
          <DemoProvider>{children}</DemoProvider>
        </CatalogProvider>
        <Toaster
          position="bottom-center"
          offset={{ bottom: 88 }}
          mobileOffset={{ bottom: 88 }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}

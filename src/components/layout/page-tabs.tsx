"use client";

import { Tabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export type PageTab = {
  value: string;
  label: string;
  count?: number;
  content: React.ReactNode;
};

/** Seiten-Tabs im Pill-Stil des Videos; horizontal scrollbar auf kleinen Displays. */
export function PageTabs({
  tabs,
  defaultValue,
  label,
  className,
}: {
  tabs: PageTab[];
  defaultValue?: string;
  label: string;
  className?: string;
}) {
  return (
    <Tabs.Root
      defaultValue={defaultValue ?? tabs[0]?.value}
      className={cn("flex min-w-0 flex-col gap-5", className)}
    >
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <Tabs.List aria-label={label} className="flex w-max gap-1.5">
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none",
                "hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                "data-[active]:border-primary data-[active]:bg-primary data-[active]:text-primary-foreground",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular in-data-[active]:bg-black/20">
                  {tab.count}
                </span>
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </div>
      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.value}
          value={tab.value}
          className="min-w-0 outline-none"
        >
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

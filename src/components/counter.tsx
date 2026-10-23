"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// useState speichert den Wert zwischen den Render-Durchläufen.
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button onClick={() => setCount((previous) => previous + 1)}>
        Klick hinzufügen
      </Button>
      <p role="status" className="tabular-nums">
        {count} {count === 1 ? "Klick" : "Klicks"}
      </p>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FlaskConicalIcon, LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  demoActions,
  hydrateDemoState,
  useDemoState,
} from "@/features/demo/store";
import { startClock } from "@/features/demo/clock";
import { loadRememberedAnime } from "@/features/anime/anime-cache";
import { startAuthSync } from "@/features/auth/supabase-auth";

/** Lädt den lokalen Demo-Zustand, startet die Uhr und zeigt den Anmelde-Hinweis. */
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { authPrompt } = useDemoState();
  const router = useRouter();

  function goTo(path: "/login" | "/register") {
    demoActions.closeAuthPrompt();
    const next = encodeURIComponent(window.location.pathname);
    router.push(path === "/login" ? `/login?next=${next}` : path);
  }

  useEffect(() => {
    // Erst gemerkte AniList-Daten laden, damit Favoriten beim Hydrieren auflösbar sind.
    loadRememberedAnime();
    hydrateDemoState();
    startClock();
    // Supabase-Sitzung (Cookies) in den Store spiegeln und auf Änderungen hören.
    return startAuthSync();
  }, []);

  return (
    <>
      {children}
      <Dialog
        open={authPrompt !== null}
        onOpenChange={(open) => {
          if (!open) demoActions.closeAuthPrompt();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Anmeldung erforderlich
            </DialogTitle>
            <DialogDescription>
              {authPrompt ?? "Für diese Aktion brauchst du ein Konto."}
            </DialogDescription>
          </DialogHeader>
          <p className="flex gap-2 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            <FlaskConicalIcon
              className="mt-0.5 size-4 shrink-0 text-brand"
              aria-hidden="true"
            />
            Demo-Modus: Konten existieren nur in diesem Browser. Mit dem
            Demo-Konto kannst du sofort weitermachen.
          </p>
          <div className="grid gap-2">
            <Button size="lg" onClick={() => goTo("/login")}>
              <LogInIcon aria-hidden="true" />
              Anmelden
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => goTo("/register")}
            >
              Konto erstellen
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => demoActions.closeAuthPrompt()}
            >
              Abbrechen
            </Button>
            <Button variant="secondary" onClick={() => demoActions.signIn()}>
              Mit Demo-Konto fortfahren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

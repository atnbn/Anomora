import { Counter } from "@/components/counter";

// Ohne "use client" bleibt die Seite eine Server Component.
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-16 sm:py-24">
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Dein Next.js-Start
        </h1>
        <p className="text-lg leading-relaxed">
          Anomora ist bereit für deine ersten Schritte mit TypeScript, App
          Router, Tailwind CSS und shadcn/ui.
        </p>
      </header>
      <section aria-labelledby="start-heading" className="space-y-4">
        <h2 id="start-heading" className="text-2xl font-semibold">
          Hier geht es los
        </h2>
        <p className="leading-relaxed">
          Bearbeite <code>src/app/page.tsx</code> und speichere die Datei. Deine
          Änderungen erscheinen automatisch im Browser. Die deutsche Anleitung
          findest du in <code>docs/EINSTIEG.md</code>.
        </p>
      </section>
      <section aria-labelledby="counter-heading" className="space-y-4">
        <h2 id="counter-heading" className="text-2xl font-semibold">
          Ein erster Klick
        </h2>
        <p className="leading-relaxed">
          Dieser Zähler ist eine Client Component mit einem shadcn-Button. Der
          Wert liegt im Browser und wird beim Neuladen zurückgesetzt.
        </p>
        <Counter />
      </section>
    </main>
  );
}

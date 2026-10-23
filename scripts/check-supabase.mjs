import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase-URL oder Publishable Key fehlt in .env.local.");
  process.exit(1);
}

try {
  // Lesender Aufruf: erstellt weder Nutzer noch Tabellen oder Datensätze.
  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error(
      `Supabase-Verbindung fehlgeschlagen: HTTP ${response.status}.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      "Supabase Auth erreichbar; Publishable Key akzeptiert (HTTP 200).",
    );
  }
} catch {
  console.error(
    "Supabase nicht erreichbar. Prüfe URL, Netzwerk und Projektstatus.",
  );
  process.exitCode = 1;
}

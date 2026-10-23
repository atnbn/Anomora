import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(`Fehlende Umgebungsvariablen: ${missing.join(", ")}`);
  console.error(
    "Trage sie lokal in .env.local oder in Vercel unter Preview ein.",
  );
  process.exit(1);
}

console.log("Benötigte Supabase-Umgebungsvariablen vorhanden.");

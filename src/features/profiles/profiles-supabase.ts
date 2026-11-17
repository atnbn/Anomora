"use client";

import {
  PUBLIC_PROFILE_COLUMNS,
  type PublicProfileRow,
  isMissingSchema,
  rowToUserProfile,
} from "@/features/profiles/profile-row";
import { getSupabase } from "@/features/auth/supabase-auth";
import { registerRemoteProfiles } from "@/lib/data/users";

/** Escaped `%`, `_` und `\`, damit `ilike` den Namen wörtlich vergleicht. */
function likeLiteral(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * Lädt das öffentliche Profil eines anderen echten Nutzers für
 * `/u/[username]` (Groß/klein egal) und registriert es in `lib/data/users`.
 * Gibt `false` zurück, wenn es kein solches Profil gibt oder die Tabelle fehlt.
 */
export async function fetchProfileByUsername(
  username: string,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .ilike("username", likeLiteral(username))
    .maybeSingle();
  if (error) {
    if (!isMissingSchema(error))
      console.warn(
        "[profiles] Profil konnte nicht geladen werden:",
        error.message,
      );
    return false;
  }
  if (!data) return false;
  registerRemoteProfiles([rowToUserProfile(data as PublicProfileRow)]);
  return true;
}

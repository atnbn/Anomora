"use client";

import { useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  CheckIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SearchXIcon,
  SunIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  FormAlert,
  TextField,
  focusFirstInvalid,
  inputClass,
} from "@/components/forms/fields";
import { EmptyState } from "@/components/feedback/states";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { AVATAR_COLORS, AVATAR_HUES } from "@/features/profiles/avatar";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import type { UserProfile } from "@/features/profiles/types";
import { demoActions, useDemoState } from "@/features/demo/store";
import {
  ACCENTS,
  setAccent,
  useAccent,
  type AccentId,
} from "@/features/themes/accent";
import { getAllGenres, listAnimeSync } from "@/lib/data/anime";
import { isUsernameTaken } from "@/lib/data/users";
import {
  BIO_MAX_LENGTH,
  type FieldErrors,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

type ProfileField = "displayName" | "username" | "bio";

export function ProfileStep({
  viewer,
  formId,
  onDone,
}: {
  viewer: UserProfile;
  formId: string;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [displayName, setDisplayName] = useState(viewer.displayName);
  const [username, setUsername] = useState(viewer.username);
  const [bio, setBio] = useState(viewer.bio ?? "");
  const [hue, setHue] = useState(viewer.avatarHue ?? AVATAR_HUES[0]);
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = username.trim();
    const nextErrors: FieldErrors<ProfileField> = {
      displayName: validateDisplayName(displayName),
      username:
        validateUsername(name) ??
        (isUsernameTaken(name, viewer.id)
          ? "Dieser Nutzername ist schon vergeben."
          : undefined),
      bio: validateBio(bio),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstInvalid(formRef.current);
      return;
    }
    demoActions.updateProfile(viewer.id, {
      displayName: displayName.trim(),
      username: name,
      bio: bio.trim() || undefined,
      avatarHue: hue,
    });
    onDone();
  }

  return (
    <form
      id={formId}
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]"
    >
      <fieldset className="flex flex-col items-center gap-4 md:items-start">
        <legend className="mb-3 text-sm font-semibold">Avatar</legend>
        <UserAvatar
          user={{ displayName: displayName || username || "?", avatarHue: hue }}
          size="xl"
          className="size-28 text-4xl"
        />
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_COLORS.map(({ hue: value, name }) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name="avatar-hue"
                value={value}
                checked={hue === value}
                onChange={() => setHue(value)}
                aria-label={`Avatarfarbe ${name}`}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring"
                style={{ backgroundColor: `oklch(0.52 0.13 ${value})` }}
              >
                {hue === value && <CheckIcon className="size-4 text-white" />}
              </span>
            </label>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground md:text-left">
          Eigene Bilder kannst du hochladen, sobald die Speicheranbindung aktiv
          ist.
        </p>
      </fieldset>

      <div className="grid content-start gap-5">
        <TextField
          label="Anzeigename"
          name="display-name"
          autoComplete="nickname"
          value={displayName}
          maxLength={40}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setErrors((current) => ({ ...current, displayName: undefined }));
          }}
          hint="So nennen dich andere, z. B. dein Vorname."
          error={errors.displayName}
        />
        <TextField
          label="Nutzername"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setErrors((current) => ({ ...current, username: undefined }));
          }}
          hint={`Dein Profil: animora.app/u/${username.trim() || "name"}`}
          error={errors.username}
        />
        <div className="grid gap-1.5">
          <label htmlFor="onboarding-bio" className="text-sm font-semibold">
            Über dich{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="onboarding-bio"
            value={bio}
            rows={3}
            onChange={(event) => {
              setBio(event.target.value);
              setErrors((current) => ({ ...current, bio: undefined }));
            }}
            placeholder="Welche Serien magst du? Schaust du Sub oder Dub?"
            aria-invalid={errors.bio ? true : undefined}
            aria-describedby="onboarding-bio-count"
            className={cn(inputClass, "h-auto resize-none py-2.5")}
          />
          <p
            id="onboarding-bio-count"
            className={cn(
              "text-right text-xs text-muted-foreground tabular",
              errors.bio && "font-semibold text-destructive",
            )}
          >
            {errors.bio ?? `${BIO_MAX_LENGTH - bio.length} Zeichen übrig`}
          </p>
        </div>
      </div>
    </form>
  );
}

export function FavoritesStep({
  formId,
  onDone,
}: {
  formId: string;
  onDone: () => void;
}) {
  const { favorites } = useDemoState();
  const [selected, setSelected] = useState<string[]>(favorites);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const genres = useMemo(() => getAllGenres().slice(0, 8), []);
  const results = listAnimeSync({
    search,
    genre: genre || undefined,
    sort: "popular",
  });

  function toggle(id: string) {
    setError(null);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (selected.length === 0) {
          setError(
            "Wähle mindestens einen Anime aus – oder überspringe diesen Schritt.",
          );
          return;
        }
        demoActions.setFavorites(selected);
        onDone();
      }}
      className="grid gap-5"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-1.5">
          <label htmlFor="favorite-search" className="text-sm font-semibold">
            Anime suchen
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="favorite-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titel, Studio oder Genre"
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </div>
        <p
          className="text-sm font-semibold text-brand sm:pb-3"
          aria-live="polite"
        >
          {selected.length} ausgewählt
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div
          role="group"
          aria-label="Nach Genre filtern"
          className="flex w-max gap-1.5"
        >
          {["", ...genres].map((option) => (
            <button
              key={option || "all"}
              type="button"
              aria-pressed={genre === option}
              onClick={() => setGenre(option)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground",
                genre === option &&
                  "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {option || "Alle"}
            </button>
          ))}
        </div>
      </div>

      {error && <FormAlert>{error}</FormAlert>}

      {results.length === 0 ? (
        <EmptyState
          compact
          icon={SearchXIcon}
          title="Kein Anime gefunden"
          description="Versuche einen anderen Suchbegriff oder ein anderes Genre."
          action={{
            label: "Suche zurücksetzen",
            onClick: () => {
              setSearch("");
              setGenre("");
            },
          }}
        />
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {results.map((anime) => {
            const active = selected.includes(anime.id);
            return (
              <li key={anime.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={anime.title}
                  onClick={() => toggle(anime.id)}
                  className="group block w-full rounded-lg text-left"
                >
                  <span className="relative block">
                    <AnimeCover
                      anime={anime}
                      showTitle
                      className={cn(
                        "transition-[box-shadow,opacity] duration-150",
                        active
                          ? "ring-3 ring-primary ring-offset-2 ring-offset-background"
                          : "group-hover:opacity-90",
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full border-2 border-white/80 bg-black/40 text-white transition-colors",
                        active && "border-primary bg-primary",
                      )}
                    >
                      {active && <CheckIcon className="size-4" />}
                    </span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-xs leading-snug font-semibold">
                    {anime.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}

const MODES = [
  { value: "dark", label: "Dunkel", icon: MoonIcon },
  { value: "light", label: "Hell", icon: SunIcon },
  { value: "system", label: "Wie System", icon: MonitorIcon },
] as const;

export function AppearanceStep({
  formId,
  onDone,
}: {
  formId: string;
  onDone: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const { preferences } = useDemoState();

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onDone();
      }}
      className="grid gap-8"
    >
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Farbschema</legend>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((mode) => (
            <label key={mode.value} className="relative">
              <input
                type="radio"
                name="theme-mode"
                value={mode.value}
                checked={(theme ?? "dark") === mode.value}
                onChange={() => setTheme(mode.value)}
                className="peer sr-only"
              />
              <span className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border bg-card p-3 text-sm font-semibold transition-colors peer-checked:border-primary peer-checked:bg-brand-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-accent">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-14 w-full overflow-hidden rounded-md border",
                    mode.value === "light" && "bg-[#f8f6f3]",
                    mode.value === "dark" && "bg-[#1a1714]",
                    mode.value === "system" &&
                      "bg-linear-to-r from-[#f8f6f3] from-50% to-[#1a1714] to-50%",
                  )}
                >
                  <span className="m-2 h-2 w-8 rounded-full bg-primary" />
                </span>
                <span className="flex items-center gap-1.5">
                  <mode.icon className="size-4" aria-hidden="true" />
                  {mode.label}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Akzentfarbe</legend>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((option) => (
            <label key={option.id} className="relative">
              <input
                type="radio"
                name="accent"
                value={option.id}
                checked={accent === option.id}
                onChange={() => setAccent(option.id as AccentId)}
                className="peer sr-only"
              />
              <span className="flex h-11 cursor-pointer items-center gap-2 rounded-full border bg-card pr-4 pl-1.5 text-sm font-semibold peer-checked:border-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-accent">
                <span
                  aria-hidden="true"
                  className="size-8 rounded-full"
                  style={{ backgroundColor: option.swatch }}
                />
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
        <div>
          <p id="spoiler-pref" className="text-sm font-semibold">
            Spoilerschutz
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Verdeckt markierte Spoiler und Inhalte zu Folgen, die du noch nicht
            gesehen hast.
          </p>
        </div>
        <Switch
          aria-labelledby="spoiler-pref"
          checked={preferences.spoilerProtection}
          onCheckedChange={(checked) =>
            demoActions.setPreference("spoilerProtection", checked)
          }
        />
      </div>
    </form>
  );
}

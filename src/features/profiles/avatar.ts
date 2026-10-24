/** Farben für generierte Avatare – alle mit ausreichend Kontrast zur weißen Initiale. */
export const AVATAR_COLORS = [
  { hue: 28, name: "Orange" },
  { hue: 0, name: "Rot" },
  { hue: 338, name: "Pink" },
  { hue: 300, name: "Magenta" },
  { hue: 268, name: "Violett" },
  { hue: 222, name: "Blau" },
  { hue: 196, name: "Petrol" },
  { hue: 162, name: "Türkis" },
  { hue: 138, name: "Grün" },
  { hue: 44, name: "Ocker" },
] as const;

export const AVATAR_HUES: number[] = AVATAR_COLORS.map((color) => color.hue);

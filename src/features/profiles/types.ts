export type UserRole = "member" | "moderator";

export type UserBadge = "verified" | "team";

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  /** Hue (0–360) für den generierten Avatar; ein echter Upload ersetzt das später. */
  avatarHue?: number;
  role: UserRole;
  badges: UserBadge[];
  favoriteAnimeIds: string[];
  joinedAt: string;
  /** Unvollständige Profile zeigen im UI einen Hinweis statt leerer Flächen. */
  profileComplete: boolean;
};

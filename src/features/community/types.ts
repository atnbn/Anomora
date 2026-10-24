export type PostCategory =
  "discussion" | "fanart" | "cosplay" | "news" | "collection";

export type PostMedia = {
  /** Demo-Artwork auf Basis des Anime-Covers – kein echtes Nutzerfoto. */
  kind: "anime-art";
  animeId: string;
  variant: number;
  alt: string;
};

export type Post = {
  id: string;
  authorId: string;
  body: string;
  animeId?: string;
  episodeId?: string;
  category: PostCategory;
  media: PostMedia[];
  containsSpoiler: boolean;
  createdAt: string;
  editedAt?: string;
  /** Likes anderer Nutzer aus den Demo-Daten; eigene Likes liegen im lokalen Store. */
  baseLikeCount: number;
  /** Demo-Beiträge werden mit der Uhr verschoben, damit sie aktuell wirken. */
  seeded?: boolean;
};

export type Comment = {
  id: string;
  authorId: string;
  /** Entweder ein Beitrag oder eine Episode. */
  target:
    { type: "post"; postId: string } | { type: "episode"; episodeId: string };
  parentId?: string;
  body: string;
  containsSpoiler: boolean;
  createdAt: string;
  baseLikeCount: number;
  seeded?: boolean;
};

export type FeedFilter =
  "all" | "following" | "popular" | "discussion" | "fanart" | "cosplay";

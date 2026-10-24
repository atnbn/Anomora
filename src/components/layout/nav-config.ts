import type { LucideIcon } from "lucide-react";
import {
  CompassIcon,
  HeartIcon,
  HouseIcon,
  MessagesSquareIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Kürzere Beschriftung für die mobile Tab-Leiste. */
  shortLabel?: string;
  icon: LucideIcon;
  /** Weitere Pfade, die diesen Eintrag aktiv markieren. */
  match: (pathname: string) => boolean;
};

export const primaryNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: HouseIcon,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/anime",
    label: "Entdecken",
    icon: CompassIcon,
    match: (pathname) =>
      pathname === "/anime" || pathname.startsWith("/anime/"),
  },
  {
    href: "/my-anime",
    label: "Meine Anime",
    shortLabel: "Favoriten",
    icon: HeartIcon,
    match: (pathname) => pathname.startsWith("/my-anime"),
  },
  {
    href: "/community",
    label: "Community",
    icon: MessagesSquareIcon,
    match: (pathname) => pathname.startsWith("/community"),
  },
];

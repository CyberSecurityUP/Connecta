export type PresenceStatus = "online" | "away" | "dnd" | "offline";

export interface CustomStatus {
  emoji: string;
  text: string;
  expiresAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  title?: string | null;
  bio?: string | null;
  timezone: string;
  status: PresenceStatus;
  customStatus?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  phone?: string | null;
}

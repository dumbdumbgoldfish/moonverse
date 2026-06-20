export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  reviewCount: number;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface UpdateProfileInput {
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

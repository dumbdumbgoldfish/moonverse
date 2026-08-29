export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  profileBackgroundUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProfileFollowingUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  reviewCount: number;
  followerCount: number;
  followingCount: number;
  readingListCount: number;
  isFollowing: boolean;
  followedAt: string;
}

export interface UserSettings {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  profileBackgroundUrl: string | null;
}

export interface UpdateProfileInput {
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  profileBackgroundUrl?: string | null;
}

export type Platform = "twitter" | "instagram" | "linkedin";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  platforms: Platform[];
  scheduled_at: string | null;
  published_at: string | null;
  status: PostStatus;
  media: MediaItem[];
  hashtags: string[];
  engagement?: Record<string, Record<string, number>>;
  created_at: string;
}

export interface DashboardStats {
  total_posts: number;
  scheduled_posts: number;
  published_posts: number;
  failed_posts: number;
  total_engagement: number;
  top_platform: Platform | null;
}

export interface HashtagResponse {
  hashtags: string[];
  suggested_caption?: string;
}

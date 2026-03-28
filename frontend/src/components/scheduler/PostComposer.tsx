"use client";
import { useState } from "react";
import { postsApi, hashtagsApi } from "@/lib/api";
import { Platform } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PLATFORM_ICONS } from "@/lib/utils";
import toast from "react-hot-toast";
import { Sparkles, Send, Clock } from "lucide-react";

const PLATFORMS: Platform[] = ["twitter", "instagram", "linkedin"];

interface Props {
  onSuccess?: () => void;
  initialPost?: Partial<{
    id: string;
    content: string;
    platforms: Platform[];
    hashtags: string[];
    scheduled_at: string;
  }>;
}

export function PostComposer({ onSuccess, initialPost }: Props) {
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(
    initialPost?.platforms ?? ["twitter"]
  );
  const [hashtags, setHashtags] = useState<string[]>(initialPost?.hashtags ?? []);
  const [scheduledAt, setScheduledAt] = useState(initialPost?.scheduled_at ?? "");
  const [loadingTags, setLoadingTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const generateHashtags = async () => {
    if (!content.trim()) return toast.error("Write some content first");
    setLoadingTags(true);
    try {
      const { data } = await hashtagsApi.generate(content, 10, selectedPlatforms);
      setHashtags(data.hashtags);
      toast.success("Hashtags generated!");
    } catch {
      toast.error("Failed to generate hashtags");
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Content is required");
    if (!selectedPlatforms.length) return toast.error("Select at least one platform");

    setSubmitting(true);
    try {
      const payload = {
        content,
        platforms: selectedPlatforms,
        hashtags,
        scheduled_at: scheduledAt || undefined,
      };

      if (initialPost?.id) {
        await postsApi.update(initialPost.id, payload);
        toast.success("Post updated!");
      } else {
        await postsApi.create(payload);
        toast.success(scheduledAt ? "Post scheduled!" : "Post published!");
      }

      onSuccess?.();
      if (!initialPost?.id) {
        setContent("");
        setHashtags([]);
        setScheduledAt("");
        setSelectedPlatforms(["twitter"]);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = content.length;
  const twitterWarning = selectedPlatforms.includes("twitter") && charCount > 240;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-800">
          {initialPost?.id ? "Edit Post" : "Create New Post"}
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Platforms
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedPlatforms.includes(p)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span>{PLATFORM_ICONS[p]}</span>
                  <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content textarea */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Caption / Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write your post content here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-between mt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateHashtags}
                loading={loadingTags}
              >
                <Sparkles size={14} />
                AI Generate Hashtags
              </Button>
              <span className={`text-xs ${twitterWarning ? "text-red-500" : "text-gray-400"}`}>
                {charCount} {twitterWarning && "/ 280 (Twitter limit)"}
              </span>
            </div>
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block flex items-center gap-1">
              <Clock size={12} /> Schedule (optional — leave blank to post now)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            <Send size={16} />
            {scheduledAt ? "Schedule Post" : initialPost?.id ? "Save Changes" : "Post Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

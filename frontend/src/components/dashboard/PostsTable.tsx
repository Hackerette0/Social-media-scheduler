"use client";
import { Post } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, PLATFORM_ICONS } from "@/lib/utils";
import { Trash2, Pencil } from "lucide-react";

interface Props {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
}

export function PostsTable({ posts, onEdit, onDelete }: Props) {
  if (!posts.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">📭</p>
        <p>No posts yet. Create your first post!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="pb-3 pr-4 font-medium">Content</th>
            <th className="pb-3 pr-4 font-medium">Platforms</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Scheduled</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4 max-w-xs">
                <p className="truncate text-gray-800">{post.content}</p>
                {post.hashtags.length > 0 && (
                  <p className="text-xs text-brand-600 mt-0.5 truncate">
                    {post.hashtags.slice(0, 3).join(" ")}
                    {post.hashtags.length > 3 && " …"}
                  </p>
                )}
              </td>
              <td className="py-3 pr-4">
                <div className="flex gap-1 flex-wrap">
                  {post.platforms.map((p) => (
                    <Badge key={p} label={p} />
                  ))}
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge label={post.status} />
              </td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                {post.scheduled_at ? formatDate(post.scheduled_at) : "—"}
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(post)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(post.id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Post } from "@/types";
import { PLATFORM_COLORS } from "@/lib/utils";

interface Props {
  posts: Post[];
}

export function EngagementChart({ posts }: Props) {
  // Aggregate engagement by platform
  const platformData: Record<string, Record<string, number>> = {};

  for (const post of posts) {
    if (!post.engagement) continue;
    for (const [platform, metrics] of Object.entries(post.engagement)) {
      if (!platformData[platform]) platformData[platform] = { likes: 0, comments: 0, shares: 0 };
      for (const [k, v] of Object.entries(metrics)) {
        platformData[platform][k] = (platformData[platform][k] ?? 0) + (v as number);
      }
    }
  }

  const chartData = Object.entries(platformData).map(([platform, metrics]) => ({
    platform,
    ...metrics,
  }));

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No engagement data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="likes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="comments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="shares" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

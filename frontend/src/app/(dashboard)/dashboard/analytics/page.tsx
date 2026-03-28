"use client";
import { useQuery } from "@tanstack/react-query";
import { postsApi, analyticsApi } from "@/lib/api";
import { Post } from "@/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { EngagementChart } from "@/components/scheduler/EngagementChart";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#3b82f6", "#ec4899", "#0ea5e9"];

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["posts-all"],
    queryFn: () => postsApi.list({ limit: 200 }).then((r) => r.data as Post[]),
  });

  // Platform distribution
  const platformCount: Record<string, number> = {};
  for (const post of allPosts) {
    for (const p of post.platforms) {
      platformCount[p] = (platformCount[p] ?? 0) + 1;
    }
  }
  const pieData = Object.entries(platformCount).map(([name, value]) => ({ name, value }));

  // Top performing posts
  const topPosts = [...allPosts]
    .filter((p) => p.engagement)
    .sort((a, b) => {
      const sumEng = (post: Post) =>
        Object.values(post.engagement ?? {}).reduce(
          (total, metrics) => total + Object.values(metrics).reduce((s, v) => s + (v as number), 0),
          0
        );
      return sumEng(b) - sumEng(a);
    })
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your content performance across platforms</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Engagement by Platform</h2>
          </CardHeader>
          <CardContent>
            <EngagementChart posts={allPosts} />
          </CardContent>
        </Card>

        {/* Platform distribution */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Posts by Platform</h2>
          </CardHeader>
          <CardContent>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top posts */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Top Performing Posts</h2>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-gray-400 text-sm">No engagement data yet. Publish some posts!</p>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {post.platforms.map((p) => <Badge key={p} label={p} />)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {post.engagement && Object.entries(post.engagement).map(([platform, metrics]) => (
                      <div key={platform} className="text-xs text-gray-500">
                        {Object.entries(metrics).map(([k, v]) => (
                          <span key={k} className="mr-2">
                            {k}: <strong className="text-gray-800">{v}</strong>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

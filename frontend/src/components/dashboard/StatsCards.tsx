"use client";
import { DashboardStats } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";

interface Props {
  stats: DashboardStats;
}

const metrics = (s: DashboardStats) => [
  { label: "Total Posts", value: s.total_posts, color: "text-brand-600", bg: "bg-brand-50" },
  { label: "Scheduled", value: s.scheduled_posts, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Published", value: s.published_posts, color: "text-green-600", bg: "bg-green-50" },
  { label: "Total Engagement", value: s.total_engagement.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
];

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics(stats).map((m) => (
        <Card key={m.label}>
          <CardContent className={`flex flex-col gap-1 ${m.bg} rounded-xl`}>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

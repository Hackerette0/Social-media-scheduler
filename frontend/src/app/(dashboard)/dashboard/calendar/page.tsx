"use client";
import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { Post } from "@/types";
import { PLATFORM_COLORS, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postsApi.list({ status_filter: "scheduled", limit: 100 }).then((r) => r.data as Post[]),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const postsOnDay = (day: Date) =>
    posts.filter((p) => p.scheduled_at && isSameDay(parseISO(p.scheduled_at), day));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-gray-800 w-40 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
            {d}
          </div>
        ))}

        {/* Empty cells before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dayPosts = postsOnDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[90px] rounded-xl border p-2 text-sm transition-colors ${
                isToday ? "border-brand-400 bg-brand-50" : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  isToday ? "text-brand-700" : "text-gray-500"
                }`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="text-xs bg-brand-100 text-brand-800 rounded px-1.5 py-0.5 truncate"
                    title={post.content}
                  >
                    {post.content.slice(0, 20)}…
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-xs text-gray-400">+{dayPosts.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming posts list */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Upcoming Scheduled Posts</h2>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-gray-400 text-sm">No scheduled posts this month.</p>
          ) : (
            <div className="space-y-3">
              {posts
                .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
                .slice(0, 10)
                .map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{post.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {post.scheduled_at ? formatDate(post.scheduled_at) : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {post.platforms.map((p) => (
                        <Badge key={p} label={p} />
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

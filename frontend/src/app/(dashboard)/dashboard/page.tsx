"use client";
import { useState, useEffect } from "react";
import {
  TrendingUp, Hash, Zap, Instagram, Linkedin, Twitter, Facebook,
  PlusCircle, BarChart2, ArrowUpRight, Clock, CheckCircle, AlertCircle,
  RefreshCcw, Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TypewriterHero } from "@/components/ui/TypewriterHero";
import { analyticsApi, postsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// ── Static data ───────────────────────────────────────────────────────────────

const HASHTAG_TRENDING = [
  { tag: "#like4like",       status: "Banned",     risk: "high" },
  { tag: "#followme",        status: "Banned",     risk: "high" },
  { tag: "#loseweight",      status: "Banned",     risk: "high" },
  { tag: "#bikinibody",      status: "Banned",     risk: "high" },
  { tag: "#beautyblogger",   status: "Restricted", risk: "med"  },
  { tag: "#hardworkpaysoff", status: "Restricted", risk: "med"  },
  { tag: "#saltwater",       status: "Restricted", risk: "med"  },
  { tag: "#curvy",           status: "Restricted", risk: "med"  },
];

const PLATFORMS_DEF = [
  { id: "instagram", label: "Instagram", Icon: Instagram, cls: "bg-gradient-to-br from-pink-500 to-purple-600" },
  { id: "linkedin",  label: "LinkedIn",  Icon: Linkedin,  cls: "bg-blue-600" },
  { id: "twitter",   label: "Twitter",   Icon: Twitter,   cls: "bg-sky-500"  },
  { id: "facebook",  label: "Facebook",  Icon: Facebook,  cls: "bg-blue-800" },
];

// Deterministic heatmap — avoids Math.random() hydration mismatch
const HEATMAP = Array.from({ length: 28 }, (_, i) =>
  +(0.1 + (((i * 7 + 13) % 17) / 17) * 0.8).toFixed(2)
);

// ── Sub-components ────────────────────────────────────────────────────────────

function VCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`vintage-card rounded-vintage p-4 shadow-card ${className}`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-accent text-[10px] tracking-[0.2em] text-ink-light uppercase mb-3">{children}</p>;
}

function StatPill({ label, value, icon: Icon, up }: { label: string; value: string; icon: React.ElementType; up?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-blush last:border-0">
      <div className="flex items-center gap-1.5 text-ink-mid">
        <Icon size={12} strokeWidth={1.8} className="text-sage" />
        <span className="font-body text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-display font-semibold text-sm text-ink">{value}</span>
        {up !== undefined && (
          <ArrowUpRight size={10} className={up ? "text-sage" : "text-rose rotate-90"} />
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"insights" | "hashtags" | "analytics">("insights");

  // ── Current date ──
  const now          = new Date();
  const today        = now.getDate();
  const year         = now.getFullYear();
  const month        = now.getMonth();
  const monthName    = now.toLocaleString("default", { month: "long" });
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const CALENDAR_DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ── API state ──
  type Stats = {
    total_posts: number; scheduled_posts: number;
    published_posts: number; failed_posts: number;
    total_engagement: number; top_platform: string | null;
  };
  const [stats, setStats]               = useState<Stats | null>(null);
  const [scheduledDays, setScheduledDays] = useState<Record<number, string[]>>({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    (async () => {
      const [statsRes, postsRes] = await Promise.allSettled([
        analyticsApi.dashboard(),
        postsApi.list({ status_filter: "scheduled", limit: 100 }),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);

      if (postsRes.status === "fulfilled") {
        const posts: { scheduled_at?: string; platforms?: string[] }[] =
          postsRes.value.data?.posts ?? postsRes.value.data ?? [];
        const byDay: Record<number, string[]> = {};
        const dotMap: Record<string, string> = {
          instagram: "dot-ig", linkedin: "dot-li", twitter: "dot-tw", facebook: "dot-fb",
        };
        for (const post of posts) {
          if (!post.scheduled_at) continue;
          const d = new Date(post.scheduled_at);
          if (d.getFullYear() !== year || d.getMonth() !== month) continue;
          const day = d.getDate();
          if (!byDay[day]) byDay[day] = [];
          for (const p of (post.platforms ?? [])) {
            const cls = dotMap[p];
            if (cls && !byDay[day].includes(cls)) byDay[day].push(cls);
          }
        }
        setScheduledDays(byDay);
      }
      setLoading(false);
    })();
  }, [year, month]);

  // ── Derived values ──
  const draftCount     = stats ? Math.max(0, stats.total_posts - stats.scheduled_posts - stats.published_posts - stats.failed_posts) : 0;
  const avgEngagement  = stats?.published_posts ? Math.round(stats.total_engagement / stats.published_posts) : 0;
  const total          = stats?.total_posts || 1;

  const QUEUE_POSTS = [
    { id: 1, label: "AI Drafts",  status: "draft",     count: loading ? "—" : String(draftCount),                color: "bg-blush-dark" },
    { id: 2, label: "Post Queue", status: "queued",    count: loading ? "—" : String(stats?.scheduled_posts ?? 0), color: "bg-sage-light" },
    { id: 3, label: "Published",  status: "published", count: loading ? "—" : String(stats?.published_posts ?? 0), color: "bg-gold-light" },
    { id: 4, label: "Failed",     status: "failed",    count: loading ? "—" : String(stats?.failed_posts ?? 0),    color: "bg-rose/30"    },
  ];

  const workflowData = [
    { label: "Drafts",    pct: Math.round(draftCount / total * 100),                  color: "bg-blush-dark" },
    { label: "Scheduled", pct: Math.round((stats?.scheduled_posts ?? 0) / total * 100), color: "bg-sage-light" },
    { label: "Published", pct: Math.round((stats?.published_posts ?? 0) / total * 100), color: "bg-gold-light" },
    { label: "Failed",    pct: Math.round((stats?.failed_posts ?? 0) / total * 100),    color: "bg-rose/50"    },
  ];

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen p-5 space-y-4">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="font-type text-xs text-ink-light italic mt-0.5">Your content command centre</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/content-gen")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-vintage bg-forest text-paper font-body text-xs font-semibold hover:bg-forest-mid transition-all shadow-card"
          >
            <PlusCircle size={13} /> New Post
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-vintage border border-blush-dark text-ink-mid font-body text-xs hover:bg-blush transition-all"
          >
            <RefreshCcw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Row 1: Hero + Overview ──────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Typewriter Hero */}
        <div className="col-span-7 relative overflow-hidden rounded-vintage min-h-[260px] bg-forest-mid shadow-vintage-lg">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, #c4973a 28px, #c4973a 29px)" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-forest/80 via-forest-mid to-forest" />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-forest opacity-60" />
          <div className="absolute top-4 left-4 right-4 h-px bg-gold/20" />
          <div className="relative z-10 p-8 flex flex-col h-full justify-between">
            <div>
              <p className="font-accent text-gold/70 tracking-[0.3em] text-[10px] uppercase mb-4">SocialFlow Publishing Studio</p>
              <div className="font-elegant text-3xl italic text-blush leading-snug mb-2">The Vintage Chronicle</div>
              <div className="h-px w-24 bg-gold/30 mb-5" />
              <TypewriterHero className="text-lg text-paper/90 leading-relaxed" />
            </div>
            <div className="flex items-end justify-between mt-6">
              <div className="flex gap-2">
                {["AI GEN", "# HASHTAG GENIUS", "SMART SCHEDULING"].map((label) => (
                  <span key={label} className="font-accent text-[10px] tracking-widest text-gold/80 border border-gold/30 px-2 py-1 rounded-vintage hover:border-gold hover:text-gold transition-all cursor-pointer">
                    {label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => router.push("/dashboard/content-gen")}
                className="font-accent text-xs tracking-widest bg-gold text-forest px-4 py-1.5 rounded-vintage hover:bg-gold-light transition-all shadow-md"
              >
                START NOW
              </button>
            </div>
          </div>
        </div>

        {/* Overview panel */}
        <div className="col-span-5 flex flex-col gap-3">

          <VCard className="bg-parchment">
            <div className="flex items-center justify-between mb-1">
              <p className="font-accent text-[9px] tracking-[0.2em] text-ink-light uppercase">Welcome</p>
              <span className="font-type text-[10px] text-sage italic">@{displayName}</span>
            </div>
            <h2 className="font-display text-base font-bold text-ink">Dashboard Overview</h2>
            <div className="flex gap-1 mt-2 border-b border-blush">
              {(["insights","hashtags","analytics"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`font-body text-[10px] px-2 py-1 capitalize transition-all ${activeTab === t ? "border-b-2 border-forest text-forest font-semibold" : "text-ink-light hover:text-ink"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </VCard>

          <VCard>
            <SectionLabel>Post Insights</SectionLabel>
            <div className="space-y-0.5">
              <StatPill
                label="Total Engagement"
                value={loading ? "—" : (stats?.total_engagement ?? 0).toLocaleString()}
                icon={TrendingUp}
                up={true}
              />
              <StatPill
                label="Avg per Published Post"
                value={loading ? "—" : avgEngagement > 0 ? avgEngagement.toLocaleString() : "N/A"}
                icon={BarChart2}
                up={true}
              />
              {stats?.top_platform && (
                <StatPill label="Top Platform" value={stats.top_platform} icon={Hash} />
              )}
            </div>
          </VCard>

          <VCard>
            <SectionLabel>Workflow Status</SectionLabel>
            <div className="space-y-1">
              {workflowData.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${w.color}`} />
                  <div className="flex-1 h-1.5 bg-blush rounded-full overflow-hidden">
                    <div className={`h-full ${w.color} rounded-full transition-all`} style={{ width: `${w.pct}%` }} />
                  </div>
                  <span className="font-body text-[10px] text-ink-light w-20 truncate">{w.label}</span>
                </div>
              ))}
            </div>
          </VCard>
        </div>
      </div>

      {/* ── Row 2: Hashtag Banning + Library + Create ───────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Banned Hashtags */}
        <div className="col-span-3">
          <VCard className="h-full">
            <SectionLabel>Banned Hashtags</SectionLabel>
            <div className="space-y-1.5">
              {HASHTAG_TRENDING.map((h, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="font-type text-xs text-rose font-semibold truncate">{h.tag}</span>
                  <span className={`font-body text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                    h.risk === "high" ? "bg-rose/15 text-rose font-semibold" : "bg-gold/20 text-gold-dark font-medium"
                  }`}>{h.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-blush flex gap-1.5">
              <button
                onClick={() => router.push("/dashboard/content-gen")}
                className="flex-1 text-[10px] font-body font-semibold bg-forest text-paper py-1.5 rounded-vintage hover:bg-forest-mid transition-all"
              >
                Create Now
              </button>
              <button
                onClick={() => router.push("/dashboard/calendar")}
                className="flex-1 text-[10px] font-body border border-blush-dark text-ink-mid py-1.5 rounded-vintage hover:bg-blush transition-all"
              >
                View Library
              </button>
            </div>
          </VCard>
        </div>

        {/* Library & Queue */}
        <div className="col-span-5">
          <VCard className="h-full">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Library &amp; Queue</SectionLabel>
              <input
                placeholder="Search…"
                className="font-body text-[10px] border border-blush-dark rounded-vintage px-2 py-1 bg-parchment text-ink focus:outline-none focus:border-sage w-28"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {QUEUE_POSTS.map((p) => (
                <div key={p.id} className={`rounded-vintage px-3 py-2 ${p.color} flex items-center justify-between`}>
                  <div>
                    <p className="font-body text-[10px] font-semibold text-ink-mid">{p.label}</p>
                    <p className="font-accent text-base text-ink leading-none">{p.count}</p>
                  </div>
                  {p.status === "published" && <CheckCircle size={14} className="text-sage" />}
                  {p.status === "failed"    && <AlertCircle size={14} className="text-rose" />}
                  {p.status === "draft"     && <Layers      size={14} className="text-ink-light" />}
                  {p.status === "queued"    && <Clock       size={14} className="text-ink-mid" />}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="queue-thumb aspect-square rounded-vintage flex items-center justify-center">
                  <div className="w-full h-full opacity-40 flex items-end p-1.5">
                    <div className="space-y-0.5 w-full">
                      <div className="h-1 bg-ink-light/40 rounded-full w-3/4" />
                      <div className="h-1 bg-ink-light/30 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </VCard>
        </div>

        {/* Create New Content */}
        <div className="col-span-4">
          <VCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Create New Content</SectionLabel>
              <span className="font-body text-[10px] text-ink-light">{monthName} {year}</span>
            </div>
            <div className="flex gap-1.5 mb-3">
              {["AI Caption", "Hashtags", "Schedule"].map((t) => (
                <button key={t} className="font-body text-[9px] border border-blush-dark text-ink-mid px-2 py-1 rounded-vintage hover:bg-blush transition-all">
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <p className="font-body text-[10px] font-semibold text-ink-mid mb-1">Prompt Input</p>
                  <textarea
                    rows={3}
                    placeholder="Write a post about skincare…"
                    className="w-full font-type text-[10px] text-ink bg-parchment border border-blush-dark rounded-vintage p-2 resize-none focus:outline-none focus:border-sage"
                  />
                </div>
                <button
                  onClick={() => router.push("/dashboard/content-gen")}
                  className="w-full font-accent text-[11px] tracking-widest bg-forest text-paper py-2 rounded-vintage hover:bg-forest-mid transition-all"
                >
                  GENERATE HASHTAGS
                </button>
              </div>
              <div className="w-24 flex flex-col gap-1.5">
                <p className="font-body text-[10px] font-semibold text-ink-mid">Thumbnail:</p>
                <div className="flex-1 queue-thumb rounded-vintage min-h-[60px]" />
                <button
                  onClick={() => router.push("/dashboard/compose")}
                  className="font-accent text-[10px] tracking-widest bg-sage text-paper py-1.5 rounded-vintage hover:bg-forest-light transition-all"
                >
                  SCHEDULE
                </button>
              </div>
            </div>
          </VCard>
        </div>
      </div>

      {/* ── Row 3: Calendar + Integrations ──────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Content Calendar */}
        <div className="col-span-7">
          <VCard>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Content Calendar — {monthName} {year}</SectionLabel>
              <div className="flex gap-2 text-[10px] font-body">
                {["Post", "Carousel", "All Types"].map((t) => (
                  <span key={t} className="text-ink-light hover:text-ink cursor-pointer">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mb-3">
              {["IG","LI","TW","FB"].map((p, i) => (
                <div key={p} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${["dot-ig","dot-li","dot-tw","dot-fb"][i]}`} />
                  <span className="font-body text-[9px] text-ink-light">{p}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="font-body text-[9px] text-ink-light text-center pb-1">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e-${i}`} />)}
              {CALENDAR_DAYS.map((day) => (
                <div
                  key={day}
                  className={`relative flex flex-col items-center py-1 rounded-vintage text-center cursor-pointer hover:bg-blush transition-all ${day === today ? "bg-forest text-paper font-semibold" : "text-ink-mid"}`}
                >
                  <span className="font-body text-[11px]">{day}</span>
                  {scheduledDays[day] && (
                    <div className="flex gap-0.5 mt-0.5">
                      {scheduledDays[day].map((cls, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${cls}`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-blush">
              <div className="flex gap-4">
                <div>
                  <p className="font-body text-[9px] text-ink-light mb-1">Post Status Mix</p>
                  <div className="flex gap-0.5 items-end h-8">
                    {workflowData.map((w, i) => (
                      <div key={i} className={`w-5 rounded-t-sm ${w.color} hover:opacity-80 transition-all`} style={{ height: `${Math.max(4, w.pct)}%` }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-body text-[9px] text-ink-light mb-1">Activity Heatmap</p>
                  <div className="grid grid-cols-7 gap-0.5">
                    {HEATMAP.map((v, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(125,144,112,${v})` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </VCard>
        </div>

        {/* Integrations & Settings */}
        <div className="col-span-5">
          <VCard className="h-full">
            <SectionLabel>Integrations &amp; Settings</SectionLabel>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PLATFORMS_DEF.map(({ id, label, Icon, cls }) => (
                <div key={id} className="flex items-center gap-2 p-2 rounded-vintage border border-blush hover:border-blush-dark transition-all">
                  <div className={`w-7 h-7 rounded-vintage ${cls} flex items-center justify-center shrink-0`}>
                    <Icon size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[10px] font-semibold text-ink truncate">{label}</p>
                    <button
                      onClick={() => router.push("/dashboard/integrations")}
                      className="font-type text-[9px] text-forest hover:underline"
                    >
                      → Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-blush pt-3">
              <p className="font-body text-[10px] font-semibold text-ink-mid mb-2">Account Info</p>
              <div className="space-y-1">
                {[
                  { label: "Name",  val: user?.full_name || "—" },
                  { label: "Email", val: user?.email || "—"     },
                  { label: "Plan",  val: "Free tier"            },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-body text-[9px] text-ink-light">{label}</span>
                    <span className="font-type text-[9px] text-ink truncate max-w-[120px]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-blush pt-3 mt-3">
              <p className="font-body text-[10px] font-semibold text-ink-mid mb-2">Notifications</p>
              {[
                { label: "Post published",    on: true  },
                { label: "Scheduling failed", on: true  },
                { label: "Weekly digest",     on: false },
              ].map(({ label, on }, i) => (
                <div key={i} className="flex items-center justify-between mb-1">
                  <span className="font-body text-[9px] text-ink-light">{label}</span>
                  <div className={`w-6 h-3.5 rounded-full relative cursor-pointer ${on ? "bg-sage" : "bg-blush-dark"}`}>
                    <div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 shadow-sm ${on ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/dashboard/analytics")}
              className="mt-3 w-full flex items-center justify-center gap-1.5 font-accent text-[11px] tracking-widest border border-forest text-forest py-2 rounded-vintage hover:bg-forest hover:text-paper transition-all"
            >
              <Zap size={11} /> Full Analytics
            </button>
          </VCard>
        </div>
      </div>

    </div>
  );
}

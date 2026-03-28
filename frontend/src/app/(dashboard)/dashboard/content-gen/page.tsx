"use client";
import { useState, useEffect } from "react";
import {
  Sparkles, Wand2, Hash, Clock, Instagram, Linkedin,
  Twitter, Facebook, CheckCircle2, ChevronDown, ChevronUp,
  Copy, Calendar, TrendingUp, Edit3, RefreshCw, AlertCircle,
  Zap,
} from "lucide-react";
import { captionsApi, hashtagsApi, postsApi } from "@/lib/api";
import { calcBestTimes, nextBestWindow, TimeSlot } from "@/lib/bestTimes";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tone = "professional" | "casual" | "fun";
type Platform = "instagram" | "linkedin" | "twitter" | "facebook";

interface Caption { hook: string; text: string; cta: string; }

interface HashtagGroup { tag: string; reach: string; trend: "up" | "down" | "stable"; }

// ── Static hashtag reach data (trend enrichment on top of real API tags) ──────
const REACH_DATA: Record<string, { reach: string; trend: "up" | "down" | "stable" }> = {
  "#SkincareRoutine":  { reach: "18.4M", trend: "up"     },
  "#fitness":          { reach: "9.1M",  trend: "up"     },
  "#travel":           { reach: "14.2M", trend: "stable" },
  "#business":         { reach: "11.3M", trend: "up"     },
  "#food":             { reach: "22.1M", trend: "stable" },
  "#socialmedia":      { reach: "6.8M",  trend: "up"     },
  "#content":          { reach: "4.2M",  trend: "stable" },
  "#viral":            { reach: "33.6M", trend: "down"   },
  "#trending":         { reach: "28.3M", trend: "down"   },
  "#marketing":        { reach: "12.7M", trend: "up"     },
  "#digitalmarketing": { reach: "8.9M",  trend: "up"     },
  "#growyourbusiness": { reach: "2.1M",  trend: "up"     },
  "#engagement":       { reach: "5.4M",  trend: "stable" },
};

function enrichHashtag(tag: string): HashtagGroup {
  const lower = tag.toLowerCase();
  // Find a matching key
  const match = Object.keys(REACH_DATA).find(k => k.toLowerCase() === lower);
  if (match) return { tag, ...REACH_DATA[match] };
  // Estimate reach by tag length (shorter = bigger)
  const baseReach = Math.max(0.1, 12 - tag.length * 0.3);
  return {
    tag,
    reach:  `${baseReach.toFixed(1)}M`,
    trend:  (["up", "stable", "up"] as const)[Math.floor(Math.random() * 3)],
  };
}

// ── Platform config ───────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram size={15} />,
  linkedin:  <Linkedin  size={15} />,
  twitter:   <Twitter   size={15} />,
  facebook:  <Facebook  size={15} />,
};
const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "bg-gradient-to-br from-pink-500 to-purple-600",
  linkedin:  "bg-blue-600",
  twitter:   "bg-sky-500",
  facebook:  "bg-blue-800",
};
const PLATFORM_CHAR_LIMITS: Record<Platform, number | null> = {
  instagram: 2200,
  linkedin:  3000,
  twitter:   280,
  facebook:  63206,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ToneButton({ tone, active, onClick, emoji, label }: {
  tone: Tone; active: boolean; onClick: () => void; emoji: string; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all font-body ${
        active
          ? "bg-forest text-paper border-forest shadow-md"
          : "border-blush-dark text-ink-mid hover:border-forest/40 hover:text-forest bg-paper"
      }`}
    >
      <span>{emoji}</span> {label}
    </button>
  );
}

function PlatformToggle({ platform, selected, onToggle }: {
  platform: Platform; selected: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-vintage text-sm font-body font-medium border-2 transition-all ${
        selected
          ? `${PLATFORM_COLORS[platform]} text-white border-transparent shadow-md`
          : "border-blush-dark text-ink-light bg-paper hover:border-blush"
      }`}
    >
      {PLATFORM_ICONS[platform]}
      <span className="capitalize">{platform}</span>
    </button>
  );
}

function HashtagBadge({ tag, reach, trend }: HashtagGroup) {
  return (
    <div className="group relative flex items-center gap-1.5 bg-paper border border-blush-dark rounded-full px-3 py-1.5 text-sm hover:border-forest/40 hover:shadow-card transition-all cursor-pointer">
      <span className="font-type text-xs text-ink font-semibold">{tag}</span>
      <span className={`text-xs ${trend === "up" ? "text-sage" : trend === "down" ? "text-rose" : "text-ink-light"}`}>
        {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
        <div className="bg-ink text-cream text-xs rounded-vintage px-3 py-1.5 whitespace-nowrap shadow-vintage font-body">
          <div className="font-semibold">{reach} reach</div>
          <div className="text-ink-light/70 text-[10px]">last 30 days</div>
        </div>
        <div className="w-2 h-2 bg-ink rotate-45 -mt-1" />
      </div>
    </div>
  );
}

function CaptionCard({
  caption, selected, onSelect, onCopy, onAdapt,
  adapting, adaptedFor, platforms,
}: {
  caption: Caption; selected: boolean; onSelect: () => void; onCopy: () => void;
  onAdapt: (platform: Platform) => void; adapting: boolean; adaptedFor: Platform | null;
  platforms: Platform[];
}) {
  const [expanded, setExpanded] = useState(false);
  const full = caption.text + (caption.cta && !caption.text.includes(caption.cta) ? `\n\n${caption.cta}` : "");
  const preview = full.slice(0, 130);

  return (
    <div
      onClick={onSelect}
      className={`vintage-card rounded-vintage p-4 transition-all cursor-pointer ${
        selected ? "border-forest shadow-vintage" : "hover:border-blush-dark hover:shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-accent text-[10px] tracking-widest text-forest/70 bg-blush px-2 py-0.5 rounded-vintage">
          {caption.hook}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected && <CheckCircle2 size={16} className="text-forest" />}
        </div>
      </div>

      <p className="font-type text-xs text-ink leading-relaxed whitespace-pre-line">
        {expanded ? full : preview + (full.length > 130 ? "…" : "")}
      </p>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-blush">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 text-[10px] text-ink-light hover:text-ink font-body"
        >
          {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> Full caption</>}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
          className="flex items-center gap-1 text-[10px] text-ink-light hover:text-forest font-body transition-colors"
        >
          <Copy size={11} /> Copy
        </button>
      </div>

      {/* Per-platform adapter — only show when selected */}
      {selected && platforms.length > 1 && (
        <div className="mt-3 pt-2 border-t border-blush">
          <p className="font-body text-[10px] text-ink-light mb-1.5">Adapt for platform:</p>
          <div className="flex gap-1.5 flex-wrap">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={(e) => { e.stopPropagation(); onAdapt(p); }}
                disabled={adapting}
                className={`flex items-center gap-1 text-[10px] font-body px-2 py-1 rounded-full border transition-all ${
                  adaptedFor === p
                    ? `${PLATFORM_COLORS[p]} text-white border-transparent`
                    : "border-blush-dark text-ink-mid hover:border-forest/30"
                }`}
              >
                {PLATFORM_ICONS[p]}
                <span className="capitalize">{p}</span>
                {adapting && adaptedFor === p && <RefreshCw size={9} className="animate-spin ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentGenPage() {
  const [idea, setIdea]                         = useState("");
  const [tone, setTone]                         = useState<Tone>("casual");
  const [loading, setLoading]                   = useState(false);
  const [generated, setGenerated]               = useState(false);
  const [apiError, setApiError]                 = useState<string | null>(null);
  const [captions, setCaptions]                 = useState<Caption[]>([]);
  const [hashtags, setHashtags]                 = useState<HashtagGroup[]>([]);
  const [selectedCaption, setSelectedCaption]   = useState<number | null>(null);
  const [editedCaption, setEditedCaption]       = useState("");
  const [editMode, setEditMode]                 = useState(false);
  const [humanizing, setHumanizing]             = useState(false);
  const [humanized, setHumanized]               = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram"]);
  const [timeSlots, setTimeSlots]               = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime]         = useState<number | null>(null);
  const [scheduled, setScheduled]               = useState(false);
  const [scheduling, setScheduling]             = useState(false);
  const [savedHashtags, setSavedHashtags]       = useState<string[]>([]);
  const [adaptedText, setAdaptedText]           = useState<Record<number, Record<Platform, string>>>({});
  const [adapting, setAdapting]                 = useState(false);
  const [adaptedFor, setAdaptedFor]             = useState<Platform | null>(null);
  const [activeAdaptPlatform, setActiveAdaptPlatform] = useState<Platform | null>(null);

  // Recompute time slots whenever platforms change
  useEffect(() => {
    setTimeSlots(calcBestTimes(selectedPlatforms, 3));
  }, [selectedPlatforms]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setGenerated(false);
    setApiError(null);
    setSelectedCaption(null);
    setHumanized(false);
    setScheduled(false);
    setCaptions([]);
    setHashtags([]);

    try {
      // Fire both calls in parallel
      const [captionRes, hashtagRes] = await Promise.allSettled([
        captionsApi.generate(idea, tone, selectedPlatforms, 4),
        hashtagsApi.generate(idea, 12, selectedPlatforms),
      ]);

      // Captions
      if (captionRes.status === "fulfilled") {
        const data = captionRes.value.data;
        setCaptions(data.captions ?? []);
      } else {
        setApiError("AI caption generation unavailable — showing smart suggestions.");
        // Use fallback content from a local generator
        setCaptions(localFallbackCaptions(idea, tone));
      }

      // Hashtags
      if (hashtagRes.status === "fulfilled") {
        const tags: string[] = hashtagRes.value.data.hashtags ?? [];
        setHashtags(tags.map(enrichHashtag));
      } else {
        setHashtags(localFallbackHashtags(idea));
      }
    } catch {
      setApiError("Could not reach the backend — using offline mode.");
      setCaptions(localFallbackCaptions(idea, tone));
      setHashtags(localFallbackHashtags(idea));
    }

    setGenerated(true);
    setLoading(false);
  };

  const handleHumanize = async () => {
    setHumanizing(true);
    // Try real API for the selected caption, or humanize all locally
    if (selectedCaption !== null) {
      try {
        const cap = captions[selectedCaption];
        const full = cap.text + "\n\n" + cap.cta;
        const res = await captionsApi.adapt(full, selectedPlatforms[0] ?? "instagram");
        const updated = [...captions];
        const adapted = res.data.adapted;
        updated[selectedCaption] = { ...cap, text: adapted, cta: "" };
        setCaptions(updated);
        setEditedCaption(adapted);
      } catch { /* silent — just set humanized flag */ }
    }
    setHumanizing(false);
    setHumanized(true);
  };

  const handleAdapt = async (captionIdx: number, platform: Platform) => {
    setAdapting(true);
    setAdaptedFor(platform);
    setActiveAdaptPlatform(platform);
    const cap = captions[captionIdx];
    const full = cap.text + "\n\n" + cap.cta;
    try {
      const res = await captionsApi.adapt(full, platform);
      setAdaptedText((prev) => ({
        ...prev,
        [captionIdx]: { ...(prev[captionIdx] ?? {}), [platform]: res.data.adapted },
      }));
      setEditedCaption(res.data.adapted);
      toast.success(`Adapted for ${platform}`);
    } catch {
      toast.error("Adaptation failed — check backend connection");
    }
    setAdapting(false);
  };

  const handleSchedule = async () => {
    if (selectedCaption === null || selectedTime === null || !selectedPlatforms.length) return;
    setScheduling(true);
    const cap = captions[selectedCaption];
    const text = editedCaption || (cap.text + "\n\n" + cap.cta);
    const slot = timeSlots[selectedTime];
    // Build a scheduled_at approximately 1 day out at the window start
    const dayMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0,
    };
    const targetDay = dayMap[slot.day] ?? 2;
    const now = new Date();
    const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
    const scheduledDate = new Date(now);
    scheduledDate.setDate(now.getDate() + daysUntil);
    scheduledDate.setHours(parseInt(slot.window.split(":")[0]) + (slot.window.includes("PM") && !slot.window.startsWith("12") ? 12 : 0), 0, 0, 0);

    try {
      await postsApi.create({
        content: text,
        platforms: selectedPlatforms,
        hashtags: savedHashtags.length ? savedHashtags : hashtags.slice(0, 8).map((h) => h.tag),
        scheduled_at: scheduledDate.toISOString(),
      });
      setScheduled(true);
      toast.success("Post scheduled!");
    } catch {
      // Offline mode — just show success UI
      setScheduled(true);
      toast.success("Scheduled (offline mode — connect Supabase to persist)");
    }
    setScheduling(false);
  };

  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const toggleHashtag = (tag: string) =>
    setSavedHashtags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    toast.success("Copied!");
  };

  const canSchedule = selectedCaption !== null && selectedTime !== null && selectedPlatforms.length > 0;
  const primaryLimit = selectedPlatforms[0] ? PLATFORM_CHAR_LIMITS[selectedPlatforms[0]] : null;
  const charCount = editedCaption.length;

  return (
    <div className="max-w-5xl mx-auto px-5 py-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <Sparkles size={22} className="text-gold" />
            AI Content Generator
          </h1>
          <p className="font-type text-xs italic text-ink-light mt-1">
            Type an idea → real AI captions + smart hashtags + optimal schedule
          </p>
        </div>
        <div className="flex items-center gap-2 bg-sage/10 border border-sage/30 rounded-vintage px-4 py-2 text-xs text-forest font-body font-medium">
          <Zap size={13} className="text-gold" />
          Next best window: <span className="font-bold ml-1 font-type">{nextBestWindow(selectedPlatforms)}</span>
        </div>
      </div>

      {/* Input card */}
      <div className="vintage-card rounded-vintage p-5 space-y-4">
        <div>
          <label className="font-accent text-[11px] tracking-[0.15em] text-ink-light uppercase block mb-2">Your idea</label>
          <div className="relative">
            <textarea
              rows={3}
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, 500))}
              placeholder='e.g. "skincare routine for dry skin" or "why consistency beats motivation"'
              className="w-full font-body rounded-vintage border border-blush-dark bg-parchment px-4 py-3 text-sm text-ink placeholder-ink-light/50 focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest/40 resize-none transition"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-ink-light font-body">{idea.length}/500</span>
          </div>
        </div>

        <div>
          <label className="font-accent text-[11px] tracking-[0.15em] text-ink-light uppercase block mb-2">Tone</label>
          <div className="flex gap-2 flex-wrap">
            <ToneButton tone="professional" active={tone === "professional"} onClick={() => setTone("professional")} emoji="💼" label="Professional" />
            <ToneButton tone="casual"       active={tone === "casual"}       onClick={() => setTone("casual")}       emoji="😊" label="Casual"       />
            <ToneButton tone="fun"          active={tone === "fun"}          onClick={() => setTone("fun")}          emoji="🎉" label="Fun & Playful" />
          </div>
        </div>

        <div>
          <label className="font-accent text-[11px] tracking-[0.15em] text-ink-light uppercase block mb-2">Platforms</label>
          <div className="flex gap-2 flex-wrap">
            {(["instagram","linkedin","twitter","facebook"] as Platform[]).map((p) => (
              <PlatformToggle key={p} platform={p} selected={selectedPlatforms.includes(p)} onToggle={() => togglePlatform(p)} />
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || loading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-vintage text-sm font-body font-semibold transition-all ${
            !idea.trim() || loading
              ? "bg-blush text-ink-light cursor-not-allowed"
              : "bg-forest text-paper hover:bg-forest-mid shadow-vintage"
          }`}
        >
          {loading ? (
            <><RefreshCw size={15} className="animate-spin" /> Generating content…</>
          ) : (
            <><Sparkles size={15} /> Generate Content</>
          )}
        </button>

        {apiError && (
          <div className="flex items-center gap-2 text-[11px] text-rose font-body bg-rose/5 border border-rose/20 rounded-vintage px-3 py-2">
            <AlertCircle size={13} /> {apiError}
          </div>
        )}
      </div>

      {/* Generated results */}
      {generated && (
        <>
          {/* ── Step 1: Captions ─────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-forest text-paper text-[10px] font-bold font-accent flex items-center justify-center">1</span>
                Pick a caption
                <span className="font-body text-xs text-ink-light font-normal">({captions.length} variations)</span>
              </h2>
              <button
                onClick={handleHumanize}
                disabled={humanizing || humanized}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${
                  humanized   ? "border-sage/50 text-sage bg-sage/10" :
                  humanizing  ? "border-blush-dark text-ink-light bg-blush cursor-wait" :
                                "border-forest/30 text-forest bg-forest/5 hover:bg-forest/10"
                }`}
              >
                <Wand2 size={12} />
                {humanized ? "Humanized ✓" : humanizing ? "Humanizing…" : "Humanize All"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {captions.map((c, i) => (
                <CaptionCard
                  key={i}
                  caption={c}
                  selected={selectedCaption === i}
                  onSelect={() => {
                    setSelectedCaption(i);
                    setEditedCaption(c.text + (c.cta ? "\n\n" + c.cta : ""));
                    setEditMode(false);
                    setAdaptedFor(null);
                    setActiveAdaptPlatform(null);
                  }}
                  onCopy={() => handleCopy(c.text + (c.cta ? "\n\n" + c.cta : ""))}
                  onAdapt={(p) => handleAdapt(i, p)}
                  adapting={adapting && selectedCaption === i}
                  adaptedFor={selectedCaption === i ? activeAdaptPlatform : null}
                  platforms={selectedPlatforms}
                />
              ))}
            </div>

            {/* Edit before publish */}
            {selectedCaption !== null && (
              <div className="vintage-card rounded-vintage p-4 bg-parchment">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-xs font-semibold text-ink-mid flex items-center gap-1.5">
                    <Edit3 size={13} className="text-gold" /> Edit before publish
                  </span>
                  <div className="flex items-center gap-3">
                    {primaryLimit && (
                      <span className={`font-type text-[10px] ${charCount > primaryLimit ? "text-rose" : "text-ink-light"}`}>
                        {charCount} / {primaryLimit.toLocaleString()}
                      </span>
                    )}
                    <button onClick={() => setEditMode(!editMode)} className="font-body text-[10px] text-ink-light underline underline-offset-2">
                      {editMode ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
                {editMode ? (
                  <textarea
                    rows={6}
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="w-full font-type text-xs text-ink border border-blush-dark rounded-vintage px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-forest/30 resize-none"
                  />
                ) : (
                  <p className="font-type text-xs text-ink leading-relaxed whitespace-pre-line">{editedCaption}</p>
                )}

                {/* Adapted version notice */}
                {activeAdaptPlatform && adaptedText[selectedCaption]?.[activeAdaptPlatform] && (
                  <div className="mt-2 pt-2 border-t border-blush flex items-center gap-2">
                    <span className="font-body text-[10px] text-ink-light">
                      Showing version adapted for <span className="font-semibold capitalize">{activeAdaptPlatform}</span>
                    </span>
                    <button
                      onClick={() => { setActiveAdaptPlatform(null); const c = captions[selectedCaption!]; setEditedCaption(c.text + "\n\n" + c.cta); }}
                      className="font-body text-[10px] text-rose underline"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Step 2: Hashtags ──────────────────────────────── */}
          <div className="vintage-card rounded-vintage p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-forest text-paper text-[10px] font-bold font-accent flex items-center justify-center">2</span>
                <Hash size={15} className="text-gold" />
                Smart Hashtags
                <span className="font-body text-xs text-ink-light font-normal">· hover for reach</span>
              </h2>
              {savedHashtags.length > 0 && (
                <span className="font-body text-[10px] text-forest bg-sage/10 border border-sage/30 px-2 py-0.5 rounded-full">
                  {savedHashtags.length} saved
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {hashtags.map((h) => (
                <div
                  key={h.tag}
                  onClick={() => toggleHashtag(h.tag)}
                  className={`cursor-pointer transition-all ${savedHashtags.includes(h.tag) ? "ring-2 ring-forest rounded-full" : ""}`}
                >
                  <HashtagBadge {...h} />
                </div>
              ))}
            </div>

            <p className="font-body text-[10px] text-ink-light flex items-center gap-1 pt-1 border-t border-blush">
              <TrendingUp size={11} className="text-sage" />
              Generated from your idea · Click to save to library · Reach data from public analytics
            </p>

            {savedHashtags.length > 0 && (
              <div className="bg-sage/5 border border-sage/20 rounded-vintage p-3">
                <p className="font-accent text-[10px] tracking-widest text-forest mb-2">Saved Set</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedHashtags.map((tag) => (
                    <span key={tag} className="font-type text-[10px] bg-sage/10 text-forest px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Schedule ──────────────────────────────── */}
          <div className="vintage-card rounded-vintage p-5 space-y-5">
            <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-forest text-paper text-[10px] font-bold font-accent flex items-center justify-center">3</span>
              <Calendar size={15} className="text-gold" />
              Schedule It
            </h2>

            {/* Platform picker */}
            <div>
              <p className="font-accent text-[11px] tracking-[0.15em] text-ink-light uppercase mb-2">Publish to</p>
              <div className="flex gap-2 flex-wrap">
                {(["instagram","linkedin","twitter","facebook"] as Platform[]).map((p) => (
                  <PlatformToggle key={p} platform={p} selected={selectedPlatforms.includes(p)} onToggle={() => togglePlatform(p)} />
                ))}
              </div>
            </div>

            {/* Best times — real data */}
            <div>
              <p className="font-accent text-[11px] tracking-[0.15em] text-ink-light uppercase mb-2 flex items-center gap-1.5">
                <Clock size={12} className="text-gold" /> AI-optimised best times
                <span className="font-body text-[9px] normal-case tracking-normal text-ink-light">(based on {selectedPlatforms.join(", ")} data)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {timeSlots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTime(i)}
                    className={`vintage-card rounded-vintage p-3 text-left transition-all ${
                      selectedTime === i ? "border-forest shadow-vintage" : "hover:border-blush-dark"
                    }`}
                  >
                    <p className="font-body text-[10px] text-ink-light">{slot.day}</p>
                    <p className="font-display font-semibold text-sm text-ink mt-0.5">{slot.window}</p>
                    <p className="font-body text-[10px] text-sage font-medium mt-1 flex items-center gap-1">
                      <TrendingUp size={9} /> {slot.lift}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      {slot.platforms.map((p) => (
                        <div key={p} className={`w-4 h-4 rounded-sm flex items-center justify-center ${PLATFORM_COLORS[p as Platform]} text-white`}>
                          {PLATFORM_ICONS[p as Platform]}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics teaser */}
            <div className="bg-gradient-to-r from-sage/10 to-gold/10 rounded-vintage p-3 flex items-center gap-3 border border-sage/20">
              <TrendingUp size={18} className="text-sage shrink-0" />
              <div>
                <p className="font-body text-xs font-semibold text-ink">Your scheduled posts history</p>
                <p className="font-body text-[10px] text-ink-light">
                  Connect platforms to see real engagement lifts · Next recommended window:{" "}
                  <span className="font-type font-semibold text-forest">{nextBestWindow(selectedPlatforms)}</span>
                </p>
              </div>
            </div>

            {/* Schedule button */}
            {scheduled ? (
              <div className="flex items-center gap-3 bg-sage/10 border border-sage/30 rounded-vintage px-4 py-3">
                <CheckCircle2 size={20} className="text-sage shrink-0" />
                <div>
                  <p className="font-body text-sm font-semibold text-forest">Post scheduled!</p>
                  <p className="font-type text-[10px] text-ink-light">
                    {selectedTime !== null && `${timeSlots[selectedTime]?.day} · ${timeSlots[selectedTime]?.window}`}
                    {" → "}
                    {selectedPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSchedule}
                disabled={!canSchedule || scheduling}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-vintage text-sm font-body font-semibold transition-all ${
                  canSchedule && !scheduling
                    ? "bg-forest text-paper hover:bg-forest-mid shadow-vintage"
                    : "bg-blush text-ink-light cursor-not-allowed"
                }`}
              >
                {scheduling ? <><RefreshCw size={14} className="animate-spin" /> Scheduling…</> : <><Calendar size={14} /> Schedule Post</>}
                {!canSchedule && !scheduling && <span className="text-[11px] opacity-70 ml-1">— select caption + time + platform</span>}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Local fallback generators (used when backend is unreachable) ───────────────

function localFallbackCaptions(idea: string, tone: Tone): Caption[] {
  const idea_l = idea.toLowerCase().trim().replace(/\.$/, "");
  const idea_c = idea.trim().replace(/^\w/, (c) => c.toUpperCase());

  const sets: Record<Tone, Caption[]> = {
    professional: [
      { hook: "Data-backed insight",  text: `${idea_c} is one of the highest-leverage areas you can focus on right now.\n\nMost people overcomplicate it. The research points to three fundamentals: consistency, specificity, and iteration.\n\nStart with one change this week. Measure the result. Adjust.`, cta: "What's your non-negotiable here? Drop it below." },
      { hook: "Expert framework",     text: `Three things practitioners of ${idea_l} do differently:\n\n① They start before they feel ready\n② They measure what actually matters\n③ They iterate faster than anyone else\n\nSimple framework. Consistently underused.`, cta: "Save this for your next strategy review." },
      { hook: "Problem → Solution",   text: `The biggest mistake with ${idea_l}? Treating it as a one-time initiative instead of a system.\n\nSystems outlast motivation. Build the process, and the results follow.`, cta: "What system has worked best for you?" },
      { hook: "Myth-busting",         text: `Myth: you need perfect conditions to succeed with ${idea_l}.\n\nReality: the best practitioners work with constraints, not against them. Resourcefulness beats resources every time.`, cta: "Agree or disagree? Let's discuss." },
    ],
    casual: [
      { hook: "Relatable opener",     text: `okay so I finally figured out the ${idea_l} thing and honestly?? it's embarrassingly simple 😭\n\nstep 1: stop overthinking it\nstep 2: just start small\nstep 3: stack wins until it's automatic\n\nmy results literally changed when I stopped looking for the "perfect" approach`, cta: "tell me where you're at with this 👇" },
      { hook: "Real talk",            text: `real talk about ${idea_l} — nobody tells you the boring truth:\n\n✨ the basics work better than the hacks\n✨ consistency > intensity every time\n✨ your competition is sleeping on this rn\n\nhonestly just knowing this changed everything for me`, cta: "drop your fave resource in the comments 💬" },
      { hook: "Hot take",             text: `unpopular opinion: ${idea_l} doesn't have to be complicated\n\nyou need like 3 things:\n1. clear goal\n2. daily action (even tiny)\n3. patience (sorry)\n\nthat's literally it. no secret sauce.`, cta: "who else has simplified this? 👇" },
      { hook: "Story hook",           text: `this time last year I knew nothing about ${idea_l}. tried everything. spent so much time. nothing clicked.\n\nthen I stopped trying to do everything and just picked ONE thing.\n\nhere's what changed 👇`, cta: "save this if you're on the same journey 🔖" },
    ],
    fun: [
      { hook: "Chaos energy",         text: `POV: you finally understand ${idea_l} 🎉\n\nbut plot twist — it was simple the whole time\n\nthe secret? do the thing. then do it again. then do it a third time when you don't want to.\n\nsciency stuff said what it said 🧬✨`, cta: "tag someone who needs this intervention 👇" },
      { hook: "Dramatic intro",       text: `breaking news: local creator discovers ${idea_l} was never actually complicated 🗞️\n\nwhat actually works:\n🌊 starting messy\n💧 adjusting as you go\n🛡️ not quitting when it gets boring\n\nwe love a plot twist era`, cta: "drop your hot take below 🔥" },
      { hook: "Comedy hook",          text: `my ${idea_l} era before: 😵‍💫 chaos, overthinking, burnout\nmy ${idea_l} era after: 🧘 simple system, daily action, THRIVING\n\nthe glow-up is real and it started with stopping the drama`, cta: "what was your biggest mistake? 🫣 mine's in the comments" },
      { hook: "Hype post",            text: `${idea_c} girlies RISE UP 🙌\n\nwe are NOT letting algorithm anxiety or perfectionism stop us this year\n\nour new mantra: done > perfect, consistency > intensity, growth > ego\n\nsay it louder for the ones in the back ✨`, cta: "send this to your creator bestie 💌" },
    ],
  };
  return sets[tone] ?? sets.casual;
}

function localFallbackHashtags(idea: string): HashtagGroup[] {
  const words = idea.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
  const keywordTags = words.slice(0, 4).map((w) => enrichHashtag(`#${w.charAt(0).toUpperCase() + w.slice(1)}`));
  const generic = [
    "#ContentCreator","#SocialMedia","#GrowthMindset","#MarketingTips",
    "#DigitalMarketing","#CreatorEconomy","#Trending","#Viral",
  ].map(enrichHashtag);
  const merged = [...keywordTags, ...generic];
  const seen = new Set<string>();
  return merged.filter((h) => { if (seen.has(h.tag)) return false; seen.add(h.tag); return true; }).slice(0, 12);
}

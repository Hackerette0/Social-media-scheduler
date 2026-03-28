"use client";
import { useState } from "react";
import {
  Instagram, Linkedin, Twitter, Facebook,
  Check, X, ExternalLink, Key, RefreshCw, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  description: string;
  features: string[];
  authType: "oauth" | "apikey";
}

const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    description: "Schedule posts, reels, and stories to your Instagram Business account.",
    features: ["Feed Posts", "Reels", "Stories", "Analytics"],
    authType: "oauth",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "Publish thought-leadership content and company updates automatically.",
    features: ["Articles", "Posts", "Company Pages", "Analytics"],
    authType: "oauth",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "text-ink",
    bg: "bg-gray-50",
    border: "border-gray-200",
    description: "Schedule tweets, threads, and replies to maximise your reach.",
    features: ["Tweets", "Threads", "Replies", "Analytics"],
    authType: "apikey",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    description: "Post to Pages and Groups, schedule events, and track engagement.",
    features: ["Pages", "Groups", "Events", "Insights"],
    authType: "oauth",
  },
];

type ConnState = "disconnected" | "connecting" | "connected";

export default function IntegrationsPage() {
  const [connStates, setConnStates]   = useState<Record<string, ConnState>>({});
  const [apiKeys, setApiKeys]         = useState<Record<string, string>>({});
  const [showKey, setShowKey]         = useState<Record<string, boolean>>({});
  const [expandKey, setExpandKey]     = useState<Record<string, boolean>>({});

  const state = (id: string): ConnState => connStates[id] ?? "disconnected";

  const handleConnect = (platform: Platform) => {
    if (platform.authType === "apikey") {
      setExpandKey((prev) => ({ ...prev, [platform.id]: !prev[platform.id] }));
      return;
    }
    setConnStates((prev) => ({ ...prev, [platform.id]: "connecting" }));
    // Simulate OAuth redirect + callback
    setTimeout(() => {
      setConnStates((prev) => ({ ...prev, [platform.id]: "connected" }));
    }, 1800);
  };

  const handleDisconnect = (id: string) => {
    setConnStates((prev) => ({ ...prev, [id]: "disconnected" }));
    setApiKeys((prev) => ({ ...prev, [id]: "" }));
    setExpandKey((prev) => ({ ...prev, [id]: false }));
  };

  const handleSaveKey = (id: string) => {
    if (!apiKeys[id]?.trim()) return;
    setConnStates((prev) => ({ ...prev, [id]: "connecting" }));
    setTimeout(() => {
      setConnStates((prev) => ({ ...prev, [id]: "connected" }));
      setExpandKey((prev) => ({ ...prev, [id]: false }));
    }, 1200);
  };

  const connectedCount = Object.values(connStates).filter((v) => v === "connected").length;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-gold/20 bg-paper px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-accent text-gold tracking-[0.2em] text-xs uppercase mb-1">
              Account Connections
            </p>
            <h1 className="font-display text-3xl font-bold text-ink">Integrations</h1>
            <p className="font-body text-ink-mid text-sm mt-1">
              Connect your social accounts to enable one-click scheduling.
            </p>
          </div>
          {connectedCount > 0 && (
            <div className="flex items-center gap-2 bg-forest/10 border border-forest/20 rounded-vintage px-4 py-2 mt-1">
              <Zap size={14} className="text-forest" />
              <span className="font-body text-forest text-sm font-medium">
                {connectedCount} platform{connectedCount > 1 ? "s" : ""} active
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-8 max-w-4xl">
        {/* Status banner */}
        <div className="mb-8 p-4 bg-gold/10 border border-gold/30 rounded-vintage">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
            <div>
              <p className="font-body text-ink text-sm font-medium">Demo Mode</p>
              <p className="font-body text-ink-mid text-xs mt-0.5">
                OAuth flows and API key validation are simulated. In production, these buttons redirect to each
                platform&apos;s real authorization page.
              </p>
            </div>
          </div>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PLATFORMS.map((platform) => {
            const s = state(platform.id);
            const Icon = platform.icon;
            const isExpanded = expandKey[platform.id];

            return (
              <div
                key={platform.id}
                className={cn(
                  "vintage-card rounded-vintage overflow-hidden transition-all",
                  s === "connected" && "ring-2 ring-forest/30"
                )}
              >
                {/* Card header */}
                <div className={cn("px-5 py-4 flex items-center justify-between", platform.bg, platform.border, "border-b")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full bg-white shadow-sm")}>
                      <Icon size={20} className={platform.color} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-ink text-base">{platform.name}</h3>
                      <p className="font-type text-[10px] text-ink-mid italic">
                        {platform.authType === "oauth" ? "OAuth 2.0" : "API Key"}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium",
                    s === "connected"   && "bg-forest/15 text-forest",
                    s === "connecting"  && "bg-gold/15 text-gold",
                    s === "disconnected" && "bg-ink/10 text-ink-light",
                  )}>
                    {s === "connected"   && <><Check size={11} /> Connected</>}
                    {s === "connecting"  && <><RefreshCw size={11} className="animate-spin" /> Connecting…</>}
                    {s === "disconnected" && <><X size={11} /> Disconnected</>}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 bg-paper">
                  <p className="font-body text-ink-mid text-sm leading-relaxed mb-3">
                    {platform.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {platform.features.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-cream rounded-full text-xs font-body text-ink-mid border border-gold/20">
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* API key input (Twitter) */}
                  {isExpanded && (
                    <div className="mb-4 space-y-2">
                      <label className="font-body text-xs text-ink font-medium flex items-center gap-1.5">
                        <Key size={11} /> API Key / Bearer Token
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showKey[platform.id] ? "text" : "password"}
                          value={apiKeys[platform.id] ?? ""}
                          onChange={(e) => setApiKeys((prev) => ({ ...prev, [platform.id]: e.target.value }))}
                          placeholder="Paste your API key here…"
                          className="flex-1 px-3 py-2 rounded-vintage border border-gold/30 bg-cream font-type text-xs text-ink focus:outline-none focus:ring-2 focus:ring-forest/30"
                        />
                        <button
                          onClick={() => setShowKey((prev) => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                          className="px-2 py-1 rounded-vintage border border-gold/20 bg-cream text-ink-mid hover:bg-cream/80 text-xs"
                        >
                          {showKey[platform.id] ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="font-body text-[10px] text-ink-light">
                        Find your API key in the{" "}
                        <span className="text-forest underline cursor-pointer">Twitter Developer Portal</span>.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {s === "disconnected" && !isExpanded && (
                      <button
                        onClick={() => handleConnect(platform)}
                        className="flex items-center gap-2 px-4 py-2 bg-forest text-paper rounded-vintage text-sm font-body font-medium hover:bg-forest-mid transition-colors"
                      >
                        {platform.authType === "oauth" ? (
                          <><ExternalLink size={13} /> Connect via OAuth</>
                        ) : (
                          <><Key size={13} /> Enter API Key</>
                        )}
                      </button>
                    )}

                    {isExpanded && (
                      <>
                        <button
                          onClick={() => handleSaveKey(platform.id)}
                          disabled={!apiKeys[platform.id]?.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-forest text-paper rounded-vintage text-sm font-body font-medium hover:bg-forest-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check size={13} /> Save & Connect
                        </button>
                        <button
                          onClick={() => setExpandKey((prev) => ({ ...prev, [platform.id]: false }))}
                          className="px-3 py-2 border border-gold/30 text-ink-mid rounded-vintage text-sm font-body hover:bg-cream/50 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {s === "connected" && (
                      <>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-forest/10 rounded-vintage text-xs font-body text-forest">
                          <Check size={12} /> Ready to post
                        </div>
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="px-3 py-2 border border-rose/30 text-rose rounded-vintage text-sm font-body hover:bg-rose/5 transition-colors text-xs"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help section */}
        <div className="mt-8 p-5 bg-paper border border-gold/20 rounded-vintage">
          <h2 className="font-display font-bold text-ink text-base mb-3">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Connect", body: "Authorise SocialFlow via OAuth or paste your API credentials." },
              { step: "02", title: "Schedule", body: "Use Content Gen or the Scheduler to queue posts on any connected platform." },
              { step: "03", title: "Auto-post", body: "SocialFlow publishes at the scheduled time — no manual action needed." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-3">
                <span className="font-accent text-gold text-xl leading-none mt-0.5">{step}</span>
                <div>
                  <p className="font-display font-bold text-ink text-sm">{title}</p>
                  <p className="font-body text-ink-mid text-xs mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

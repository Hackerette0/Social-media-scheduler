"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Sparkles, CalendarDays, BarChart3,
  LogOut, Settings, Plug, Clock,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",              label: "Dashboard",        icon: LayoutDashboard },
  { href: "/dashboard/content-gen",  label: "Content Gen",      icon: Sparkles },
  { href: "/dashboard/compose",      label: "Scheduler",        icon: Clock },
  { href: "/dashboard/calendar",     label: "Content Calendar", icon: CalendarDays },
  { href: "/dashboard/analytics",    label: "Analytics",        icon: BarChart3 },
  { href: "/dashboard/integrations", label: "Integrations",     icon: Plug },
  { href: "/dashboard/settings",     label: "Settings",         icon: Settings },
];

// ── Pearl sphere helper ───────────────────────────────────────────────────────
function Pearl({ size }: { size: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #f5f0e8 30%, #ddd4c4 60%, #b8a898 85%, #9c8878 100%)",
      boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.18), inset 1px 1px 4px rgba(255,255,255,0.9), 0 3px 10px rgba(0,0,0,0.2)",
      position: "relative" as const,
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 50 50" width={size} height={size} style={{ opacity: 0.18, position: "absolute" as const, top: 0, left: 0 }}>
        <circle cx="25" cy="25" r="8" fill="none" stroke="#5a3e28" strokeWidth="1.2" />
        <path d="M25 17 Q28 21 25 25 Q22 21 25 17Z" fill="#5a3e28" />
        <path d="M25 33 Q28 29 25 25 Q22 29 25 33Z" fill="#5a3e28" />
        <path d="M17 25 Q21 28 25 25 Q21 22 17 25Z" fill="#5a3e28" />
        <path d="M33 25 Q29 28 25 25 Q29 22 33 25Z" fill="#5a3e28" />
      </svg>
    </div>
  );
}

// ── Contact Footer ────────────────────────────────────────────────────────────
function ContactFooter() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState("");

  const trackRef      = useRef<HTMLDivElement>(null);
  const pearlXRef     = useRef(0);
  const draggingRef   = useRef(false);
  const dragOffsetRef = useRef(0);
  const [pearlX, setPearlX]         = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const PD = 52; // pearl diameter

  const maxX      = () => Math.max(0, (trackRef.current?.offsetWidth ?? 340) - PD);
  const threshold = () => maxX() * 0.8;

  const submitForm = useCallback(() => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your Name, Email and Message first.");
      pearlXRef.current = 0;
      setPearlX(0);
      return;
    }
    setSent(true);
  }, [form]);

  const startDrag = (clientX: number) => {
    dragOffsetRef.current = clientX - pearlXRef.current;
    draggingRef.current   = true;
    setIsDragging(true);
    setError("");
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const nx = Math.max(0, Math.min(cx - dragOffsetRef.current, maxX()));
      pearlXRef.current = nx;
      setPearlX(nx);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      if (pearlXRef.current >= threshold()) {
        submitForm();
      } else {
        pearlXRef.current = 0;
        setPearlX(0);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [submitForm]);

  const progress = maxX() > 0 ? pearlX / maxX() : 0;

  return (
    <footer className="mt-auto" style={{ background: "linear-gradient(160deg, #f2c9b8 0%, #e8b5a0 40%, #d4967e 100%)" }}>
      <div className="px-6 pt-5 pb-0 max-w-4xl mx-auto">

        {/* Title */}
        <h2 className="font-display text-center text-xl text-ink mb-4" style={{ fontStyle: "italic", fontWeight: 600 }}>
          Let&apos;s Connect! — Reach Out to Social Flow
        </h2>

        {/* Form / Success */}
        {sent ? (
          <div className="text-center py-5">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <Pearl size={44} />
            </div>
            <p className="font-display text-xl italic text-ink mb-1">Message sent.</p>
            <p className="font-body text-xs text-ink/60 mb-3">
              We&apos;ll reply to <span className="font-medium text-ink">{form.email}</span> soon.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setPearlX(0);
                pearlXRef.current = 0;
                setForm({ name: "", email: "", subject: "", message: "" });
              }}
              className="font-body text-xs text-ink/60 underline underline-offset-2"
            >
              Send another
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-body text-[10px] text-ink/60 mb-0.5 block">Your Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded font-body text-xs text-ink focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(139,90,60,0.2)" }}
                  />
                </div>
                <div>
                  <label className="font-body text-[10px] text-ink/60 mb-0.5 block">Your Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded font-body text-xs text-ink focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(139,90,60,0.2)" }}
                  />
                </div>
              </div>
              <div>
                <label className="font-body text-[10px] text-ink/60 mb-0.5 block">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded font-body text-xs text-ink focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(139,90,60,0.2)" }}
                />
              </div>
            </div>
            {/* Right */}
            <div>
              <label className="font-body text-[10px] text-ink/60 mb-0.5 block">Your Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                rows={3}
                className="w-full px-2.5 py-1.5 rounded font-body text-xs text-ink/80 focus:outline-none resize-none"
                style={{
                  background: "linear-gradient(180deg, #e8d5b0 0%, #dfc89e 60%, #d4b98a 100%)",
                  border: "1px solid rgba(139,90,60,0.25)",
                  boxShadow: "inset 0 1px 3px rgba(100,60,20,0.1)",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && !sent && (
          <p className="font-body text-xs text-red-700 bg-red-50/60 px-3 py-1 rounded mt-2">{error}</p>
        )}

        {/* Pearl drag row */}
        {!sent && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xl select-none">👆</span>
            <div
              ref={trackRef}
              className="relative flex-1 flex items-center rounded-full overflow-hidden select-none"
              style={{
                height: PD,
                background: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(139,90,60,0.25)",
                boxShadow: "inset 0 2px 5px rgba(100,60,20,0.12)",
              }}
            >
              {/* Gold fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: pearlX + PD / 2,
                  background: "linear-gradient(90deg, rgba(201,168,76,0.5) 0%, rgba(201,168,76,0.15) 100%)",
                }}
              />
              {/* Label */}
              <span
                className="absolute inset-0 flex items-center justify-center font-display text-sm italic text-ink/50 pointer-events-none select-none"
                style={{ opacity: Math.max(0, 1 - progress * 2) }}
              >
                Drag pearl to send →
              </span>
              {/* Draggable pearl */}
              <div
                className="absolute top-0 flex items-center justify-center"
                style={{
                  left: pearlX,
                  width: PD,
                  height: PD,
                  cursor: isDragging ? "grabbing" : "grab",
                  zIndex: 10,
                  transition: isDragging ? "none" : "left 0.35s cubic-bezier(.34,1.56,.64,1)",
                }}
                onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX); }}
                onTouchStart={(e) => startDrag(e.touches[0].clientX)}
              >
                <Pearl size={PD - 6} />
              </div>
            </div>
          </div>
        )}

        {/* Decorative bottom — The End + Orchid */}
        <div className="relative mt-1 overflow-hidden" style={{ height: 90 }}>

          {/* "The End" retro script */}
          <div
            className="absolute select-none pointer-events-none"
            style={{
              bottom: 8, left: "50%", transform: "translateX(-50%)",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic", fontWeight: 900,
              fontSize: "2.6rem", letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "#8B1A1A",
              textShadow: [
                "2px 2px 0 #5a0f0f",
                "3px 3px 0 #3d0a0a",
                "4px 4px 0 rgba(0,0,0,0.25)",
                "-1px -1px 0 rgba(255,255,255,0.3)",
                "1px 0 0 #c0392b",
              ].join(", "),
              whiteSpace: "nowrap",
            }}
          >
            The End
          </div>

          {/* Orchid SVG — dark burgundy phalaenopsis */}
          <div className="absolute bottom-0 right-0 select-none pointer-events-none" style={{ width: 88, height: 88 }}>
            <svg viewBox="0 0 100 100" width="88" height="88" xmlns="http://www.w3.org/2000/svg">
              {/* Top-left petal */}
              <ellipse cx="35" cy="28" rx="18" ry="26" fill="#6B0F2B" transform="rotate(-30 35 28)" opacity="0.95"/>
              {/* Top-right petal */}
              <ellipse cx="65" cy="28" rx="18" ry="26" fill="#7A1030" transform="rotate(30 65 28)" opacity="0.95"/>
              {/* Left petal */}
              <ellipse cx="20" cy="55" rx="22" ry="14" fill="#6B0F2B" transform="rotate(-15 20 55)" opacity="0.92"/>
              {/* Right petal */}
              <ellipse cx="80" cy="55" rx="22" ry="14" fill="#7A1030" transform="rotate(15 80 55)" opacity="0.92"/>
              {/* Bottom lip petal */}
              <ellipse cx="50" cy="72" rx="14" ry="18" fill="#9B1240" opacity="0.9"/>
              {/* Petal veins */}
              <ellipse cx="35" cy="28" rx="6" ry="18" fill="none" stroke="#4a0820" strokeWidth="0.8" transform="rotate(-30 35 28)" opacity="0.5"/>
              <ellipse cx="65" cy="28" rx="6" ry="18" fill="none" stroke="#4a0820" strokeWidth="0.8" transform="rotate(30 65 28)" opacity="0.5"/>
              {/* Column / center */}
              <ellipse cx="50" cy="50" rx="9" ry="12" fill="#e8b5d0" opacity="0.95"/>
              <ellipse cx="50" cy="47" rx="6" ry="7" fill="#f5d0e0" opacity="0.9"/>
              {/* Labellum throat markings */}
              <ellipse cx="50" cy="52" rx="4" ry="5" fill="#8B1A1A" opacity="0.6"/>
              {/* Yellow anther cap */}
              <circle cx="50" cy="44" r="3.5" fill="#d4a017" opacity="0.95"/>
              <circle cx="50" cy="44" r="2" fill="#f0c040" opacity="0.9"/>
              {/* Purple speckle hints */}
              <circle cx="44" cy="49" r="1.5" fill="#9b59b6" opacity="0.4"/>
              <circle cx="56" cy="49" r="1.5" fill="#9b59b6" opacity="0.4"/>
              <circle cx="50" cy="46" r="1" fill="#9b59b6" opacity="0.3"/>
            </svg>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(139,90,60,0.2)" }}>
          <p className="font-type text-[10px] text-ink/50 italic">
            © 2025 SocialFlow™ · bathalasucharitha79@gmail.com · TN, Chennai, India
          </p>
          <div className="flex gap-4">
            <span className="font-body text-[10px] text-ink/40 cursor-pointer hover:text-ink/70 transition-colors">Privacy</span>
            <span className="font-body text-[10px] text-ink/40 cursor-pointer hover:text-ink/70 transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const logout   = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-52 shrink-0 flex flex-col bg-forest text-paper overflow-y-auto">
        {/* Brand */}
        <div className="px-5 pt-7 pb-5 border-b border-forest-mid">
          <h1 className="font-display text-lg font-bold text-paper leading-tight">SocialFlow</h1>
          <p className="font-type text-[10px] text-sage-light mt-0.5 italic">AI Scheduler</p>
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-vintage text-sm font-body font-medium transition-all",
                  active
                    ? "bg-forest-mid text-gold border-l-2 border-gold pl-[10px]"
                    : "text-sage-light hover:bg-forest-mid hover:text-paper"
                )}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        {/* Sidebar footer */}
        <div className="px-3 pb-5 pt-3 border-t border-forest-mid space-y-1">
          <div className="px-3 py-2">
            <p className="font-type text-[10px] text-sage italic">Est. 2025</p>
            <p className="font-accent text-gold text-[11px] tracking-widest">SocialFlow™</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-vintage text-sm text-sage-light hover:bg-rose/20 hover:text-rose transition-all"
          >
            <LogOut size={15} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-cream flex flex-col">
        <div className="flex-1">{children}</div>
        <ContactFooter />
      </main>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Mail, MessageSquare, Send, MapPin, Twitter, Linkedin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  "General Enquiry",
  "Bug Report",
  "Feature Request",
  "Billing",
  "Partnership",
  "Press / Media",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "A valid email is required.";
    if (!form.topic)          e.topic   = "Please choose a topic.";
    if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters.";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1400);
  };

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="vintage-card bg-paper rounded-vintage p-12 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={26} className="text-forest" />
          </div>
          <p className="font-accent text-gold tracking-[0.2em] text-xs uppercase mb-2">Message Sent</p>
          <h2 className="font-display text-2xl font-bold text-ink mb-3">Thank you, {form.name.split(" ")[0]}.</h2>
          <p className="font-body text-ink-mid text-sm leading-relaxed mb-7">
            We&apos;ve received your message and will get back to you at{" "}
            <span className="text-ink font-medium">{form.email}</span> within 24 hours.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
            className="px-6 py-2.5 bg-forest text-paper rounded-vintage font-body text-sm hover:bg-forest-mid transition-colors"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-gold/20 bg-paper px-8 py-6">
        <p className="font-accent text-gold tracking-[0.2em] text-xs uppercase mb-1">Get in Touch</p>
        <h1 className="font-display text-3xl font-bold text-ink">Contact Us</h1>
        <p className="font-body text-ink-mid text-sm mt-1">
          Questions, feedback, or just want to say hello — we&apos;re here.
        </p>
      </div>

      <div className="px-8 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left panel — contact info ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="vintage-card bg-paper rounded-vintage p-6">
              <h2 className="font-display font-bold text-ink text-lg mb-1">SocialFlow</h2>
              <p className="font-type text-[11px] text-sage italic mb-5">Est. 2025 · AI-Powered Scheduling</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-forest/10 rounded-full mt-0.5">
                    <Mail size={14} className="text-forest" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-ink-mid">Email us</p>
                    <p className="font-body text-sm text-ink font-medium">hello@socialflow.app</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-forest/10 rounded-full mt-0.5">
                    <MessageSquare size={14} className="text-forest" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-ink-mid">Response time</p>
                    <p className="font-body text-sm text-ink font-medium">Within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-forest/10 rounded-full mt-0.5">
                    <MapPin size={14} className="text-forest" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-ink-mid">Based in</p>
                    <p className="font-body text-sm text-ink font-medium">London, UK</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gold/20">
                <p className="font-body text-xs text-ink-mid mb-3">Follow along</p>
                <div className="flex gap-2">
                  {[
                    { icon: Twitter,  label: "@socialflow" },
                    { icon: Linkedin, label: "SocialFlow" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gold/30 rounded-vintage text-xs font-body text-ink-mid hover:bg-cream/60 transition-colors"
                    >
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative quote */}
            <div className="bg-forest rounded-vintage p-6">
              <p className="font-display text-paper text-base leading-relaxed italic">
                &ldquo;Consistency is the hallmark of the unimaginative — but in social media, it&apos;s your greatest asset.&rdquo;
              </p>
              <p className="font-accent text-gold text-xs tracking-widest mt-3">— SocialFlow Team</p>
            </div>
          </div>

          {/* ── Right panel — form ── */}
          <div className="lg:col-span-3">
            <div className="vintage-card bg-paper rounded-vintage p-7">
              <h2 className="font-display font-bold text-ink text-lg mb-1">Send a message</h2>
              <div className="w-12 h-0.5 bg-gold mb-5" />

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs font-medium text-ink mb-1 block">
                      Full Name <span className="text-rose">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Jane Smith"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-vintage border bg-cream font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors",
                        errors.name ? "border-rose/60" : "border-gold/30"
                      )}
                    />
                    {errors.name && <p className="font-body text-rose text-[10px] mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="font-body text-xs font-medium text-ink mb-1 block">
                      Email Address <span className="text-rose">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="jane@example.com"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-vintage border bg-cream font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors",
                        errors.email ? "border-rose/60" : "border-gold/30"
                      )}
                    />
                    {errors.email && <p className="font-body text-rose text-[10px] mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="font-body text-xs font-medium text-ink mb-1 block">
                    Topic <span className="text-rose">*</span>
                  </label>
                  <select
                    value={form.topic}
                    onChange={set("topic")}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-vintage border bg-cream font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors appearance-none",
                      errors.topic ? "border-rose/60" : "border-gold/30"
                    )}
                  >
                    <option value="">Select a topic…</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.topic && <p className="font-body text-rose text-[10px] mt-1">{errors.topic}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="font-body text-xs font-medium text-ink mb-1 block">
                    Message <span className="text-rose">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={5}
                    placeholder="Tell us what's on your mind…"
                    className={cn(
                      "w-full px-3 py-2.5 rounded-vintage border bg-cream font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors resize-none",
                      errors.message ? "border-rose/60" : "border-gold/30"
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.message
                      ? <p className="font-body text-rose text-[10px]">{errors.message}</p>
                      : <span />}
                    <p className="font-body text-[10px] text-ink-light">{form.message.length} / 1000</p>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-forest text-paper rounded-vintage font-body font-medium text-sm hover:bg-forest-mid transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <><span className="w-3 h-3 border-2 border-paper/40 border-t-paper rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={14} /> Send Message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

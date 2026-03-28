"use client";
import { useEffect, useState, useRef } from "react";

const PHRASES = [
  "A new post is being born.",
  "Your audience is waiting.",
  "Schedule once. Grow always.",
  "Content that actually converts.",
  "Ideas → captions in seconds.",
  "Post smarter, not harder.",
  "The algorithm loves consistency.",
];

interface TypewriterHeroProps {
  className?: string;
}

export function TypewriterHero({ className = "" }: TypewriterHeroProps) {
  const [displayed, setDisplayed]   = useState("");
  const [phraseIdx, setPhraseIdx]   = useState(0);
  const [charIdx, setCharIdx]       = useState(0);
  const [deleting, setDeleting]     = useState(false);
  const [paused, setPaused]         = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;

    const current = PHRASES[phraseIdx];

    if (!deleting) {
      if (charIdx < current.length) {
        // typing
        timeoutRef.current = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx((i) => i + 1);
        }, 42 + Math.random() * 30); // slightly randomised like a real typewriter
      } else {
        // done typing → pause then delete
        setPaused(true);
        timeoutRef.current = setTimeout(() => {
          setPaused(false);
          setDeleting(true);
        }, 2200);
      }
    } else {
      if (charIdx > 0) {
        // deleting
        timeoutRef.current = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx((i) => i - 1);
        }, 22);
      } else {
        // fully deleted → next phrase
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
      }
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [charIdx, deleting, paused, phraseIdx]);

  return (
    <div className={`font-type ${className}`}>
      <span className="text-paper">{displayed}</span>
      <span className="typewriter-cursor" />
    </div>
  );
}

/* Minimal inline version – no cycling, just types once */
export function TypeOnce({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted]     = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 48);
    return () => clearTimeout(t);
  }, [displayed, started, text]);

  return (
    <span className={`font-type ${className}`}>
      {displayed}
      {displayed.length < text.length && <span className="typewriter-cursor" />}
    </span>
  );
}

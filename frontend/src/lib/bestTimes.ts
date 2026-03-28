/**
 * Client-side best posting time calculator.
 * Mirrors the backend logic so the UI always has data even if the
 * API call fails (e.g. backend not configured with Supabase yet).
 */

export interface TimeSlot {
  day: string;
  window: string;
  lift: string;
  platforms: string[];
}

type Window = [number, number, number, number]; // [dayIndex(0=Mon), hStart, hEnd, lift%]

const PLATFORM_WINDOWS: Record<string, Window[]> = {
  instagram: [
    [0, 6, 9,   18], [0, 11, 13, 14],
    [1, 6, 9,   21], [1, 12, 14, 17],
    [2, 11, 13, 16], [2, 19, 21, 15],
    [3, 12, 14, 13],
    [4, 6, 9,   23], [4, 11, 13, 19],
    [5, 9, 11,  11],
  ],
  linkedin: [
    [0, 8, 10,  22], [0, 12, 13, 16],
    [1, 8, 10,  28], [1, 12, 13, 21],
    [2, 8, 10,  25], [2, 17, 18, 18],
    [3, 8, 10,  20], [3, 12, 13, 17],
    [4, 8, 10,  14],
  ],
  twitter: [
    [0, 8, 10,  16],
    [1, 9, 11,  18],
    [2, 9, 12,  24], [2, 17, 18, 20],
    [3, 9, 11,  17],
    [4, 9, 12,  22], [4, 17, 18, 19],
    [5, 9, 11,  14],
  ],
  facebook: [
    [2, 13, 16, 26],
    [3, 12, 15, 21],
    [4, 13, 15, 18],
    [0, 12, 14, 15],
    [1, 12, 14, 16],
  ],
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function fmt(hour: number): string {
  if (hour === 0)  return "12:00 AM";
  if (hour < 12)   return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

export function calcBestTimes(platforms: string[], n = 3): TimeSlot[] {
  if (!platforms.length) platforms = ["instagram"];

  // Score each (day, hStart, hEnd) window
  const scored = new Map<string, { day: number; hStart: number; hEnd: number; lifts: number[] }>();

  for (const platform of platforms) {
    for (const [day, hStart, hEnd, lift] of (PLATFORM_WINDOWS[platform] ?? [])) {
      const key = `${day}-${hStart}-${hEnd}`;
      if (!scored.has(key)) scored.set(key, { day, hStart, hEnd, lifts: [] });
      scored.get(key)!.lifts.push(lift);
    }
  }

  const ranked = Array.from(scored.values()).map(({ day, hStart, hEnd, lifts }) => {
    const avg = lifts.reduce((a, b) => a + b, 0) / lifts.length;
    const score = avg * (1 + 0.15 * (lifts.length - 1));
    return { score, day, hStart, hEnd, lift: Math.round(avg) };
  });

  ranked.sort((a, b) => b.score - a.score);

  // Deduplicate — skip windows too close on the same day
  const result: TimeSlot[] = [];
  const usedDayHours: [number, number][] = [];

  for (const { day, hStart, hEnd, lift } of ranked) {
    const tooClose = usedDayHours.some(([d, hs]) => d === day && Math.abs(hs - hStart) < 3);
    if (!tooClose) {
      result.push({
        day:       DAY_NAMES[day],
        window:    `${fmt(hStart)} – ${fmt(hEnd)}`,
        lift:      `+${lift}% engagement`,
        platforms,
      });
      usedDayHours.push([day, hStart]);
    }
    if (result.length >= n) break;
  }

  // Generic fallback pads
  const generic: TimeSlot[] = [
    { day: "Tuesday",   window: "8:00 AM – 10:00 AM",  lift: "+18% engagement", platforms },
    { day: "Wednesday", window: "12:00 PM – 1:00 PM",  lift: "+22% engagement", platforms },
    { day: "Friday",    window: "6:00 PM – 8:00 PM",   lift: "+16% engagement", platforms },
  ];
  while (result.length < n) result.push(generic[result.length % generic.length]);

  return result.slice(0, n);
}

/** One-liner: next best window label for the analytics teaser */
export function nextBestWindow(platforms: string[]): string {
  const slots = calcBestTimes(platforms, 1);
  return slots[0] ? `${slots[0].day} ${slots[0].window}` : "Tuesday 8–10 AM";
}

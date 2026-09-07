"use client";

import { useEffect, useRef, useState } from "react";

const COUNT_MS = 1400;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (!active || prefersReducedMotion()) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function Stat({ label, target, active }: { label: string; target: number; active: boolean }) {
  const value = useCountUp(target, active);
  return (
    <div className="text-center">
      <p className="display-font text-5xl text-[#1f2d2b]">{value.toLocaleString()}</p>
      <p className="mt-2 text-xs uppercase tracking-[.2em] text-[#536b60]">{label}</p>
    </div>
  );
}

export default function StatsStrip({
  tributeCount,
  mediaCount,
  contributorCount,
}: {
  tributeCount: number;
  mediaCount: number;
  contributorCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!tributeCount && !mediaCount && !contributorCount) return null;

  return (
    <div
      ref={ref}
      className="mt-10 grid grid-cols-3 gap-4 border-y border-[#d8cec0] bg-[#fbf8f2] py-8"
    >
      <Stat label="Tributes shared" target={tributeCount} active={active} />
      <Stat label="Photos & videos" target={mediaCount} active={active} />
      <Stat label="Shared with love by" target={contributorCount} active={active} />
    </div>
  );
}

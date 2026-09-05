"use client";

import { useEffect, useRef, useState } from "react";
import type { MusicAutoplay } from "@/lib/memorial";

const SESSION_KEY = "co_music_played";
const VOLUME_KEY = "co_music_volume";

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6 4.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6 4h2.5v12H6V4Zm5.5 0H14v12h-2.5V4Z" />
    </svg>
  );
}

export default function SiteAudioPlayer({
  musicUrl,
  musicAutoplay,
  musicLoop,
  musicVolume,
}: {
  musicUrl: string;
  musicAutoplay: MusicAutoplay;
  musicLoop: boolean;
  musicVolume: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [volume, setVolume] = useState(musicVolume);

  function markPlayed() {
    if (musicAutoplay !== "once_per_session") return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore — this is only a best-effort "don't nag every reload" flag.
    }
  }

  useEffect(() => {
    // Hydrating from sessionStorage (an external system) on mount, not
    // deriving from props/state — the recommended shape for this would be
    // reading it during render, but that isn't SSR-safe here.
    try {
      const stored = sessionStorage.getItem(VOLUME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setVolume(Number(stored));
    } catch {
      // Storage unavailable — just keep the admin-configured default.
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (!musicUrl || musicAutoplay === "off") return;
    if (musicAutoplay === "once_per_session") {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
      } catch {
        // Storage unavailable (private browsing etc.) — fall through and
        // just attempt to play; worst case it offers to play every visit.
      }
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        markPlayed();
      })
      .catch(() => {
        // Browser blocked autoplay-with-sound until the visitor interacts.
        setNeedsInteraction(true);
      });
    // Only run this on mount for the current settings, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl, musicAutoplay]);

  useEffect(() => {
    if (!needsInteraction) return;
    const tryPlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setNeedsInteraction(false);
          markPlayed();
        })
        .catch(() => {});
    };
    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay, { once: true });
    document.addEventListener("touchstart", tryPlay, { once: true });
    return () => {
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("keydown", tryPlay);
      document.removeEventListener("touchstart", tryPlay);
    };
    // Only re-run when needsInteraction changes, not on every markPlayed identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsInteraction]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }

  function changeVolume(next: number) {
    setVolume(next);
    try {
      sessionStorage.setItem(VOLUME_KEY, String(next));
    } catch {
      // Ignore — this is only a best-effort per-visit preference.
    }
  }

  if (!musicUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={musicUrl}
        loop={musicLoop}
        preload="none"
        onLoadedMetadata={(event) => {
          event.currentTarget.volume = volume / 100;
        }}
      />
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-[#1f2d2b] py-2 pl-2 pr-1 text-[#fbf8f2] shadow-lg">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
          aria-label="Music volume"
          className="h-1 w-16 accent-[#c48a3a] sm:w-24"
        />
      </div>
    </>
  );
}

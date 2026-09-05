"use client";

import { useEffect, useRef, useState } from "react";
import type { MusicAutoplay } from "@/lib/memorial";

const SESSION_KEY = "co_music_played";

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
}: {
  musicUrl: string;
  musicAutoplay: MusicAutoplay;
  musicLoop: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

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
  }, [needsInteraction]);

  function markPlayed() {
    if (musicAutoplay !== "once_per_session") return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore — this is only a best-effort "don't nag every reload" flag.
    }
  }

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

  if (!musicUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={musicUrl} loop={musicLoop} preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        aria-pressed={playing}
        className="fixed bottom-5 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#1f2d2b] text-[#fbf8f2] shadow-lg"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
    </>
  );
}

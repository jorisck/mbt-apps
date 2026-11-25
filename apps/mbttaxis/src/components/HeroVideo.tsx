"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  youtubeId: string;
};

type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_SCRIPT = "https://www.youtube.com/iframe_api";
const YT_PLAYING = 1;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${YT_SCRIPT}"]`)) {
      const script = document.createElement("script");
      script.src = YT_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    } else if (window.YT?.Player) {
      resolve();
    }
  });
}

/**
 * Fond vidéo YouTube.
 * YouTube affiche toujours un flash play/pause au seek/loop dans l’iframe
 * (non stylable). On masque donc brièvement l’iframe pendant le relancement.
 */
export function HeroVideo({ youtubeId }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const restartingRef = useRef(false);
  const [mask, setMask] = useState(true); // masque jusqu’au premier play

  useEffect(() => {
    let cancelled = false;
    let unmaskTimer: number | null = null;

    const clearLoopTimer = () => {
      if (loopTimerRef.current != null) {
        window.clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };

    const coverForRestart = (ms = 700) => {
      setMask(true);
      if (unmaskTimer != null) window.clearTimeout(unmaskTimer);
      unmaskTimer = window.setTimeout(() => {
        if (!cancelled) setMask(false);
      }, ms);
    };

    const startSoftLoop = (player: YTPlayer) => {
      clearLoopTimer();
      loopTimerRef.current = window.setInterval(() => {
        try {
          if (restartingRef.current) return;
          const duration = player.getDuration();
          const current = player.getCurrentTime();
          if (duration > 2 && current >= duration - 1.5) {
            restartingRef.current = true;
            // Masque opaque AVANT le seek → le bouton pause YouTube reste invisible
            coverForRestart(900);
            window.setTimeout(() => {
              try {
                player.mute();
                player.seekTo(0.2, true);
                player.playVideo();
              } catch {
                /* ignore */
              }
              window.setTimeout(() => {
                restartingRef.current = false;
              }, 1000);
            }, 80);
          }
        } catch {
          /* player détruit */
        }
      }, 120);
    };

    const mount = async () => {
      const shell = shellRef.current;
      if (!shell) return;

      await loadYouTubeApi();
      if (cancelled || !window.YT?.Player || !shellRef.current) return;

      clearLoopTimer();
      playerRef.current?.destroy();
      playerRef.current = null;
      shell.innerHTML = "";

      const target = document.createElement("div");
      target.style.width = "100%";
      target.style.height = "100%";
      shell.appendChild(target);

      // Pas de loop/playlist natif YouTube : c’est lui qui flash le bouton pause
      playerRef.current = new window.YT.Player(target, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          cc_load_policy: 0,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            startSoftLoop(e.target);
          },
          onStateChange: (e) => {
            if (e.data === YT_PLAYING) {
              e.target.mute();
              if (!restartingRef.current && !cancelled) {
                // Premier frame joué : on retire le masque initial
                window.setTimeout(() => {
                  if (!cancelled && !restartingRef.current) setMask(false);
                }, 250);
              }
            }
          },
        },
      });
    };

    void mount();

    return () => {
      cancelled = true;
      clearLoopTimer();
      if (unmaskTimer != null) window.clearTimeout(unmaskTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
      if (shellRef.current) shellRef.current.innerHTML = "";
    };
  }, [youtubeId]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" aria-hidden>
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.65] transition-opacity duration-200 ${
          mask ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          ref={shellRef}
          className="h-full w-full [&>iframe]:pointer-events-none [&>iframe]:h-full [&>iframe]:w-full"
        />
      </div>

      {/* Fond ink pendant le masque (cache totalement l’UI YouTube) */}
      <div
        className={`pointer-events-none absolute inset-0 bg-ink transition-opacity duration-200 ${
          mask ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Filtre noir permanent + dégradés lisibilité */}
      <div className="pointer-events-auto absolute inset-0 bg-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
    </div>
  );
}

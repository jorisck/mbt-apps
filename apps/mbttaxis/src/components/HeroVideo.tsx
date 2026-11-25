"use client";

import { useEffect, useRef } from "react";

type Props = {
  youtubeId: string;
};

type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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
const YT_ENDED = 0;
const YT_PAUSED = 2;

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

export function HeroVideo({ youtubeId }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;

    const mount = async () => {
      const shell = shellRef.current;
      if (!shell) return;

      await loadYouTubeApi();
      if (cancelled || !window.YT?.Player || !shellRef.current) return;

      playerRef.current?.destroy();
      playerRef.current = null;
      shell.innerHTML = "";

      const target = document.createElement("div");
      target.style.width = "100%";
      target.style.height = "100%";
      shell.appendChild(target);

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
          },
          onStateChange: (e) => {
            if (e.data === YT_ENDED) {
              e.target.seekTo(0.01, true);
              e.target.playVideo();
              return;
            }
            if (e.data === YT_PAUSED) {
              e.target.mute();
              e.target.playVideo();
            }
          },
        },
      });
    };

    void mount();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      if (shellRef.current) shellRef.current.innerHTML = "";
    };
  }, [youtubeId]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-muted" aria-hidden>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.55]">
        <div
          ref={shellRef}
          className="h-full w-full [&>iframe]:pointer-events-none [&>iframe]:h-full [&>iframe]:w-full"
        />
      </div>
      {/* Filtre + bloque tous les clics (plus de boutons play/pause YouTube) */}
      <div className="pointer-events-auto absolute inset-0 bg-black/30" />
    </div>
  );
}

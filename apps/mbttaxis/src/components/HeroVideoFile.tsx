type Props = {
  src: string;
  poster?: string;
};

/**
 * Fond vidéo auto-hébergé : `loop` natif du navigateur, sans UI,
 * donc aucun écran noir ni bouton play au relancement.
 */
export function HeroVideoFile({ src, poster }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" aria-hidden>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
      />

      {/* Filtre noir permanent + dégradés lisibilité */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
    </div>
  );
}

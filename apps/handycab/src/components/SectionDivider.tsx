type Variant = "line" | "glow" | "steps";

export function SectionDivider({
  variant = "line",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "glow") {
    return (
      <div
        className={`section-divider section-divider--glow ${className}`}
        aria-hidden
      >
        <span className="section-divider__orb" />
        <span className="section-divider__beam" />
        <span className="section-divider__dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  }

  if (variant === "steps") {
    return (
      <div
        className={`section-divider section-divider--steps ${className}`}
        aria-hidden
      >
        <span className="section-divider__rail" />
        <span className="section-divider__nodes">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`section-divider section-divider--line ${className}`}
      aria-hidden
    >
      <span className="section-divider__fade" />
      <span className="section-divider__shimmer" />
      <span className="section-divider__spark" />
    </div>
  );
}

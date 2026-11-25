type Props = {
  /** Une seule image affichée coupée en 2 panneaux */
  src: string;
  alt: string;
  className?: string;
  /** Décalage vertical style original (panneau gauche plus bas) */
  stagger?: "left-down" | "right-down";
};

/**
 * Affiche la même image découpée en deux colonnes arrondies
 * (effet « 2 photos » du site Odoo, en réalité 1 média).
 */
export function SplitImage({
  src,
  alt,
  className = "",
  stagger = "left-down",
}: Props) {
  const leftOffset = stagger === "left-down" ? "mt-8 lg:mt-12" : "";
  const rightOffset = stagger === "right-down" ? "mt-8 lg:mt-12" : "";

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${className}`} aria-label={alt}>
      <div
        className={`aspect-[3/4] overflow-hidden rounded-2xl bg-cover bg-no-repeat shadow-sm ${leftOffset}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "200% 100%",
          backgroundPosition: "left center",
        }}
        role="img"
        aria-hidden
      />
      <div
        className={`aspect-[3/4] overflow-hidden rounded-2xl bg-cover bg-no-repeat shadow-sm ${rightOffset}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "200% 100%",
          backgroundPosition: "right center",
        }}
        role="img"
        aria-hidden
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}

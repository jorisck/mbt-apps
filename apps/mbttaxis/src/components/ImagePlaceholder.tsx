type Props = {
  label?: string;
  className?: string;
  ratio?: string;
};

export function ImagePlaceholder({
  label = "Photo",
  className = "",
  ratio = "aspect-[4/3]",
}: Props) {
  return (
    <div
      className={`img-placeholder relative overflow-hidden rounded-2xl ${ratio} ${className}`}
      role="img"
      aria-label={label}
    >
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 text-sm font-medium text-white">
        {label}
      </span>
    </div>
  );
}

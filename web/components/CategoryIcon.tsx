const ICONS: Record<string, string> = {
  snowflake: "❄️",
  bike: "🚵",
  waves: "🌊",
  tent: "⛺",
  caravan: "🚐",
  mountain: "⛰️",
  zap: "⚡",
  wind: "🪂",
  demo: "🎯",
  tag: "🏷️",
};

export default function CategoryIcon({
  icon,
  className = "text-3xl",
}: {
  icon: string;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {ICONS[icon] ?? "🏔️"}
    </span>
  );
}

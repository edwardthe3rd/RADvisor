import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import type { Category } from "@/lib/config/categories";

export default function CategoryCard({
  category,
  count,
  countLabel,
}: {
  category: Category;
  count: number;
  countLabel: string;
}) {
  return (
    <Link
      href={`/discover/${category.slug}`}
      className="group flex flex-col items-center gap-2 rounded-lg border border-surface-borderLight bg-white p-4 text-center transition hover:border-brand-gold hover:shadow-md"
    >
      <CategoryIcon icon={category.icon} />
      <span className="font-bold text-ink-primary group-hover:text-brand-goldDark">
        {category.label}
      </span>
      <span className="text-sm text-ink-secondary">
        {count} {countLabel}
      </span>
    </Link>
  );
}

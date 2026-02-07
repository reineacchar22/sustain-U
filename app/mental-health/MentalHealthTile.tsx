import Link from "next/link";

type Props = {
  slug: string;
  icon: string;
  title: string;
  description: string;
};

export default function MentalHealthTile({
  slug,
  icon,
  title,
  description,
}: Props) {
  return (
    <Link
      href={`/mental-health/${slug}`}
      className="
        group block rounded-3xl p-6
        bg-gradient-to-br from-white/80 to-white/40
        backdrop-blur-md
        border border-white/40
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
      "
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl leading-none">{icon}</div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:underline underline-offset-4">
            {title}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>

          <div className="mt-4 text-sm text-gray-700 flex items-center gap-2">
            <span>Explore</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

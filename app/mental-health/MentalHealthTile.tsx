import Link from "next/link";

type Props = {
  slug: string;
  icon: string;
  title: string;
  description?: string;
  tagline?: string;
};

export default function MentalHealthTile({ slug, icon, title, description, tagline }: Props) {
  return (
    <Link
      href={`/mental-health/${slug}`}
      className="group flex flex-col gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all no-underline"
    >
      <span className="text-3xl leading-none">{icon}</span>
      <div className="flex-1">
        <div className="text-[15px] font-bold text-gray-900 leading-snug">{title}</div>
        {(description ?? tagline) && (
          <div className="mt-1.5 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
            {description ?? tagline}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600 group-hover:gap-1.5 transition-all">
        Explore
        <svg
          className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

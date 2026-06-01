import Link from "next/link";
import { notFound } from "next/navigation";
import { mentalHealthTiles } from "../resources";

export default async function MentalHealthDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tile = mentalHealthTiles.find((t) => t.slug === slug);
  if (!tile) return notFound();

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Sticky nav bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/mental-health"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Mental Health
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-5xl mb-5 leading-none">{tile.icon}</div>
          <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight">
            {tile.title}
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            {tile.description}
          </p>
        </div>
      </div>

      {/* Resource links */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Resources
        </p>
        <div className="space-y-3">
          {tile.links.map((link) => {
            const hasUrl = !!link.url;

            const cardContent = (
              <div
                className={[
                  "flex items-center justify-between p-4 rounded-2xl bg-white border shadow-sm",
                  hasUrl
                    ? "border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all"
                    : "border-gray-100 opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                <div>
                  <div className="text-[15px] font-semibold text-gray-800">
                    {link.name}
                  </div>
                  <div className="text-[13px] text-gray-400 mt-0.5">
                    {hasUrl ? "Open resource" : "Coming soon"}
                  </div>
                </div>
                {hasUrl && (
                  <div className="ml-4 flex-shrink-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );

            return hasUrl ? (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                {cardContent}
              </a>
            ) : (
              <div key={link.name}>{cardContent}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

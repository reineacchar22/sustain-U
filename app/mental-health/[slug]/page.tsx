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
    <main className="min-h-screen p-6 bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <div className="max-w-3xl mx-auto">
        <Link href="/mental-health" className="text-sm text-gray-700 hover:underline">
          ← Back
        </Link>

        <h1 className="text-3xl font-semibold mt-4">
          {tile.icon} {tile.title}
        </h1>
        <p className="text-gray-600 mt-2">{tile.description}</p>

        <div className="mt-8 space-y-3">
          {tile.links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl p-4 bg-white/70 backdrop-blur border border-white/50 hover:shadow-md transition"
            >
              <div className="font-medium">{link.name}</div>
              <div className="text-sm text-gray-600 mt-1">Open resource →</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

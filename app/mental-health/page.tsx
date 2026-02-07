import MentalHealthTile from "./MentalHealthTile";
import { mentalHealthTiles } from "./resources";

export default function MentalHealthPage() {
  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold">You’re Not Alone</h1>

        <p className="text-gray-600 mt-2 max-w-2xl">
          Climate-related emotions are real and valid. Explore gentle ways to
          understand what you’re feeling, process it, connect with others, and
          find hope.
        </p>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {mentalHealthTiles.map((tile) => (
            <MentalHealthTile
              key={tile.slug}
              slug={tile.slug}
              icon={tile.icon}
              title={tile.title}
              description={tile.description}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

import MentalHealthTile from "./MentalHealthTile";
import { mentalHealthTiles } from "./resources";

export default function MentalHealthPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-[1.75rem] font-bold text-gray-900">You&apos;re Not Alone</h1>
          <p className="mt-2 text-[15px] text-gray-500 leading-relaxed max-w-lg">
            Climate-related emotions are real and valid. Explore gentle ways to understand what
            you&apos;re feeling, process it, connect with others, and find hope.
          </p>
        </div>
      </div>

      {/* Tiles */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mentalHealthTiles.map((tile) => (
            <MentalHealthTile
              key={tile.slug}
              slug={tile.slug}
              icon={tile.icon}
              title={tile.title}
              description={tile.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

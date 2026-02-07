import { mentalHealthTiles } from "./resources";
import MentalHealthTile from "./MentalHealthTile";

export default function MentalHealthTiles() {
  return (
    <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {mentalHealthTiles.map((t) => (
        <MentalHealthTile
          key={t.slug}
          slug={t.slug}
          icon={t.icon}
          title={t.title}
          tagline={t.tagline}
        />
      ))}
    </section>
  );
}

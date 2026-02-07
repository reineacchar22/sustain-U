import Link from "next/link";

type Props = {
  slug: string;
  icon: string;
  title: string;
  description?: string;
  tagline?: string;
};

export default function MentalHealthTile({
  slug,
  icon,
  title,
  description,
  tagline,
}: Props) {
  return (
    <Link
      href={`/mental-health/${slug}`}
      style={{
        textDecoration: "none",
        color: "#111",
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 18,
        padding: 14,
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

      <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.35 }}>
        {description ?? tagline ?? ""}
      </div>

      <div style={{ marginTop: 4, opacity: 0.55, fontWeight: 800 }}>
        Open →
      </div>
    </Link>
  );
}

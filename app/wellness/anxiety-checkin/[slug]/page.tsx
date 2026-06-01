import AnxietyCheckinClient from "./AnxietyCheckinClient";

export function generateStaticParams() {
  return [
    { slug: "breathing" },
    { slug: "name-it" },
    { slug: "tiny-action" },
    { slug: "connection" },
    { slug: "boundaries" },
  ];
}

export default function Page({ params }: { params: { slug: string } }) {
  return <AnxietyCheckinClient slug={params.slug} />;
}

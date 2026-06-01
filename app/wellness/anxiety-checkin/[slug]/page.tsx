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

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AnxietyCheckinClient slug={slug} />;
}

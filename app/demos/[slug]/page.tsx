import { notFound } from "next/navigation";
import { getDemo } from "@/lib/demos/registry";

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) notFound();

  const Component = demo.component;
  return <Component />;
}

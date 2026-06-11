import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/db/blog-queries";
import { SITE_URL } from "@/lib/viral/enhance-webpage";
import { BlogCarousel } from "@/components/blog/blog-carousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research Breakdowns — The Unicorn Labs Blog",
  description:
    "Interactive research breakdowns from The Unicorn Labs. Every article is a living research paper: run the simulations, explore the mechanisms, and build the projects yourself.",
  keywords: [
    "interactive research",
    "research explained",
    "student projects",
    "STEM education",
    "the unicorn labs",
    "research papers explained",
  ],
  alternates: { canonical: `${SITE_URL}/blog/projects` },
  openGraph: {
    type: "website",
    title: "Research Breakdowns — The Unicorn Labs Blog",
    description:
      "Interactive research breakdowns: run the simulations, explore the mechanisms, build the projects.",
    url: `${SITE_URL}/blog/projects`,
    siteName: "The Unicorn Labs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Breakdowns — The Unicorn Labs Blog",
    description:
      "Interactive research breakdowns: run the simulations, explore the mechanisms, build the projects.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Unicorn Labs — Research Breakdowns",
    url: `${SITE_URL}/blog/projects`,
    publisher: { "@type": "Organization", name: "The Unicorn Labs", url: SITE_URL },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}/blog/project/${p.blog_slug}`,
      datePublished: p.created_at,
    })),
  };

  return (
    <div className="viral-theme viral-bg min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto max-w-6xl px-6 pb-4 pt-14">
        <a
          href={SITE_URL}
          className="text-sm font-semibold tracking-wide text-[#22d3ee] no-underline"
        >
          The Unicorn Labs
        </a>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Research, but you can touch it.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Every article below is a living research paper — run the simulations, drag the sliders,
          recreate the results, then build the project yourself. We turn research papers into
          projects students can actually build.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {posts.length === 0 ? (
          <p className="glass-panel mt-8 p-12 text-center text-muted-foreground">
            First research breakdowns landing soon.
          </p>
        ) : (
          <BlogCarousel posts={posts} />
        )}

        <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            <a href={SITE_URL} className="font-semibold text-[#22d3ee] no-underline">
              theunicornlabs.com
            </a>{" "}
            · Research is structured curiosity. · All breakdowns are interactive and free.
          </p>
        </footer>
      </main>
    </div>
  );
}

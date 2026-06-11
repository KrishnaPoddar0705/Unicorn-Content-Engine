"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/lib/db/blog-queries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Card({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <a
      href={`/blog/project/${post.blog_slug}`}
      className={`glass-panel group flex shrink-0 snap-start flex-col p-6 no-underline transition-colors hover:border-[#8b5cf6]/50 ${
        featured ? "w-[85vw] sm:w-96" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {post.domain && <span className="text-[#22d3ee]">{post.domain}</span>}
        <span>·</span>
        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        {post.theme && (
          <>
            <span>·</span>
            <span>{post.theme}</span>
          </>
        )}
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-foreground">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {post.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#8b5cf6] group-hover:gap-2 transition-all">
        Open the interactive breakdown <ArrowRight className="h-4 w-4" />
      </span>
    </a>
  );
}

export function BlogCarousel({ posts }: { posts: BlogPost[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  };

  return (
    <div>
      {/* Featured carousel */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Latest breakdowns</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-[#8b5cf6]/50 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-[#8b5cf6]/50 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
      >
        {posts.slice(0, 8).map((post) => (
          <Card key={post.id} post={post} featured />
        ))}
      </div>

      {/* Full grid (crawlable, complete) */}
      {posts.length > 0 && (
        <>
          <h2 className="mt-12 font-display text-lg font-semibold">All articles</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

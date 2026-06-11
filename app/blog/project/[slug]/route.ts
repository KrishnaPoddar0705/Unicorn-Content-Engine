import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/db/blog-queries";
import {
  injectBacklinksFooter,
  injectLeadForm,
  injectSeoHead,
} from "@/lib/viral/enhance-webpage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return new NextResponse("Not configured", { status: 503 });
  }

  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return new NextResponse("Article not found", { status: 404 });
  }

  const all = await getBlogPosts();
  const related = all
    .filter((p) => p.blog_slug !== slug)
    .slice(0, 4)
    .map((p) => ({ title: p.title, blogSlug: p.blog_slug }));

  let html = post.html_content;
  html = injectSeoHead(html, {
    title: post.title,
    description: post.description.slice(0, 300),
    canonicalPath: `/blog/project/${post.blog_slug}`,
    publishedAt: post.created_at,
    keywords: [
      post.domain || "research",
      "interactive research",
      "student projects",
      "the unicorn labs",
      "research explained",
      post.title,
    ],
  });
  html = injectLeadForm(html, post.blog_slug);
  html = injectBacklinksFooter(html, related);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

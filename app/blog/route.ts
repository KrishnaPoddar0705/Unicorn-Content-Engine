import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBlogPosts, type BlogPost } from "@/lib/db/blog-queries";
import { SITE_URL } from "@/lib/viral/enhance-webpage";

// Self-contained HTML (no /_next assets) so the page survives being proxied
// under the apex domain by the Cloudflare Worker, exactly like the webapps.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function cardHtml(post: BlogPost): string {
  const coverSrc = post.cover_image_url || `/blog/cover/${post.blog_slug}`;
  const cover = `<div class="card-cover"><img src="${esc(coverSrc)}" alt="${esc(post.title)} — abstract cover art" loading="lazy" /></div>`;
  return `
    <a class="card" href="/blog/project/${esc(post.blog_slug)}">
      ${cover}
      <div class="card-body">
        <div class="card-meta">
          ${post.domain ? `<span class="card-domain">${esc(post.domain)}</span><span class="dot">·</span>` : ""}
          <time datetime="${esc(post.created_at)}">${formatDate(post.created_at)}</time>
        </div>
        <h2 class="card-title">${esc(post.title)}</h2>
        <p class="card-desc">${esc(post.description)}</p>
        <span class="card-cta">Open the interactive breakdown <span class="arrow">→</span></span>
      </div>
    </a>`;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return new NextResponse("Not configured", { status: 503 });
  }
  const posts = await getBlogPosts();

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Unicorn Labs — Research Breakdowns",
    url: `${SITE_URL}/blog`,
    publisher: { "@type": "Organization", name: "The Unicorn Labs", url: SITE_URL },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}/blog/project/${p.blog_slug}`,
      datePublished: p.created_at,
    })),
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Research Breakdowns — The Unicorn Labs Blog</title>
<meta name="description" content="Interactive research breakdowns from The Unicorn Labs. Every article is a living research paper: run the simulations, explore the mechanisms, and build the projects yourself." />
<link rel="canonical" href="${SITE_URL}/blog" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Research Breakdowns — The Unicorn Labs Blog" />
<meta property="og:description" content="Interactive research breakdowns: run the simulations, explore the mechanisms, build the projects." />
<meta property="og:url" content="${SITE_URL}/blog" />
<meta property="og:site_name" content="The Unicorn Labs" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Research Breakdowns — The Unicorn Labs Blog" />
<meta name="twitter:description" content="Interactive research breakdowns: run the simulations, explore the mechanisms, build the projects." />
<script type="application/ld+json">${jsonLd}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --void: #000000;
    --bone: #ffffff;
    --ash: #bdbdbd;
    --smoke: #9a9a9a;
    --plum: #8052ff;
    --amber: #ffb829;
    --lichen: #15846e;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--void);
    color: var(--bone);
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  #cosmos {
    position: fixed; inset: 0;
    width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 0;
  }
  .page { position: relative; z-index: 1; }

  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 36px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .logo {
    color: var(--bone); text-decoration: none;
    font-size: 18px; font-weight: 600; letter-spacing: 0.021em;
    display: flex; align-items: center; gap: 10px;
  }
  .logo svg { width: 22px; height: 22px; }
  .nav-right { display: flex; align-items: center; gap: 30px; }
  .nav-link {
    color: var(--smoke); text-decoration: none;
    font-size: 14px; font-weight: 400; letter-spacing: 0.021em;
    text-transform: uppercase;
    transition: color 0.2s;
  }
  .nav-link:hover { color: var(--bone); }
  .pill {
    display: inline-block;
    background: var(--plum); color: var(--bone);
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; text-decoration: none;
    border-radius: 24px; padding: 14px 18px;
    border: none;
  }

  .hero {
    min-height: 88vh;
    max-width: 1200px; margin: 0 auto;
    padding: 160px 36px 60px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .eyebrow {
    color: var(--plum);
    font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  h1 {
    font-size: clamp(48px, 9vw, 113px);
    font-weight: 200;
    line-height: 0.9;
    letter-spacing: -0.04em;
    max-width: 700px;
  }
  .hero p {
    margin-top: 30px;
    font-size: 17px; line-height: 1.5; letter-spacing: 0.025em;
    color: var(--ash);
    max-width: 52ch;
  }
  .hero .pill { margin-top: 36px; align-self: flex-start; }

  .section {
    max-width: 1200px; margin: 0 auto;
    padding: 60px 36px 120px;
  }
  .section-kicker {
    color: var(--bone);
    font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 36px;
    display: flex; align-items: center; gap: 15px;
  }
  .section-kicker::after {
    content: ""; flex: 1; height: 1px;
    background: rgba(255,255,255,0.12);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
  .card {
    display: flex; flex-direction: column;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    overflow: hidden;
    text-decoration: none;
    background: rgba(0,0,0,0.45);
    transition: border-color 0.25s;
  }
  .card:hover { border-color: var(--plum); }
  .card-cover {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .card-cover img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .card:hover .card-cover img { transform: scale(1.04); }
  .card-cover-fallback {
    background:
      radial-gradient(ellipse 60% 80% at 30% 40%, rgba(128,82,255,0.35), transparent 65%),
      radial-gradient(ellipse 45% 60% at 75% 65%, rgba(255,184,41,0.14), transparent 60%),
      radial-gradient(ellipse 35% 45% at 60% 25%, rgba(21,132,110,0.2), transparent 60%),
      #000;
  }
  .card-body {
    display: flex; flex-direction: column; flex: 1;
    padding: 24px;
  }
  .card-meta {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--smoke);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .card-domain { color: var(--amber); font-weight: 600; }
  .dot { color: var(--smoke); }
  .card-title {
    margin-top: 18px;
    font-size: 27px; font-weight: 200;
    line-height: 1.15; letter-spacing: -0.02em;
    color: var(--bone);
  }
  .card-desc {
    margin-top: 12px;
    font-size: 15px; line-height: 1.5; letter-spacing: 0.025em;
    color: var(--ash);
    flex: 1;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-cta {
    margin-top: 24px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--bone);
  }
  .card-cta .arrow { color: var(--plum); transition: transform 0.2s; display: inline-block; }
  .card:hover .arrow { transform: translateX(4px); }

  .empty {
    border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
    padding: 96px 24px; text-align: center;
    color: var(--smoke); font-size: 15px; letter-spacing: 0.025em;
  }

  footer {
    max-width: 1200px; margin: 0 auto;
    padding: 60px 36px 96px;
    border-top: 1px solid rgba(255,255,255,0.08);
    color: var(--smoke);
    font-size: 14px; line-height: 1.5; letter-spacing: 0.021em;
  }
  footer a { color: var(--bone); text-decoration: none; font-weight: 600; }
  footer a:hover { color: var(--plum); }

  @media (max-width: 640px) {
    nav { padding: 14px 18px; }
    .nav-link { display: none; }
    .hero { padding: 130px 18px 36px; }
    .section { padding: 36px 18px 60px; }
    footer { padding: 36px 18px 60px; }
  }
</style>
</head>
<body>
<canvas id="cosmos" aria-hidden="true"></canvas>
<div class="page">
  <nav>
    <a class="logo" href="${SITE_URL}">
      <svg viewBox="0 0 24 24" fill="none" stroke="#8052ff" stroke-width="1.5"><path d="M12 2L2 12l10 10 10-10L12 2z"/><path d="M12 7l-5 5 5 5 5-5-5-5z"/></svg>
      The Unicorn Labs
    </a>
    <div class="nav-right">
      <a class="nav-link" href="${SITE_URL}">Home</a>
      <a class="nav-link" href="${SITE_URL}/blog">Blog</a>
      <a class="pill" href="${SITE_URL}">Join the Labs</a>
    </div>
  </nav>

  <header class="hero">
    <p class="eyebrow">Stop scrolling. Start building.</p>
    <h1>Research,<br/>but you can<br/>touch it.</h1>
    <p>Every article below is a living research paper — run the simulations, drag the sliders, recreate the results, then build the project yourself. We turn research papers into projects students can actually build.</p>
    <a class="pill" href="#breakdowns">Explore the breakdowns</a>
  </header>

  <main class="section" id="breakdowns">
    <p class="section-kicker">All interactive breakdowns · ${posts.length}</p>
    ${
      posts.length === 0
        ? `<div class="empty">First research breakdowns landing soon.</div>`
        : `<div class="grid">${posts.map(cardHtml).join("\n")}</div>`
    }
  </main>

  <footer>
    <p><a href="${SITE_URL}">theunicornlabs.com</a> · Research is structured curiosity. · All breakdowns are interactive and free.</p>
  </footer>
</div>

<script>
(function () {
  var canvas = document.getElementById("cosmos");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W, H, cx, cy, R;

  // Palette weights: bone-heavy with plum / amber / lichen sparks
  var COLORS = ["#ffffff","#ffffff","#ffffff","#ffffff","#8052ff","#8052ff","#ffb829","#15846e"];
  var SHAPES = ["tri","circle","diamond","square"];

  var cluster = [], drift = [];

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var mobile = W < 700;
    cx = mobile ? W * 0.5 : W * 0.72;
    cy = mobile ? H * 0.24 : H * 0.46;
    R = Math.min(W, H) * (mobile ? 0.34 : 0.38);
    build(mobile);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function build(mobile) {
    cluster = []; drift = [];
    var N = mobile ? 900 : 2200;
    // Fibonacci sphere with radial noise — an organic particle orb
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var t = i / N;
      var inc = Math.acos(1 - 2 * t);
      var az = golden * i;
      var r = R * (0.82 + rand(-0.16, 0.18) * Math.pow(Math.random(), 2));
      cluster.push({
        theta: az, phi: inc, r: r,
        size: rand(1.6, 5.2),
        color: pick(COLORS),
        shape: pick(SHAPES),
        tw: rand(0, Math.PI * 2),
        tws: rand(0.3, 1.4)
      });
    }
    var D = mobile ? 50 : 110;
    for (var j = 0; j < D; j++) {
      drift.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.06, 0.06), vy: rand(-0.04, 0.04),
        size: rand(1.2, 3.4),
        color: pick(COLORS),
        shape: pick(SHAPES),
        tw: rand(0, Math.PI * 2),
        tws: rand(0.2, 0.9)
      });
    }
  }

  function drawShape(x, y, s, shape, rot) {
    ctx.beginPath();
    if (shape === "circle") {
      ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
    } else if (shape === "tri") {
      ctx.moveTo(x + s * Math.cos(rot), y + s * Math.sin(rot));
      ctx.lineTo(x + s * Math.cos(rot + 2.09), y + s * Math.sin(rot + 2.09));
      ctx.lineTo(x + s * Math.cos(rot + 4.19), y + s * Math.sin(rot + 4.19));
      ctx.closePath();
    } else if (shape === "diamond") {
      ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y);
      ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y);
      ctx.closePath();
    } else {
      ctx.rect(x - s * 0.5, y - s * 0.5, s, s);
    }
    ctx.fill();
  }

  var rotY = 0;
  function frame(now) {
    var time = now * 0.001;
    ctx.clearRect(0, 0, W, H);

    // drifting field
    for (var j = 0; j < drift.length; j++) {
      var d = drift[j];
      d.x += d.vx; d.y += d.vy;
      if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10;
      if (d.y < -10) d.y = H + 10; if (d.y > H + 10) d.y = -10;
      var a = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(d.tw + time * d.tws));
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      drawShape(d.x, d.y, d.size, d.shape, d.tw);
    }

    // rotating constellation orb
    rotY = time * 0.12;
    var sinR = Math.sin(rotY), cosR = Math.cos(rotY);
    for (var i = 0; i < cluster.length; i++) {
      var p = cluster[i];
      var sx = p.r * Math.sin(p.phi) * Math.cos(p.theta);
      var sz = p.r * Math.sin(p.phi) * Math.sin(p.theta);
      var sy = p.r * Math.cos(p.phi);
      var x = sx * cosR - sz * sinR;
      var z = sx * sinR + sz * cosR;
      var depth = (z / R + 1) * 0.5; // 0 back → 1 front
      var breathe = 1 + 0.015 * Math.sin(time * 0.7);
      var px = cx + x * breathe;
      var py = cy + sy * 0.92 * breathe;
      var a2 = 0.12 + depth * 0.78 * (0.75 + 0.25 * Math.sin(p.tw + time * p.tws));
      ctx.globalAlpha = a2;
      ctx.fillStyle = p.color;
      drawShape(px, py, p.size * (0.5 + depth * 0.7), p.shape, p.tw + time * 0.2);
    }
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

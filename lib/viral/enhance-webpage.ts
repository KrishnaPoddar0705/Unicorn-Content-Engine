/**
 * Serve-time HTML enhancement for interactive webpages.
 * Existing and future pages get the lead form, SEO head, and backlinks footer
 * injected when served — stored html_content stays untouched, so improving
 * these templates upgrades every page at once.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://theunicornlabs.com").replace(/\/$/, "");

/** Where this app itself is reachable (the lead form posts here so it works when pages are proxied under the apex domain). */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

const LEAD_FORM_MARKER = "data-unicorn-lead-form";

export function buildLeadFormSnippet(sourceSlug: string): string {
  return `
<section ${LEAD_FORM_MARKER} id="unicorn-lead-capture" style="max-width:680px;margin:48px auto;padding:32px 24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:20px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);font-family:system-ui,-apple-system,sans-serif;color:#ece9f7;">
  <h2 style="margin:0 0 6px;font-size:1.5rem;font-weight:700;background:linear-gradient(90deg,#8b5cf6,#22d3ee);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Want to build this yourself?</h2>
  <p style="margin:0 0 20px;font-size:0.92rem;color:#9b94b8;line-height:1.5;">Join The Unicorn Labs — we turn research papers into projects students can actually build. Get the build guide for this project and new episodes in your inbox.</p>
  <form id="unicorn-lead-form" style="display:grid;gap:12px;">
    <input name="email" type="email" required placeholder="Email address *" style="padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:#ece9f7;font-size:0.95rem;outline:none;" />
    <input name="phone" type="tel" placeholder="Phone number (optional)" style="padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:#ece9f7;font-size:0.95rem;outline:none;" />
    <select name="interest" style="padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:#ece9f7;font-size:0.95rem;outline:none;">
      <option value="">What are you most interested in?</option>
      <option value="building_this_project">Building this project</option>
      <option value="more_research_breakdowns">More research breakdowns</option>
      <option value="student_programs">Student programs at Unicorn Labs</option>
      <option value="parent_looking_for_child">I'm a parent exploring for my child</option>
      <option value="school_partnership">School partnership</option>
      <option value="other">Something else</option>
    </select>
    <button type="submit" style="padding:13px 18px;border:none;border-radius:12px;background:linear-gradient(90deg,#8b5cf6,#6366f1);color:#fff;font-size:0.98rem;font-weight:600;cursor:pointer;">Send me the build guide</button>
    <p id="unicorn-lead-status" style="margin:0;min-height:1.2em;font-size:0.85rem;color:#9b94b8;"></p>
  </form>
  <p style="margin:14px 0 0;font-size:0.78rem;color:#6b6585;">No spam. Built with curiosity at <a href="${SITE_URL}" style="color:#22d3ee;text-decoration:none;">theunicornlabs.com</a>.</p>
</section>
<script>
(function () {
  var form = document.getElementById("unicorn-lead-form");
  if (!form) return;
  var status = document.getElementById("unicorn-lead-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Sending\\u2026";
    status.textContent = "";
    fetch(${JSON.stringify(`${APP_URL}/api/leads`)}, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.value,
        phone: form.phone.value,
        interest: form.interest.value,
        source: ${JSON.stringify(sourceSlug)}
      })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) {
          form.innerHTML = '<p style="margin:0;font-size:1.05rem;color:#34d399;font-weight:600;">You\\u2019re in! Check your inbox soon \\u2014 and keep building.</p>';
        } else {
          status.textContent = res.j.error || "Something went wrong \\u2014 try again.";
          status.style.color = "#f87171";
          btn.disabled = false;
          btn.textContent = "Send me the build guide";
        }
      })
      .catch(function () {
        status.textContent = "Network error \\u2014 try again.";
        status.style.color = "#f87171";
        btn.disabled = false;
        btn.textContent = "Send me the build guide";
      });
  });
})();
</script>`;
}

export function injectLeadForm(html: string, sourceSlug: string): string {
  if (html.includes(LEAD_FORM_MARKER)) return html;
  const snippet = buildLeadFormSnippet(sourceSlug);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${snippet}\n</body>`);
  }
  return html + snippet;
}

export interface BlogSeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  publishedAt: string;
  keywords: string[];
}

export function injectSeoHead(html: string, meta: BlogSeoMeta): string {
  const canonical = `${SITE_URL}${meta.canonicalPath}`;
  const esc = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    url: canonical,
    author: { "@type": "Organization", name: "The Unicorn Labs", url: SITE_URL },
    publisher: { "@type": "Organization", name: "The Unicorn Labs", url: SITE_URL },
    mainEntityOfPage: canonical,
    isAccessibleForFree: true,
  });
  const tags = `
<link rel="canonical" href="${canonical}" />
<meta name="description" content="${esc(meta.description)}" />
<meta name="keywords" content="${esc(meta.keywords.join(", "))}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(meta.title)}" />
<meta property="og:description" content="${esc(meta.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:site_name" content="The Unicorn Labs" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(meta.title)}" />
<meta name="twitter:description" content="${esc(meta.description)}" />
<script type="application/ld+json">${jsonLd}</script>`;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${tags}\n</head>`);
  }
  return tags + html;
}

export interface RelatedPost {
  title: string;
  blogSlug: string;
}

export function injectBacklinksFooter(html: string, related: RelatedPost[]): string {
  const relatedLinks = related
    .map(
      (p) =>
        `<li style="margin:6px 0;"><a href="${SITE_URL}/blog/project/${p.blogSlug}" style="color:#22d3ee;text-decoration:none;">${p.title.replace(/</g, "&lt;")}</a></li>`
    )
    .join("");
  const footer = `
<footer style="max-width:680px;margin:32px auto 48px;padding:24px;border-top:1px solid rgba(255,255,255,0.1);font-family:system-ui,-apple-system,sans-serif;color:#9b94b8;font-size:0.88rem;line-height:1.6;">
  ${related.length > 0 ? `<p style="margin:0 0 8px;font-weight:600;color:#ece9f7;">Keep exploring</p><ul style="margin:0 0 18px;padding-left:18px;">${relatedLinks}</ul>` : ""}
  <p style="margin:0;">
    Published by <a href="${SITE_URL}" style="color:#22d3ee;text-decoration:none;font-weight:600;">The Unicorn Labs</a>
    · <a href="${SITE_URL}/blog" style="color:#22d3ee;text-decoration:none;">All research breakdowns</a>
    · We turn research papers into projects students can actually build.
  </p>
</footer>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}\n</body>`);
  }
  return html + footer;
}

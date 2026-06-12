# Deploying the Blog + Lead Capture

## 1. Apply migration 008 (required)

Run `supabase/migrations/008_leads_and_blog.sql` in the Supabase SQL editor. It creates the `leads` table and adds + backfills `blog_slug` on `interactive_webpages` (existing pages get clean slugs automatically, e.g. `this-ai-learned-physics-by-watching-pixels-move`).

## 2. Connect the Google Sheet (lead capture)

Target sheet: https://docs.google.com/spreadsheets/d/14BqobckGZsE9sdCBpavd8h6g8IrRyL7QJuauYlaQbKM

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create (or pick) a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **IAM & Admin → Service Accounts** → Create service account (any name, no roles needed) → **Keys → Add key → JSON**. Download the JSON.
4. Open the sheet → **Share** → add the service account's email (`...@...iam.gserviceaccount.com`) as **Editor**.
5. Add to `.env.local` (and later to Vercel env vars):

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# optional overrides:
# LEADS_SPREADSHEET_ID=14BqobckGZsE9sdCBpavd8h6g8IrRyL7QJuauYlaQbKM   (this is the default)
# LEADS_SHEET_RANGE=A:F
```

6. Add a header row to the sheet: `Timestamp | Email | Phone | Interest | Source | User Agent`.

Leads are ALWAYS stored in the Supabase `leads` table as backup (with a `synced_to_sheet` flag), so nothing is lost if the sheet sync ever fails.

## 3. Current setup + exposing /blog/project/<slug> on the apex

**Live today:**
- `projects.theunicornlabs.com` → this app (Vercel). Articles at `/blog/project/<slug>`, index at `/blog/projects`.
- `theunicornlabs.com` → the main WordPress site.

**Vercel env vars (Project → Settings → Environment Variables):**
```
NEXT_PUBLIC_SITE_URL=https://theunicornlabs.com   # canonicals/sitemap point at the apex
NEXT_PUBLIC_APP_URL=https://projects.theunicornlabs.com  # lead form posts here (CORS enabled)
```
Redeploy after setting these.

DNS alone cannot route paths — `theunicornlabs.com/blog/project/*` needs a proxy in front of WordPress. Pick one:

### Recommended: Cloudflare Worker proxy (free, WordPress untouched)

1. [Cloudflare](https://dash.cloudflare.com) → Add site → `theunicornlabs.com` → Free plan. It imports your GoDaddy DNS records; verify they all came over.
2. At GoDaddy → Domain → Nameservers → change to the two Cloudflare nameservers shown. (Registration stays at GoDaddy; only DNS moves.)
3. Cloudflare → Workers & Pages → Create Worker, paste:
   ```js
   const ORIGIN = "projects.theunicornlabs.com";
   const PROXY_PREFIXES = ["/blog", "/webapps/", "/api/leads"];

   export default {
     async fetch(request) {
       const url = new URL(request.url);
       const shouldProxy = PROXY_PREFIXES.some(
         (p) => url.pathname === p || url.pathname.startsWith(p)
       );
       if (!shouldProxy) {
         return new Response(
           "Unicorn Labs blog proxy is live. Routes: " + PROXY_PREFIXES.join(", "),
           { status: 200, headers: { "content-type": "text/plain" } }
         );
       }
       url.hostname = ORIGIN;
       try {
         return await fetch(new Request(url, request));
       } catch (e) {
         return new Response("Origin unreachable: " + e.message, { status: 502 });
       }
     },
   };
   ```
4. Worker → Settings → Triggers → add routes (zone `theunicornlabs.com`):
   - `*theunicornlabs.com/blog*` (covers /blog and /blog/project/<slug>)
   - `*theunicornlabs.com/webapps/*`

   ⚠️ The `/blog*` route takes over the ENTIRE /blog path on the apex — if the WordPress site has its own blog at /blog, those WordPress posts become unreachable. That is the intended behavior here (/blog is the projects index).
5. Done — `theunicornlabs.com/blog` shows all interactive projects as cards, each opening at `theunicornlabs.com/blog/project/<slug>`, while every other path still hits WordPress. Canonicals already point at the apex, so all SEO credit accrues to theunicornlabs.com.

### Fallback: WordPress redirects (no Cloudflare, weaker SEO)

If you skip the proxy, add redirects in WordPress (e.g. the "Redirection" plugin):
`/blog/project/(.*)` → `https://projects.theunicornlabs.com/blog/project/$1` (301).
Pages then live on the subdomain; set `NEXT_PUBLIC_SITE_URL=https://projects.theunicornlabs.com` so canonicals match reality. SEO authority accrues to the subdomain instead of the apex.

### Sitemap on the apex

WordPress owns `theunicornlabs.com/sitemap.xml`. Submit the app's sitemap separately in Search Console: add the property, then submit `https://projects.theunicornlabs.com/sitemap.xml` — its URLs point at the apex (proxied) paths, which is valid as long as the proxy is live. With the Worker option you can also add a route for `/blog-sitemap.xml` if you prefer an apex-hosted sitemap.

## 4. SEO checklist after deploy

- [ ] Verify the domain in Google Search Console and submit the sitemap.
- [ ] Check one article with the [Rich Results Test](https://search.google.com/test/rich-results) — Article JSON-LD should be detected.
- [ ] Every blog page already includes: canonical URL, meta description, OG/Twitter cards, Article schema, backlinks to the homepage + /blog/projects + related articles.
- [ ] The /blog index includes Blog schema with every post (good for AI answer engines / GEO).
- [ ] Share blog URLs (not /webapps URLs) on social — they carry the SEO metadata; the comment-keyword DMs can use either.

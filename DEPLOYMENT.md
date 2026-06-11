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

## 3. Deploy to theunicornlabs.com

### Option A — this app owns www.theunicornlabs.com (simplest)

1. Push this repo to GitHub, import it in [Vercel](https://vercel.com/new).
2. Set all env vars from `.env.local` in Vercel → Project → Settings → Environment Variables. Add:
   `NEXT_PUBLIC_SITE_URL=https://www.theunicornlabs.com`
3. Vercel → Project → Settings → Domains → add `www.theunicornlabs.com` (and `theunicornlabs.com` redirecting to www). Update your DNS as Vercel instructs (CNAME `www` → `cname.vercel-dns.com`).
4. Done: `/blog`, `/blog/[slug]`, `/webapps/[slug]`, `/sitemap.xml`, `/robots.txt` are live on the domain. The internal tool routes are blocked from search engines via robots.txt — but they are still publicly reachable, so consider adding Vercel password protection or basic auth middleware for the internal paths.

### Option B — main site stays where it is; this app serves only /blog

If www.theunicornlabs.com already runs elsewhere (e.g. a landing page on Framer/Webflow/another Vercel project):

1. Deploy this app to Vercel on its own subdomain, e.g. `engine.theunicornlabs.com`.
2. On the MAIN site project, proxy `/blog` to it:
   - Vercel main project → `vercel.json`:
     ```json
     {
       "rewrites": [
         { "source": "/blog", "destination": "https://engine.theunicornlabs.com/blog" },
         { "source": "/blog/:path*", "destination": "https://engine.theunicornlabs.com/blog/:path*" },
         { "source": "/webapps/:path*", "destination": "https://engine.theunicornlabs.com/webapps/:path*" },
         { "source": "/api/leads", "destination": "https://engine.theunicornlabs.com/api/leads" }
       ]
     }
     ```
   - (Framer/Webflow have equivalent reverse-proxy / rewrite settings.)
3. Keep `NEXT_PUBLIC_SITE_URL=https://www.theunicornlabs.com` so canonicals, sitemap, and JSON-LD all point at the main domain — Google treats the proxied pages as first-party content.
4. Submit `https://www.theunicornlabs.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

## 4. SEO checklist after deploy

- [ ] Verify the domain in Google Search Console and submit the sitemap.
- [ ] Check one article with the [Rich Results Test](https://search.google.com/test/rich-results) — Article JSON-LD should be detected.
- [ ] Every blog page already includes: canonical URL, meta description, OG/Twitter cards, Article schema, backlinks to the homepage + /blog + related articles.
- [ ] The /blog index includes Blog schema with every post (good for AI answer engines / GEO).
- [ ] Share blog URLs (not /webapps URLs) on social — they carry the SEO metadata; the comment-keyword DMs can use either.

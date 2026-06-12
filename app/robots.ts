import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/viral/enhance-webpage";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/blog", "/blog/project/", "/webapps/"],
        // Internal tool routes stay out of search indexes
        disallow: [
          "/dashboard",
          "/episodes",
          "/papers",
          "/viral",
          "/calendar",
          "/agents",
          "/settings",
          "/demos",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

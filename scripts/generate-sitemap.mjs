import { writeFile } from "node:fs/promises";

const rawSiteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL;

if (!rawSiteUrl) {
  console.log("SEO sitemap skipped: set VITE_SITE_URL to the production domain.");
  process.exit(0);
}

const siteUrl = rawSiteUrl.replace(/\/$/, "");
const routes = ["/", "/About_us", "/Ministries", "/Leadership", "/Get_Involved"];
const today = new Date().toISOString().slice(0, 10);
const urls = routes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

await Promise.all([
  writeFile(new URL("../public/sitemap.xml", import.meta.url), sitemap),
  writeFile(new URL("../public/robots.txt", import.meta.url), robots)
]);

console.log(`SEO sitemap generated for ${siteUrl}`);

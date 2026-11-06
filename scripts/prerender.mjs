/**
 * Writes one HTML file per page into dist/, with the page's content and its
 * own title, description, canonical link, sharing tags and structured data,
 * so crawlers (and people, before the JavaScript arrives) get the real page.
 * Also writes 404.html, app.html for the dashboard, and sitemap.xml.
 *
 * Runs after `vite build` and `vite build --ssr src/entry-server.tsx`; see
 * the build script in package.json.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Replace one tag in the template, or add it before </head> when it is not there. */
function setTag(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function headFor(template, meta, url) {
  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(meta.description)}" />`);
  html = setTag(html, /<meta name="robots"[^>]*>/, `<meta name="robots" content="${meta.noindex ? "noindex, nofollow" : "index, follow"}" />`);
  for (const [prop, value] of [
    ["og:title", meta.title],
    ["og:description", meta.description],
    ["og:type", meta.type],
    ["og:url", url],
    ["og:site_name", "Custom Showers"],
    ["og:image", meta.image],
  ]) {
    html = setTag(html, new RegExp(`<meta property="${prop.replace(":", "\\:")}"[^>]*>`), `<meta property="${prop}" content="${esc(value)}" />`);
  }
  for (const [name, value] of [
    ["twitter:card", "summary_large_image"],
    ["twitter:title", meta.title],
    ["twitter:description", meta.description],
    ["twitter:image", meta.image],
  ]) {
    html = setTag(html, new RegExp(`<meta name="${name.replace(":", "\\:")}"[^>]*>`), `<meta name="${name}" content="${esc(value)}" />`);
  }
  const extra = [];
  for (const href of meta.preload || []) extra.push(`<link rel="preload" as="image" href="${esc(href)}" />`);
  for (const ld of meta.jsonLd || []) {
    extra.push(`<script type="application/ld+json" data-page-ld>${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`);
  }
  if (extra.length) html = html.replace("</head>", `    ${extra.join("\n    ")}\n  </head>`);
  return html;
}

function fileFor(p) {
  if (p === "/") return path.join(dist, "index.html");
  return path.join(dist, `${p.replace(/^\//, "")}.html`);
}

async function main() {
  const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
  if (!template.includes('<div id="root"></div>')) throw new Error("dist/index.html has no empty #root to fill");
  const server = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
  const pages = server.allPages();
  const written = [];

  for (const meta of pages) {
    const url = server.pageUrl(meta);
    let html = headFor(template, meta, url);
    if (meta.prerender !== false) {
      const body = server.render(meta.path);
      html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    }
    const file = fileFor(meta.path);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, html);
    written.push(`${meta.path} → ${path.relative(dist, file)}${meta.prerender === false ? " (head only)" : ""}`);
  }

  // Anything that is not a page: a real 404, with the not-found page in it.
  const notFound = server.NOT_FOUND;
  let html404 = headFor(template, notFound, `https://customshowers.uk${notFound.path}`);
  html404 = html404.replace('<div id="root"></div>', `<div id="root">${server.render("/__not_found__")}</div>`);
  await fs.writeFile(path.join(dist, "404.html"), html404);
  written.push("404 → 404.html");

  // The dashboard's shell: the plain app, never indexed.
  const appMeta = { ...notFound, path: "/admin", title: "Custom Showers · Admin", description: "The Custom Showers admin dashboard.", noindex: true, jsonLd: [] };
  await fs.writeFile(path.join(dist, "app.html"), headFor(template, appMeta, "https://customshowers.uk/admin"));
  written.push("/admin/* → app.html");

  // The sitemap: every indexable page.
  const entries = pages
    .filter((m) => !m.noindex)
    .map((m) => {
      const bits = [`<loc>${esc(server.pageUrl(m))}</loc>`];
      if (m.lastmod) bits.push(`<lastmod>${m.lastmod}</lastmod>`);
      if (m.changefreq) bits.push(`<changefreq>${m.changefreq}</changefreq>`);
      if (m.priority != null) bits.push(`<priority>${m.priority.toFixed(1)}</priority>`);
      return `  <url>\n    ${bits.join("\n    ")}\n  </url>`;
    });
  await fs.writeFile(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`
  );
  written.push(`sitemap.xml (${entries.length} pages)`);

  await fs.rm(ssrDir, { recursive: true, force: true });
  console.log(`prerender: ${written.length} files\n  ${written.join("\n  ")}`);
}

main().catch((err) => {
  console.error("prerender failed:", err);
  process.exit(1);
});

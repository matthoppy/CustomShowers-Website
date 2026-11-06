/**
 * The build-time renderer. scripts/prerender.mjs loads this (built by
 * `vite build --ssr`) and asks for each page's HTML and metadata, then writes
 * one HTML file per page into dist/.
 */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { allPages, NOT_FOUND, type PageMeta } from "./seo/meta";
import { pageUrl } from "./seo/usePageMeta";

export { allPages, NOT_FOUND, pageUrl };
export type { PageMeta };

export function render(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>
  );
}

/**
 * Builds the measuring-cards storyboard page: a client build for the CSS, a
 * server build of the storyboard entry, then one HTML file with every frame.
 *
 *   node scripts/storyboard/build.mjs <out.html>
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = process.argv[2] || path.join(root, "dist-storyboard", "storyboard.html");
const ssrDir = path.join(root, "dist-storyboard", "ssr");

execSync("npx vite build --ssr scripts/storyboard/entry.tsx --outDir dist-storyboard/ssr", { cwd: root, stdio: "inherit" });
const cssFile = fs.readdirSync(path.join(root, "dist", "assets")).find((f) => /^index-.*\.css$/.test(f));
if (!cssFile) throw new Error("run the client build first: the page needs dist/assets/index-*.css");
const css = fs.readFileSync(path.join(root, "dist", "assets", cssFile), "utf8");
const mod = await import(pathToFileURL(path.join(ssrDir, "entry.js")).href);
const { frames, standardHeight } = mod.renderStoryboard();

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const phone = (f, i) => `
  <figure class="sb-fig">
    <div class="sb-phone ${f.kind === "review" ? "sb-phone--tall" : ""}"><div class="sb-screen">${f.html}</div></div>
    <figcaption>${esc(f.caption)}</figcaption>
  </figure>`;

const html = `<title>Measuring Cards</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>${css}</style>
<style>
  /* The storyboard around the frames. Layout: a grid of phone frames, one per screen, in order. */
  :root { --sb-bg: #f3f5f7; --sb-fg: #1f2933; --sb-muted: #5b6771; --sb-line: #d5dde3; --sb-navy: #1d3a5c; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --sb-bg: #121820; --sb-fg: #e8edf2; --sb-muted: #a2adb8; --sb-line: #2b3741; --sb-navy: #4f82b8; } }
  :root[data-theme="dark"] { --sb-bg: #121820; --sb-fg: #e8edf2; --sb-muted: #a2adb8; --sb-line: #2b3741; --sb-navy: #4f82b8; }
  body { background: var(--sb-bg); color: var(--sb-fg); font-family: 'Open Sans', system-ui, sans-serif; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 28px 56px; }
  .sb-wrap { max-width: 1320px; margin: 0 auto; }
  .sb-wrap h1 { font-size: 28px; margin: 0 0 6px; }
  .sb-wrap > p { max-width: 70ch; color: var(--sb-muted); margin: 0 0 24px; }
  .sb-wrap h2 { font-size: 18px; margin: 36px 0 12px; }
  .sb-grid { display: flex; flex-wrap: wrap; gap: 24px 22px; align-items: flex-start; }
  .sb-fig { margin: 0; width: 340px; max-width: 100%; }
  .sb-phone { width: 340px; max-width: 100%; height: 690px; border: 10px solid #1b222b; border-radius: 34px; overflow: hidden; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.18); }
  .sb-phone--tall { height: 760px; }
  .sb-screen { height: 100%; font-size: 14px; }
  .sb-screen h2 { font-size: 18px !important; }
  .sb-fig figcaption { margin-top: 8px; font-size: 13px; color: var(--sb-muted); }
  .sb-desktop { width: 100%; max-width: 980px; height: 620px; border: 1px solid var(--sb-line); border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.12); display: flex; justify-content: center; }
  .sb-desktop .sb-screen { width: 560px; max-width: 100%; height: 100%; font-size: 15px; }
  .sb-note { border-left: 3px solid var(--sb-navy); padding: 8px 14px; color: var(--sb-muted); max-width: 70ch; font-size: 14px; }
</style>
<div class="sb-wrap">
  <h1>Measuring cards: single door, laser</h1>
  <p>One screen per task. Two instruction cards, then the eight readings to the laser cross one at a time, then the opening drawn from those numbers. The pictures move; the numbers are a sample job (1200mm wide, 2400mm to the ceiling, left wall leaning 4mm in, floor 6mm low on the right).</p>
  <div class="sb-grid">${frames.map(phone).join("")}</div>
  <h2>On a laptop</h2>
  <p class="sb-note">The same card, centred, with the picture larger. Nothing else on the screen: no step list, no sidebar, no plan and elevation beside it.</p>
  <div class="sb-desktop"><div class="sb-screen">${frames[3].html}</div></div>
  <h2>If the door stops short of the ceiling</h2>
  <p class="sb-note">Readings 7 and 8 are not asked. A height card comes first instead, so the top readings have something to be level with: six readings and a height.</p>
  <div class="sb-grid">${standardHeight.map(phone).join("")}</div>
</div>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`storyboard: ${frames.length} frames + ${standardHeight.length}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB → ${out}`);

import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Most pages arrive with their content already in the HTML (see
// scripts/prerender.mjs), so the words and pictures show before any
// JavaScript runs; React then takes over that markup. The designer and the
// dashboard start from an empty page and render in the browser.
const container = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);

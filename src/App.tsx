/**
 * The site's routes, shared by the browser (main.tsx) and the build-time
 * renderer (entry-server.tsx). The router around them differs: a
 * BrowserRouter in the browser, a StaticRouter at build time.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import TermsOfTrade from "./pages/TermsOfTrade";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SupplyOnly from "./pages/SupplyOnly";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";

// The designer and the admin dashboard are their own bundles: the other
// pages do not download them.
const DesignShowerPage = lazy(() => import("./pages/DesignShowerPage"));
const AdminApp = lazy(() => import("./admin/AdminApp"));

const loading = (what: string) => <div className="p-8 text-sm text-muted-foreground">Loading {what}…</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/design-shower" element={<Suspense fallback={loading("the designer")}><DesignShowerPage /></Suspense>} />
      <Route path="/terms-of-trade" element={<TermsOfTrade />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/supply-only" element={<SupplyOnly />} />
      <Route path="/balustrades" element={<Navigate to="/" replace />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogArticle />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={loading("the dashboard")}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageMeta } from "@/seo/usePageMeta";
import { NOT_FOUND } from "@/seo/meta";

// Served as 404.html for any address that is not a page, with a 404 status.
const NotFound = () => {
  const location = useLocation();
  usePageMeta(NOT_FOUND);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold">That page is not here</h1>
        <p className="mt-3 text-muted-foreground">It may have moved, or the address may have a typo in it.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <Link to="/" className="text-primary underline underline-offset-4">Home</Link>
          <Link to="/design-shower" className="text-primary underline underline-offset-4">Design your shower</Link>
          <Link to="/blog" className="text-primary underline underline-offset-4">Guides</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

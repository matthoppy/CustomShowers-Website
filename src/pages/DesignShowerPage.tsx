/**
 * The shower designer, from SetOut.
 *
 * Custom Showers' designer runs on SetOut. Designs sent from it arrive in the
 * SetOut workspace at app.setoutglass.com, and by email to the sales inbox.
 * This page keeps the site's own header and footer and shows SetOut's
 * designer between them, using the same embed code SetOut gives every
 * company.
 *
 * The old designer in src/configurator is still in the repository, unused
 * here, so going back is a small change to this file.
 */

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/seo/usePageMeta';
import { DESIGN } from '@/seo/meta';

/** Custom Showers' live site key. Public by design: SetOut only lets it run on customshowers.uk. */
const SITE_KEY = 'pk_live_45i6n35b26hge6zgukgfhg5e';
const EMBED_SCRIPT = 'https://designer.setoutglass.com/embed.js';

export default function DesignShowerPage() {
  usePageMeta(DESIGN);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // The embed script fills every placeholder on the page when it runs, and
    // runs once per page load. Arriving here from another page of this site,
    // it may already have run for an earlier visit, so it is run again.
    const page = window as Window & { __setoutDesignerLoaded?: boolean };
    delete page.__setoutDesignerLoaded;
    const script = document.createElement('script');
    script.src = EMBED_SCRIPT;
    script.async = true;
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <section className="bg-primary pb-10 pt-40">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold uppercase text-primary-foreground md:text-5xl">
            Design your shower
          </h1>
          <p className="mt-4 text-xl text-primary-foreground/80">
            Design your enclosure and send the measurements straight to our workshop.
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="container mx-auto px-0 py-6 sm:px-6">
          {failed ? (
            <p role="alert" className="px-6 py-16 text-center text-lg">
              The designer could not load. Please check your connection and reload the page, or{' '}
              <a href="/#contact" className="text-primary underline underline-offset-4">
                get in touch
              </a>{' '}
              and we will help.
            </p>
          ) : (
            <div data-setout-designer={SITE_KEY} data-height="900" />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

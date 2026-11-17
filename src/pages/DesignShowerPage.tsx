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
    script.onload = () => {
      // Hide static content once designer loads
      const staticContent = document.getElementById('designer-static-content');
      if (staticContent) staticContent.style.display = 'none';
    };
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <section className="bg-primary pb-10 pt-40">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold uppercase text-primary-foreground md:text-5xl">
            Design Your Frameless Shower Online
          </h1>
          <p className="mt-4 text-xl text-primary-foreground/80">
            Design your bespoke frameless shower enclosure with our interactive online designer. Choose your shape, measure your space with step-by-step guidance, select your hardware finish, and send the measurements directly to our workshop for a detailed quote.
          </p>
        </div>
      </section>

      <main className="flex-1">
        {/* SEO-friendly static content - visible to crawlers, hidden when designer loads */}
        <div id="designer-static-content" className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="prose prose-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-4">How the Online Shower Designer Works</h2>
            <p className="mb-4">
              Our interactive designer guides you through designing a custom frameless shower enclosure in just a few simple steps:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li><strong>Choose your shape:</strong> Select from common shower layouts including alcove, corner, walk-in, inline, and return configurations.</li>
              <li><strong>Measure your space:</strong> Follow our step-by-step measuring guide with visual diagrams. Record widths, heights, and any walls that lean or floors that slope.</li>
              <li><strong>Review the design:</strong> See your shower enclosure in a 3D preview with accurate cut sizes and hardware placement.</li>
              <li><strong>Select hardware:</strong> Choose your preferred finish—chrome, brushed nickel, matt black, or brushed brass.</li>
              <li><strong>Submit for quote:</strong> Send your complete design directly to us. We'll review it and send you a detailed itemised quote, usually within one business day.</li>
            </ol>
            <h3 className="text-xl font-semibold mb-3">What You'll Get</h3>
            <p className="mb-4">
              Once you submit your design, you'll receive a comprehensive quote including all glass panels cut to your exact measurements, premium hinges and hardware in your chosen finish, handles, seals, and full installation instructions prepared specifically for your shower configuration.
            </p>
            <p className="mb-4">
              All our frameless enclosures use 10mm toughened safety glass that meets BS EN 12150 standards, providing the premium weight and rigidity that sets frameless installations apart from thinner alternatives.
            </p>
            <h3 className="text-xl font-semibold mb-3">Supply Only, Nationwide Delivery</h3>
            <p className="mb-4">
              We supply across the entire UK. Your bespoke glass panels are manufactured to order and delivered in purpose-built protective A-frames. Lead times are typically 2–4 weeks from order confirmation. Your own bathroom fitter installs the enclosure following our detailed technical drawings and instructions.
            </p>
          </div>
        </div>

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

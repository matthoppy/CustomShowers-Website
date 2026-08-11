/**
 * The configurator as a page on the main site, with the usual nav and footer.
 * The embed route renders the same Configurator without this chrome.
 */

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Configurator } from '@/configurator/Configurator';
import { getTenant } from '@/configurator/tenant';

export default function DesignShowerPage() {
  const tenant = getTenant();

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <section className="bg-primary pb-10 pt-40">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold uppercase text-primary-foreground md:text-5xl">
            Design your shower
          </h1>
          {tenant.intro && (
            <p className="mt-4 text-xl text-primary-foreground/80">{tenant.intro}</p>
          )}
        </div>
      </section>

      <main className="flex-1">
        <Configurator tenant={tenant} />
      </main>

      <Footer />
    </div>
  );
}

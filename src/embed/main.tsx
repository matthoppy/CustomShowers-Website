/**
 * Embed entry point.
 *
 * Renders the configurator on its own, with no site chrome, for use inside an
 * iframe on a glazier's website. Configuration arrives as query parameters so
 * the host page never has to bundle anything.
 *
 *   /embed.html?tenant=custom-showers&theme=light
 */

import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { Configurator } from '@/configurator/Configurator';
import { getTenant } from '@/configurator/tenant';
import '../index.css';

const params = new URLSearchParams(window.location.search);
const tenant = getTenant(params.get('tenant'));
const theme = params.get('theme');

if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

/**
 * Tell the host page how tall we are, so the iframe can grow with the content
 * instead of showing its own scrollbar.
 */
function EmbeddedApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let last = 0;
    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      // A pixel of jitter would otherwise cause an endless resize loop with
      // hosts that adjust layout in response.
      if (Math.abs(height - last) < 2) return;
      last = height;
      window.parent.postMessage({ type: 'glass-configurator:height', height }, '*');
    };

    const observer = new ResizeObserver(post);
    observer.observe(el);
    post();

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef}>
      <Configurator tenant={tenant} embedded />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<EmbeddedApp />);

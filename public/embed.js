/**
 * Shower configurator embed loader.
 *
 * Drop this on any page:
 *
 *   <div id="glass-configurator" data-tenant="custom-showers"></div>
 *   <script src="https://customshowers.uk/embed.js" async></script>
 *
 * Optional attributes on the mount element:
 *   data-tenant   which glazier's configuration to load
 *   data-theme    "light" | "dark"
 *   data-height   starting height in px before the first resize message
 *
 * No dependencies, no globals beyond the one guard flag, and safe to include
 * more than once.
 */
(function () {
  'use strict';

  if (window.__glassConfiguratorEmbedLoaded) return;
  window.__glassConfiguratorEmbedLoaded = true;

  // Resolve the origin from this script's own src, so the iframe is always
  // loaded from wherever the loader came from.
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var origin;
  try {
    origin = new URL(currentScript.src, window.location.href).origin;
  } catch (e) {
    origin = window.location.origin;
  }

  function mount(el) {
    if (el.getAttribute('data-glass-configurator-mounted')) return;
    el.setAttribute('data-glass-configurator-mounted', '1');

    var tenant = el.getAttribute('data-tenant') || 'custom-showers';
    var theme = el.getAttribute('data-theme') || '';
    var initialHeight = parseInt(el.getAttribute('data-height'), 10) || 900;

    var src =
      origin +
      '/embed.html?tenant=' +
      encodeURIComponent(tenant) +
      (theme ? '&theme=' + encodeURIComponent(theme) : '');

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Shower designer';
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.height = initialHeight + 'px';
    // Same-origin so it can talk to its own backend; forms and scripts for the
    // configurator itself. Deliberately no allow-top-navigation.
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin allow-popups');

    el.appendChild(iframe);

    window.addEventListener('message', function (event) {
      // Only trust messages from the frame we created.
      if (event.origin !== origin) return;
      if (event.source !== iframe.contentWindow) return;
      var data = event.data;
      if (!data) return;

      if (data.type === 'glass-configurator:height') {
        var height = parseInt(data.height, 10);
        if (!height || height < 200 || height > 20000) return;
        iframe.style.height = height + 'px';
        return;
      }

      // The frame grows to fit rather than scrolling internally, so when it
      // moves to a new step it is the host page that has to scroll back up to
      // the top of the widget.
      if (data.type === 'glass-configurator:scrollToTop') {
        var top = iframe.getBoundingClientRect().top + window.pageYOffset - 24;
        try {
          window.scrollTo({ top: top, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, top);
        }
      }
    });
  }

  function mountAll() {
    var nodes = document.querySelectorAll(
      '#glass-configurator, [data-glass-configurator]'
    );
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();

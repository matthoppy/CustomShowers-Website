import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const TermsOfTrade = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Terms of Trade</h1>
        <p className="text-sm text-gray-500 mb-10">Custom Showers &mdash; Last updated: 1st March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Application</h2>
            <p>These Terms of Trade apply to all goods and services supplied by Custom Showers. By requesting a quote, placing an order, or accepting delivery or installation, you agree to these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Services</h2>
            <p>We provide:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Supply of bespoke shower enclosures and glass products</li>
              <li>Supply and installation services</li>
              <li>Installation-only services where agreed in writing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Quotations</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Quotes are valid for 30 days unless stated otherwise.</li>
              <li>Quotes are based on information available at the time, including site conditions.</li>
              <li>If site conditions differ from what was reasonably expected, additional costs may apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Deposits</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>A 50% deposit is required before manufacture or ordering of materials begins.</li>
              <li>Work will not commence until the deposit is received.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Bespoke &amp; Made-to-Measure Products</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Most products are custom-made.</li>
              <li>Glass is manufactured to industry tolerances, typically &plusmn;3mm.</li>
              <li>Once manufacture has commenced, orders cannot be cancelled or refunded, except where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Delivery, Inspection &amp; Defects</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">6.1 Supply-Only Orders</h3>
            <p>The Customer must inspect all glass and products within 24 hours of delivery. Defects must be reported within 24 hours, including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Dimensions outside the manufacturer&apos;s &plusmn;3mm tolerance</li>
              <li>Scratches, chips, cracks, or visible damage</li>
              <li>Incorrect specification or quantity</li>
            </ul>
            <p className="mt-3">If defects are not reported within 24 hours, the goods will be deemed accepted and any replacement or re-order costs will be payable by the Customer.</p>
            <p className="mt-2">Glass that has been handled, stored incorrectly, or installed is not eligible for replacement.</p>

            <h3 className="text-lg font-medium mt-4 mb-2">6.2 Installed Projects</h3>
            <p>Where installation is provided:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Defects relating to workmanship or supplied materials must be notified within 7 days of installation completion.</li>
              <li>Verified defects caused by our workmanship will be remedied within a reasonable timeframe.</li>
            </ul>
            <p className="mt-2">This does not affect your statutory rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Site Conditions &amp; Measurements</h2>
            <p>Measurements are taken to suit existing site conditions. The Customer acknowledges that:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Walls and floors are often not perfectly plumb or level</li>
              <li>Minor rakes, out-of-plumb walls, and surface variations are normal in bathrooms</li>
            </ul>
            <p className="mt-3">Glass is manufactured to suit the site as measured at the time. The Customer must ensure:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Tiling and waterproofing are complete</li>
              <li>Plumbing positions are final</li>
              <li>Floors provide appropriate falls to waste</li>
              <li>Safe and clear access is provided</li>
            </ul>
            <p className="mt-3">We are not responsible for:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Changes to site conditions after measurement</li>
              <li>Building movement or settlement</li>
              <li>Variations caused by uneven or non-plumb surfaces</li>
            </ul>
            <p className="mt-3">Minor visual gaps do not constitute a defect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Installation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Installation dates are estimates only.</li>
              <li>Delays may occur due to site readiness, supplier delays, or events beyond our control.</li>
              <li>Customers should protect installed glass and fittings until all other bathroom works are completed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Frameless Glass Shower Characteristics</h2>
            <p>Frameless glass shower enclosures are not fully watertight systems. Due to their design:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Minor water leakage may occur</li>
              <li>Small gaps around hinges and fittings are normal and necessary</li>
            </ul>
            <p className="mt-3">Proper waterproofing, floor falls, and drainage are essential and are the responsibility of others involved in the build.</p>
            <p className="mt-2">Minor water escape consistent with frameless shower design does not constitute a defect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Payment Terms</h2>
            <p>Unless otherwise agreed in writing:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Residential customers: balance payable within 7 days of delivery or installation completion</li>
              <li>Commercial customers: payment due in accordance with agreed credit terms</li>
            </ul>
            <p className="mt-3">All prices are exclusive of VAT unless stated otherwise.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Ownership of Goods</h2>
            <p>Ownership of goods remains with Custom Showers until payment is made in full.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Post-Installation Responsibility</h2>
            <p>Once installation is completed and accepted, responsibility for the care and protection of the glass and fittings passes to the Customer.</p>
            <p className="mt-3">We are not liable for damage occurring after installation, including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Damage by other trades or contractors</li>
              <li>Accidental impact</li>
              <li>Building movement</li>
              <li>Tiling, plumbing, or waterproofing issues</li>
              <li>Alterations or repairs by others</li>
              <li>Incorrect cleaning or use of unsuitable products</li>
            </ul>
            <p className="mt-3">Repairs or replacements required as a result of the above will be chargeable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">13. Warranty</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Installation workmanship is warranted for 12 months from completion.</li>
              <li>Manufacturer warranties apply to supplied products and fittings.</li>
            </ul>
            <p className="mt-3">The warranty does not cover:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Normal wear and tear</li>
              <li>Misuse or lack of maintenance</li>
              <li>Water leakage consistent with frameless design</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">14. Consumer Rights</h2>
            <p>Nothing in these Terms limits your rights under the Consumer Rights Act 2015.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">15. Limitation of Liability</h2>
            <p>Where legally permitted:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>We are not liable for indirect or consequential loss</li>
              <li>Our liability is limited to the value of the goods and services supplied under the relevant contract</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">16. Cancellation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Orders cancelled before manufacture may incur costs already incurred.</li>
              <li>Bespoke orders cannot be cancelled once manufacture begins, except where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">17. Force Majeure</h2>
            <p>We are not liable for delays caused by events beyond our reasonable control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">18. Governing Law</h2>
            <p>These Terms are governed by the laws of England and Wales.</p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfTrade;

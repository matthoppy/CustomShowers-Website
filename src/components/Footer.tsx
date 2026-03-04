import LegalModal from "./LegalModal";

const TERMS_TEXT = `TERMS OF TRADE
Custom Showers — Last updated: 1st March 2026

1. Application
These Terms of Trade apply to all goods and services supplied by Custom Showers. By requesting a quote, placing an order, or accepting delivery or installation, you agree to these Terms.

2. Services
We provide:
- Supply of bespoke shower enclosures and glass products
- Supply and installation services
- Installation-only services where agreed in writing

3. Quotations
- Quotes are valid for 30 days unless stated otherwise.
- Quotes are based on information available at the time, including site conditions.
- If site conditions differ from what was reasonably expected, additional costs may apply.

4. Deposits
- A 50% deposit is required before manufacture or ordering of materials begins.
- Work will not commence until the deposit is received.

5. Bespoke & Made-to-Measure Products
- Most products are custom-made.
- Glass is manufactured to industry tolerances, typically ±3mm.
- Once manufacture has commenced, orders cannot be cancelled or refunded, except where required by law.

6. Delivery, Inspection & Defects

6.1 Supply-Only Orders
The Customer must inspect all glass and products within 24 hours of delivery.
Defects must be reported within 24 hours, including:
- Dimensions outside the manufacturer's ±3mm tolerance
- Scratches, chips, cracks, or visible damage
- Incorrect specification or quantity

If defects are not reported within 24 hours, the goods will be deemed accepted and any replacement or re-order costs will be payable by the Customer.
Glass that has been handled, stored incorrectly, or installed is not eligible for replacement.

6.2 Installed Projects
Where installation is provided:
- Defects relating to workmanship or supplied materials must be notified within 7 days of installation completion.
- Verified defects caused by our workmanship will be remedied within a reasonable timeframe.
This does not affect your statutory rights.

7. Site Conditions & Measurements
Measurements are taken to suit existing site conditions.
The Customer acknowledges that:
- Walls and floors are often not perfectly plumb or level
- Minor rakes, out-of-plumb walls, and surface variations are normal in bathrooms

Glass is manufactured to suit the site as measured at the time.
The Customer must ensure:
- Tiling and waterproofing are complete
- Plumbing positions are final
- Floors provide appropriate falls to waste
- Safe and clear access is provided

We are not responsible for:
- Changes to site conditions after measurement
- Building movement or settlement
- Variations caused by uneven or non-plumb surfaces

Minor visual gaps do not constitute a defect.

8. Installation
- Installation dates are estimates only.
- Delays may occur due to site readiness, supplier delays, or events beyond our control.
- Customers should protect installed glass and fittings until all other bathroom works are completed.

9. Frameless Glass Shower Characteristics
Frameless glass shower enclosures are not fully watertight systems.
Due to their design:
- Minor water leakage may occur
- Small gaps around hinges and fittings are normal and necessary

Proper waterproofing, floor falls, and drainage are essential and are the responsibility of others involved in the build.
Minor water escape consistent with frameless shower design does not constitute a defect.

10. Payment Terms
Unless otherwise agreed in writing:
- Residential customers: balance payable within 7 days of delivery or installation completion
- Commercial customers: payment due in accordance with agreed credit terms

All prices are exclusive of VAT unless stated otherwise.

11. Ownership of Goods
Ownership of goods remains with Custom Showers until payment is made in full.

12. Post-Installation Responsibility
Once installation is completed and accepted, responsibility for the care and protection of the glass and fittings passes to the Customer.
We are not liable for damage occurring after installation, including:
- Damage by other trades or contractors
- Accidental impact
- Building movement
- Tiling, plumbing, or waterproofing issues
- Alterations or repairs by others
- Incorrect cleaning or use of unsuitable products

Repairs or replacements required as a result of the above will be chargeable.

13. Warranty
- Installation workmanship is warranted for 12 months from completion.
- Manufacturer warranties apply to supplied products and fittings.

The warranty does not cover:
- Normal wear and tear
- Misuse or lack of maintenance
- Water leakage consistent with frameless design

14. Consumer Rights
Nothing in these Terms limits your rights under the Consumer Rights Act 2015.

15. Limitation of Liability
Where legally permitted:
- We are not liable for indirect or consequential loss
- Our liability is limited to the value of the goods and services supplied under the relevant contract

16. Cancellation
- Orders cancelled before manufacture may incur costs already incurred.
- Bespoke orders cannot be cancelled once manufacture begins, except where required by law.

17. Force Majeure
We are not liable for delays caused by events beyond our reasonable control.

18. Governing Law
These Terms are governed by the laws of England and Wales.`;

const PRIVACY_TEXT = `PRIVACY POLICY
Custom Showers — Last updated: 1st March 2026

1. Who We Are
Custom Showers ("we", "us", "our") supplies and installs bespoke shower enclosures and related glass products across the United Kingdom.
We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

2. What Information We Collect
We may collect the following personal data:
- Name
- Email address
- Phone number
- Billing and installation address
- Project details, measurements, and specifications
- Payment and invoicing information
- Website usage data (cookies and analytics where applicable)

3. How We Collect Information
We collect information when you:
- Submit an enquiry via our website
- Request a quote
- Place an order
- Arrange delivery or installation
- Contact us by phone or email

4. How We Use Your Information
We use personal data to:
- Provide quotes and estimates
- Manufacture, supply, and install products
- Arrange delivery and installation
- Issue invoices and process payments
- Communicate about your project
- Comply with legal and accounting obligations

We do not sell or rent your personal data.

5. Lawful Basis for Processing
We process personal data under one or more of the following lawful bases:
- Performance of a contract
- Legitimate business interests
- Legal obligations
- Consent (where required)

6. Sharing Information
We may share personal data with:
- Installation staff or subcontractors
- Suppliers and manufacturers
- Payment processors
- Professional advisers

Only information necessary to perform our services is shared.

7. Data Security & Retention
We take reasonable steps to protect your data from unauthorised access or loss. Data is retained only as long as necessary for business and legal purposes.

8. Your Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion (where applicable)
- Object to certain processing

You may also lodge a complaint with the Information Commissioner's Office (ICO): https://ico.org.uk

9. Contact
Custom Showers
Email: matt@customshowers.uk
Phone: +44 7462 150006`;

const TermsContent = () => (
  <>
    <section>
      <h2 className="text-base font-semibold mb-1">1. Application</h2>
      <p>These Terms of Trade apply to all goods and services supplied by Custom Showers. By requesting a quote, placing an order, or accepting delivery or installation, you agree to these Terms.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">2. Services</h2>
      <p>We provide:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Supply of bespoke shower enclosures and glass products</li>
        <li>Supply and installation services</li>
        <li>Installation-only services where agreed in writing</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">3. Quotations</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Quotes are valid for 30 days unless stated otherwise.</li>
        <li>Quotes are based on information available at the time, including site conditions.</li>
        <li>If site conditions differ from what was reasonably expected, additional costs may apply.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">4. Deposits</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>A 50% deposit is required before manufacture or ordering of materials begins.</li>
        <li>Work will not commence until the deposit is received.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">5. Bespoke &amp; Made-to-Measure Products</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Most products are custom-made.</li>
        <li>Glass is manufactured to industry tolerances, typically &plusmn;3mm.</li>
        <li>Once manufacture has commenced, orders cannot be cancelled or refunded, except where required by law.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">6. Delivery, Inspection &amp; Defects</h2>
      <h3 className="font-medium mt-2 mb-1">6.1 Supply-Only Orders</h3>
      <p>The Customer must inspect all glass and products within 24 hours of delivery. Defects must be reported within 24 hours, including:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Dimensions outside the manufacturer&apos;s &plusmn;3mm tolerance</li>
        <li>Scratches, chips, cracks, or visible damage</li>
        <li>Incorrect specification or quantity</li>
      </ul>
      <p className="mt-2">If defects are not reported within 24 hours, the goods will be deemed accepted and any replacement or re-order costs will be payable by the Customer. Glass that has been handled, stored incorrectly, or installed is not eligible for replacement.</p>
      <h3 className="font-medium mt-3 mb-1">6.2 Installed Projects</h3>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Defects relating to workmanship or supplied materials must be notified within 7 days of installation completion.</li>
        <li>Verified defects caused by our workmanship will be remedied within a reasonable timeframe.</li>
      </ul>
      <p className="mt-2">This does not affect your statutory rights.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">7. Site Conditions &amp; Measurements</h2>
      <p>Measurements are taken to suit existing site conditions. The Customer acknowledges that walls and floors are often not perfectly plumb or level, and minor rakes and surface variations are normal in bathrooms.</p>
      <p className="mt-2">The Customer must ensure tiling and waterproofing are complete, plumbing positions are final, floors provide appropriate falls to waste, and safe access is provided.</p>
      <p className="mt-2">We are not responsible for changes to site conditions after measurement, building movement or settlement, or variations caused by uneven surfaces. Minor visual gaps do not constitute a defect.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">8. Installation</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Installation dates are estimates only.</li>
        <li>Delays may occur due to site readiness, supplier delays, or events beyond our control.</li>
        <li>Customers should protect installed glass and fittings until all other bathroom works are completed.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">9. Frameless Glass Shower Characteristics</h2>
      <p>Frameless glass shower enclosures are not fully watertight systems. Minor water leakage may occur and small gaps around hinges and fittings are normal and necessary. Proper waterproofing, floor falls, and drainage are essential and are the responsibility of others involved in the build.</p>
      <p className="mt-2">Minor water escape consistent with frameless shower design does not constitute a defect.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">10. Payment Terms</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Residential customers: balance payable within 7 days of delivery or installation completion.</li>
        <li>Commercial customers: payment due in accordance with agreed credit terms.</li>
      </ul>
      <p className="mt-2">All prices are exclusive of VAT unless stated otherwise.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">11. Ownership of Goods</h2>
      <p>Ownership of goods remains with Custom Showers until payment is made in full.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">12. Post-Installation Responsibility</h2>
      <p>Once installation is completed and accepted, responsibility for the care and protection of the glass and fittings passes to the Customer. We are not liable for damage by other trades, accidental impact, building movement, tiling or plumbing issues, alterations by others, or incorrect cleaning.</p>
      <p className="mt-2">Repairs or replacements required as a result of the above will be chargeable.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">13. Warranty</h2>
      <p>Installation workmanship is warranted for 12 months from completion. Manufacturer warranties apply to supplied products and fittings. The warranty does not cover normal wear and tear, misuse or lack of maintenance, or water leakage consistent with frameless design.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">14. Consumer Rights</h2>
      <p>Nothing in these Terms limits your rights under the Consumer Rights Act 2015.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">15. Limitation of Liability</h2>
      <p>Where legally permitted, we are not liable for indirect or consequential loss. Our liability is limited to the value of the goods and services supplied under the relevant contract.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">16. Cancellation</h2>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>Orders cancelled before manufacture may incur costs already incurred.</li>
        <li>Bespoke orders cannot be cancelled once manufacture begins, except where required by law.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">17. Force Majeure</h2>
      <p>We are not liable for delays caused by events beyond our reasonable control.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">18. Governing Law</h2>
      <p>These Terms are governed by the laws of England and Wales.</p>
    </section>
  </>
);

const PrivacyContent = () => (
  <>
    <section>
      <h2 className="text-base font-semibold mb-1">1. Who We Are</h2>
      <p>Custom Showers (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) supplies and installs bespoke shower enclosures and related glass products across the United Kingdom.</p>
      <p className="mt-2">We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">2. What Information We Collect</h2>
      <p>We may collect the following personal data:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Billing and installation address</li>
        <li>Project details, measurements, and specifications</li>
        <li>Payment and invoicing information</li>
        <li>Website usage data (cookies and analytics where applicable)</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">3. How We Collect Information</h2>
      <p>We collect information when you:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Submit an enquiry via our website</li>
        <li>Request a quote</li>
        <li>Place an order</li>
        <li>Arrange delivery or installation</li>
        <li>Contact us by phone or email</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">4. How We Use Your Information</h2>
      <p>We use personal data to:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Provide quotes and estimates</li>
        <li>Manufacture, supply, and install products</li>
        <li>Arrange delivery and installation</li>
        <li>Issue invoices and process payments</li>
        <li>Communicate about your project</li>
        <li>Comply with legal and accounting obligations</li>
      </ul>
      <p className="mt-2">We do not sell or rent your personal data.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">5. Lawful Basis for Processing</h2>
      <p>We process personal data under one or more of the following lawful bases:</p>
      <ul className="list-disc pl-5 space-y-0.5 mt-1">
        <li>Performance of a contract</li>
        <li>Legitimate business interests</li>
        <li>Legal obligations</li>
        <li>Consent (where required)</li>
      </ul>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">6. Sharing Information</h2>
      <p>We may share personal data with installation staff or subcontractors, suppliers and manufacturers, payment processors, and professional advisers. Only information necessary to perform our services is shared.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">7. Data Security &amp; Retention</h2>
      <p>We take reasonable steps to protect your data from unauthorised access or loss. Data is retained only as long as necessary for business and legal purposes.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">8. Your Rights</h2>
      <p>You have the right to access your personal data, request correction of inaccurate data, request deletion (where applicable), and object to certain processing.</p>
      <p className="mt-2">You may also lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Information Commissioner&apos;s Office (ICO)</a>.</p>
    </section>
    <section>
      <h2 className="text-base font-semibold mb-1">9. Contact</h2>
      <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</p>
      <ul className="list-none pl-0 space-y-1 mt-2">
        <li><strong>Custom Showers</strong></li>
        <li>Email: <a href="mailto:matt@customshowers.uk" className="text-primary hover:underline">matt@customshowers.uk</a></li>
        <li>Phone: <a href="tel:+447462150006" className="text-primary hover:underline">+44 7462 150006</a></li>
      </ul>
    </section>
  </>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer-bg text-footer-text">
      {/* Bottom Bar */}
      <div className="border-t border-footer-text/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-footer-text/60">
            <p>&copy; {currentYear} Custom Showers. All rights reserved.</p>
            <div className="flex gap-6">
              <LegalModal
                trigger={
                  <button className="hover:text-primary transition-colors duration-300">
                    Privacy Policy
                  </button>
                }
                title="Privacy Policy"
                lastUpdated="1st March 2026"
                downloadFilename="CustomShowers-PrivacyPolicy.txt"
                downloadContent={PRIVACY_TEXT}
              >
                <PrivacyContent />
              </LegalModal>
              <LegalModal
                trigger={
                  <button className="hover:text-primary transition-colors duration-300">
                    Terms of Trade
                  </button>
                }
                title="Terms of Trade"
                lastUpdated="1st March 2026"
                downloadFilename="CustomShowers-TermsOfTrade.txt"
                downloadContent={TERMS_TEXT}
              >
                <TermsContent />
              </LegalModal>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

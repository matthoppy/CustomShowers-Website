import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Custom Showers &mdash; Last updated: 1st March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Who We Are</h2>
            <p>Custom Showers (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) supplies and installs bespoke shower enclosures and related glass products across the United Kingdom.</p>
            <p className="mt-3">We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. What Information We Collect</h2>
            <p>We may collect the following personal data:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
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
            <h2 className="text-xl font-semibold mb-2">3. How We Collect Information</h2>
            <p>We collect information when you:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Submit an enquiry via our website</li>
              <li>Request a quote</li>
              <li>Place an order</li>
              <li>Arrange delivery or installation</li>
              <li>Contact us by phone or email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. How We Use Your Information</h2>
            <p>We use personal data to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide quotes and estimates</li>
              <li>Manufacture, supply, and install products</li>
              <li>Arrange delivery and installation</li>
              <li>Issue invoices and process payments</li>
              <li>Communicate about your project</li>
              <li>Comply with legal and accounting obligations</li>
            </ul>
            <p className="mt-3">We do not sell or rent your personal data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Lawful Basis for Processing</h2>
            <p>We process personal data under one or more of the following lawful bases:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Performance of a contract</li>
              <li>Legitimate business interests</li>
              <li>Legal obligations</li>
              <li>Consent (where required)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Sharing Information</h2>
            <p>We may share personal data with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Installation staff or subcontractors</li>
              <li>Suppliers and manufacturers</li>
              <li>Payment processors</li>
              <li>Professional advisers</li>
            </ul>
            <p className="mt-3">Only information necessary to perform our services is shared.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Data Security &amp; Retention</h2>
            <p>We take reasonable steps to protect your data from unauthorised access or loss. Data is retained only as long as necessary for business and legal purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion (where applicable)</li>
              <li>Object to certain processing</li>
            </ul>
            <p className="mt-3">You may also lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Information Commissioner&apos;s Office (ICO)</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</p>
            <ul className="list-none pl-0 space-y-1 mt-3">
              <li><strong>Custom Showers</strong></li>
              <li>Email: <a href="mailto:matt@customshowers.uk" className="text-primary hover:underline">matt@customshowers.uk</a></li>
              <li>Phone: <a href="tel:+447462150006" className="text-primary hover:underline">+44 7462 150006</a></li>
            </ul>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

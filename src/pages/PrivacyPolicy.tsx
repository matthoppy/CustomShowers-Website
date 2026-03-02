import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Custom Showers — Last updated: 2nd March 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
            <p className="text-muted-foreground">
              Custom Showers ("we", "us", "our") supplies and installs bespoke shower enclosures and related products across the United Kingdom.
            </p>
            <p className="text-muted-foreground">
              We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. What Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We may collect:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Name</li>
              <li>Address (billing and installation)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Project details and measurements</li>
              <li>Payment information</li>
              <li>Website usage data (via cookies or analytics)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Collect Information</h2>
            <p className="text-muted-foreground mb-2">We collect data when you:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Submit a website enquiry</li>
              <li>Request a quote</li>
              <li>Place an order</li>
              <li>Book installation</li>
              <li>Contact us by phone or email</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use your data to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provide quotes</li>
              <li>Process orders</li>
              <li>Arrange delivery or installation</li>
              <li>Send invoices</li>
              <li>Respond to enquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground mt-4 font-medium">We do not sell or rent your data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Legal Basis for Processing</h2>
            <p className="text-muted-foreground mb-2">We process your data under one or more of the following lawful bases:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Performance of a contract</li>
              <li>Legitimate interests (operating and improving our business)</li>
              <li>Legal obligation</li>
              <li>Consent (where applicable)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Sharing Your Information</h2>
            <p className="text-muted-foreground mb-2">We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Installation staff and contractors</li>
              <li>Suppliers and manufacturers</li>
              <li>Payment providers</li>
              <li>Accountants and professional advisers</li>
            </ul>
            <p className="text-muted-foreground mt-4 font-medium">We only share what is necessary.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Storage & Security</h2>
            <p className="text-muted-foreground">
              We take reasonable technical and organisational measures to protect your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain information only as long as necessary for business and legal purposes, including HMRC record-keeping requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
            <p className="text-muted-foreground mb-2">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion (where applicable)</li>
              <li>Object to certain processing</li>
              <li>Lodge a complaint with the Information Commissioner's Office (ICO)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <p className="text-muted-foreground">
              <strong>Custom Showers</strong><br />
              Email: <a href="mailto:matt@customshowers.uk" className="text-primary hover:underline">matt@customshowers.uk</a><br />
              Phone: <a href="tel:+447462150006" className="text-primary hover:underline">+44 7462 150006</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

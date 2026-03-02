import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const content = `PRIVACY POLICY
Custom Showers
Last updated: 2nd March 2026

1. Who We Are
Custom Showers ("we", "us", "our") supplies and installs bespoke shower enclosures and related products across the United Kingdom.

We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

2. What Information We Collect
We may collect:
• Name
• Address (billing and installation)
• Email address
• Phone number
• Project details and measurements
• Payment information
• Website usage data (via cookies or analytics)

3. How We Collect Information
We collect data when you:
• Submit a website enquiry
• Request a quote
• Place an order
• Book installation
• Contact us by phone or email

4. How We Use Your Information
We use your data to:
• Provide quotes
• Process orders
• Arrange delivery or installation
• Send invoices
• Respond to enquiries
• Comply with legal obligations

We do not sell or rent your data.

5. Legal Basis for Processing
We process your data under one or more of the following lawful bases:
• Performance of a contract
• Legitimate interests (operating and improving our business)
• Legal obligation
• Consent (where applicable)

6. Sharing Your Information
We may share your information with:
• Installation staff and contractors
• Suppliers and manufacturers
• Payment providers
• Accountants and professional advisers

We only share what is necessary.

7. Data Storage & Security
We take reasonable technical and organisational measures to protect your personal data.

8. Data Retention
We retain information only as long as necessary for business and legal purposes, including HMRC record-keeping requirements.

9. Your Rights
Under UK GDPR, you have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion (where applicable)
• Object to certain processing
• Lodge a complaint with the Information Commissioner's Office (ICO)

10. Contact
Custom Showers
Email: matt@customshowers.uk
Phone: +44 7462 150006
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Custom-Showers-Privacy-Policy.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
            <p className="text-sm text-muted-foreground">Last updated: 2nd March 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">1. Who We Are</h3>
            <p className="text-muted-foreground">
              Custom Showers ("we", "us", "our") supplies and installs bespoke shower enclosures and related products across the United Kingdom.
            </p>
            <p className="text-muted-foreground mt-2">
              We are committed to protecting your personal data and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. What Information We Collect</h3>
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

          <section>
            <h3 className="text-lg font-semibold mb-2">3. How We Collect Information</h3>
            <p className="text-muted-foreground mb-2">We collect data when you:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Submit a website enquiry</li>
              <li>Request a quote</li>
              <li>Place an order</li>
              <li>Book installation</li>
              <li>Contact us by phone or email</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. How We Use Your Information</h3>
            <p className="text-muted-foreground mb-2">We use your data to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provide quotes</li>
              <li>Process orders</li>
              <li>Arrange delivery or installation</li>
              <li>Send invoices</li>
              <li>Respond to enquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground mt-3 font-medium">We do not sell or rent your data.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. Legal Basis for Processing</h3>
            <p className="text-muted-foreground mb-2">We process your data under one or more of the following lawful bases:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Performance of a contract</li>
              <li>Legitimate interests (operating and improving our business)</li>
              <li>Legal obligation</li>
              <li>Consent (where applicable)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. Sharing Your Information</h3>
            <p className="text-muted-foreground mb-2">We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Installation staff and contractors</li>
              <li>Suppliers and manufacturers</li>
              <li>Payment providers</li>
              <li>Accountants and professional advisers</li>
            </ul>
            <p className="text-muted-foreground mt-3 font-medium">We only share what is necessary.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">7. Data Storage & Security</h3>
            <p className="text-muted-foreground">
              We take reasonable technical and organisational measures to protect your personal data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">8. Data Retention</h3>
            <p className="text-muted-foreground">
              We retain information only as long as necessary for business and legal purposes, including HMRC record-keeping requirements.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">9. Your Rights</h3>
            <p className="text-muted-foreground mb-2">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion (where applicable)</li>
              <li>Object to certain processing</li>
              <li>Lodge a complaint with the Information Commissioner's Office (ICO)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">10. Contact</h3>
            <p className="text-muted-foreground">
              <strong>Custom Showers</strong><br />
              Email: <a href="mailto:matt@customshowers.uk" className="text-primary hover:underline">matt@customshowers.uk</a><br />
              Phone: <a href="tel:+447462150006" className="text-primary hover:underline">+44 7462 150006</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

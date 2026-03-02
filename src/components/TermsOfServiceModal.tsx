import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const content = `TERMS OF TRADE
Custom Showers
Last updated: 2nd March 2026

1. Application
These Terms of Trade apply to all goods and services supplied by Custom Showers. By requesting a quote, placing an order, or accepting delivery or installation, you agree to these Terms.

2. Services
We provide:
• Supply of bespoke shower enclosures and glass products
• Supply and installation services
• Installation-only services where agreed in writing

3. Quotations
• Quotes are valid for 30 days unless stated otherwise.
• Quotes are based on information available at the time, including site conditions.
• If site conditions differ from what was reasonably expected, additional costs may apply.

4. Deposits
• A 50% deposit is required before manufacture or ordering of materials begins.
• Work will not commence until the deposit is received.

5. Bespoke & Made-to-Measure Products
• Most products are custom-made.
• Glass is manufactured to industry tolerances, typically ±3mm.
• Once manufacture has commenced, orders cannot be cancelled or refunded, except where required by law.

6. Delivery, Inspection & Defects

6.1 Supply-Only Orders
The Customer must inspect all glass and products within 24 hours of delivery.

Defects must be reported within 24 hours, including:
• Dimensions outside the manufacturer's ±3mm tolerance
• Scratches, chips, cracks, or visible damage
• Incorrect specification or quantity

If defects are not reported within 24 hours, the goods will be deemed accepted and any replacement or re-order costs will be payable by the Customer.

Glass that has been handled, stored incorrectly, or installed is not eligible for replacement.

6.2 Installed Projects
Where installation is provided:
• Defects relating to workmanship or supplied materials must be notified within 7 days of installation completion.
• Verified defects caused by our workmanship will be remedied within a reasonable timeframe.

This does not affect your statutory rights.

7. Site Conditions & Measurements
Measurements are taken to suit existing site conditions.

The Customer acknowledges that:
• Walls and floors are often not perfectly plumb or level
• Minor rakes, out-of-plumb walls, and surface variations are normal in bathrooms

Glass is manufactured to suit the site as measured at the time.

The Customer must ensure:
• Tiling and waterproofing are complete
• Plumbing positions are final
• Floors provide appropriate falls to waste
• Safe and clear access is provided

We are not responsible for:
• Changes to site conditions after measurement
• Building movement or settlement
• Variations caused by uneven or non-plumb surfaces

Minor visual gaps do not constitute a defect.

8. Installation
• Installation dates are estimates only.
• Delays may occur due to site readiness, supplier delays, or events beyond our control.
• Customers should protect installed glass and fittings until all other bathroom works are completed.

9. Frameless Glass Shower Characteristics
Frameless glass shower enclosures are not fully watertight systems.

Due to their design:
• Minor water leakage may occur
• Small gaps around hinges and fittings are normal and necessary

Proper waterproofing, floor falls, and drainage are essential and are the responsibility of others involved in the build.

Minor water escape consistent with frameless shower design does not constitute a defect.

10. Payment Terms
Unless otherwise agreed in writing:
• Residential customers: balance payable within 7 days of delivery or installation completion
• Commercial customers: payment due in accordance with agreed credit terms

All prices are exclusive of VAT unless stated otherwise.

11. Ownership of Goods
Ownership of goods remains with Custom Showers until payment is made in full.

12. Post-Installation Responsibility
Once installation is completed and accepted, responsibility for the care and protection of the glass and fittings passes to the Customer.

We are not liable for damage occurring after installation, including:
• Damage by other trades or contractors
• Accidental impact
• Building movement
• Tiling, plumbing, or waterproofing issues
• Alterations or repairs by others
• Incorrect cleaning or use of unsuitable products

Repairs or replacements required as a result of the above will be chargeable.

13. Warranty
• Installation workmanship is warranted for 12 months from completion.
• Manufacturer warranties apply to supplied products and fittings.

The warranty does not cover:
• Normal wear and tear
• Misuse or lack of maintenance
• Water leakage consistent with frameless design

14. Consumer Rights
Nothing in these Terms limits your rights under the Consumer Rights Act 2015.

15. Limitation of Liability
Where legally permitted:
• We are not liable for indirect or consequential loss
• Our liability is limited to the value of the goods and services supplied under the relevant contract

16. Cancellation
• Orders cancelled before manufacture may incur costs already incurred.
• Bespoke orders cannot be cancelled once manufacture begins, except where required by law.

17. Force Majeure
We are not liable for delays caused by events beyond our reasonable control.

18. Governing Law
These Terms are governed by the laws of England and Wales.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Custom-Showers-Terms-of-Trade.txt';
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
            <h2 className="text-2xl font-bold">Terms of Trade</h2>
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
            <h3 className="text-lg font-semibold mb-2">1. Application</h3>
            <p className="text-muted-foreground">
              These Terms of Trade apply to all goods and services supplied by Custom Showers. By requesting a quote, placing an order, or accepting delivery or installation, you agree to these Terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. Services</h3>
            <p className="text-muted-foreground mb-2">We provide:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Supply of bespoke shower enclosures and glass products</li>
              <li>Supply and installation services</li>
              <li>Installation-only services where agreed in writing</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. Quotations</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Quotes are valid for 30 days unless stated otherwise.</li>
              <li>Quotes are based on information available at the time, including site conditions.</li>
              <li>If site conditions differ from what was reasonably expected, additional costs may apply.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. Deposits</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>A 50% deposit is required before manufacture or ordering of materials begins.</li>
              <li>Work will not commence until the deposit is received.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. Bespoke & Made-to-Measure Products</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Most products are custom-made.</li>
              <li>Glass is manufactured to industry tolerances, typically ±3mm.</li>
              <li>Once manufacture has commenced, orders cannot be cancelled or refunded, except where required by law.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">6. Delivery, Inspection & Defects</h3>

            <h4 className="text-base font-semibold mt-4 mb-2">6.1 Supply-Only Orders</h4>
            <p className="text-muted-foreground mb-2">
              The Customer must inspect all glass and products within 24 hours of delivery.
            </p>
            <p className="text-muted-foreground mb-2">Defects must be reported within 24 hours, including:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Dimensions outside the manufacturer's ±3mm tolerance</li>
              <li>Scratches, chips, cracks, or visible damage</li>
              <li>Incorrect specification or quantity</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              If defects are not reported within 24 hours, the goods will be deemed accepted and any replacement or re-order costs will be payable by the Customer.
            </p>
            <p className="text-muted-foreground mt-2">
              Glass that has been handled, stored incorrectly, or installed is not eligible for replacement.
            </p>

            <h4 className="text-base font-semibold mt-4 mb-2">6.2 Installed Projects</h4>
            <p className="text-muted-foreground mb-2">Where installation is provided:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Defects relating to workmanship or supplied materials must be notified within 7 days of installation completion.</li>
              <li>Verified defects caused by our workmanship will be remedied within a reasonable timeframe.</li>
            </ul>
            <p className="text-muted-foreground mt-3">This does not affect your statutory rights.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">7. Site Conditions & Measurements</h3>
            <p className="text-muted-foreground mb-2">
              Measurements are taken to suit existing site conditions.
            </p>
            <p className="text-muted-foreground mb-2">The Customer acknowledges that:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Walls and floors are often not perfectly plumb or level</li>
              <li>Minor rakes, out-of-plumb walls, and surface variations are normal in bathrooms</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Glass is manufactured to suit the site as measured at the time.
            </p>
            <p className="text-muted-foreground mt-3 mb-2">The Customer must ensure:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Tiling and waterproofing are complete</li>
              <li>Plumbing positions are final</li>
              <li>Floors provide appropriate falls to waste</li>
              <li>Safe and clear access is provided</li>
            </ul>
            <p className="text-muted-foreground mt-3 mb-2">We are not responsible for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Changes to site conditions after measurement</li>
              <li>Building movement or settlement</li>
              <li>Variations caused by uneven or non-plumb surfaces</li>
            </ul>
            <p className="text-muted-foreground mt-3 font-medium">
              Minor visual gaps do not constitute a defect.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">8. Installation</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Installation dates are estimates only.</li>
              <li>Delays may occur due to site readiness, supplier delays, or events beyond our control.</li>
              <li>Customers should protect installed glass and fittings until all other bathroom works are completed.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">9. Frameless Glass Shower Characteristics</h3>
            <p className="text-muted-foreground mb-2">
              Frameless glass shower enclosures are not fully watertight systems.
            </p>
            <p className="text-muted-foreground mb-2">Due to their design:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Minor water leakage may occur</li>
              <li>Small gaps around hinges and fittings are normal and necessary</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Proper waterproofing, floor falls, and drainage are essential and are the responsibility of others involved in the build.
            </p>
            <p className="text-muted-foreground mt-2 font-medium">
              Minor water escape consistent with frameless shower design does not constitute a defect.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">10. Payment Terms</h3>
            <p className="text-muted-foreground mb-2">Unless otherwise agreed in writing:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Residential customers: balance payable within 7 days of delivery or installation completion</li>
              <li>Commercial customers: payment due in accordance with agreed credit terms</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              All prices are exclusive of VAT unless stated otherwise.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">11. Ownership of Goods</h3>
            <p className="text-muted-foreground">
              Ownership of goods remains with Custom Showers until payment is made in full.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">12. Post-Installation Responsibility</h3>
            <p className="text-muted-foreground mb-2">
              Once installation is completed and accepted, responsibility for the care and protection of the glass and fittings passes to the Customer.
            </p>
            <p className="text-muted-foreground mb-2">We are not liable for damage occurring after installation, including:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Damage by other trades or contractors</li>
              <li>Accidental impact</li>
              <li>Building movement</li>
              <li>Tiling, plumbing, or waterproofing issues</li>
              <li>Alterations or repairs by others</li>
              <li>Incorrect cleaning or use of unsuitable products</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Repairs or replacements required as a result of the above will be chargeable.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">13. Warranty</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Installation workmanship is warranted for 12 months from completion.</li>
              <li>Manufacturer warranties apply to supplied products and fittings.</li>
            </ul>
            <p className="text-muted-foreground mt-3 mb-2">The warranty does not cover:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Normal wear and tear</li>
              <li>Misuse or lack of maintenance</li>
              <li>Water leakage consistent with frameless design</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">14. Consumer Rights</h3>
            <p className="text-muted-foreground">
              Nothing in these Terms limits your rights under the Consumer Rights Act 2015.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">15. Limitation of Liability</h3>
            <p className="text-muted-foreground mb-2">Where legally permitted:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>We are not liable for indirect or consequential loss</li>
              <li>Our liability is limited to the value of the goods and services supplied under the relevant contract</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">16. Cancellation</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Orders cancelled before manufacture may incur costs already incurred.</li>
              <li>Bespoke orders cannot be cancelled once manufacture begins, except where required by law.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">17. Force Majeure</h3>
            <p className="text-muted-foreground">
              We are not liable for delays caused by events beyond our reasonable control.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">18. Governing Law</h3>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of England and Wales.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

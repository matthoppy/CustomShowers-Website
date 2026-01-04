/**
 * Quote Summary Component
 * Displays itemized quote breakdown for the shower design
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, Mail, CheckCircle } from 'lucide-react';
import type { DesignConfiguration } from '@/contexts/DesignContext';
import { generateQuote, formatCurrency, formatDate } from '@/lib/quoteCalculator';
import RequestQuoteDialog from './RequestQuoteDialog';

interface QuoteSummaryProps {
  design: DesignConfiguration;
  onDownloadQuote?: () => void;
}

export default function QuoteSummary({
  design,
  onDownloadQuote,
}: QuoteSummaryProps) {
  const quote = generateQuote(design);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const categoryLabels = {
    glass: 'Glass',
    hardware: 'Hardware & Fittings',
    seals: 'Seals & Weatherproofing',
    installation: 'Installation',
    other: 'Other',
  };

  // Group line items by category
  const groupedItems = quote.lineItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof quote.lineItems>);

  return (
    <div className="space-y-6">
      {/* Quote Header */}
      <Card>
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl uppercase">Your Quote</CardTitle>
              <p className="text-primary-foreground/80 mt-1">
                Valid until {formatDate(quote.validUntil)}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {formatCurrency(quote.total)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Design Summary */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                Design
              </h4>
              <p className="font-medium">{design.template?.name || 'Custom Design'}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {design.glassType} glass, {design.glassThickness}mm
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                Specifications
              </h4>
              <p className="text-sm">
                {design.measurements?.width || 0}mm × {design.measurements?.height || 0}mm
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {design.hardwareFinish.replace('-', ' ')} finish
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Itemized Breakdown */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm uppercase mb-3 text-foreground">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={`${category}-${idx}`}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity.toFixed(2)} {item.unit} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">VAT (20%)</span>
              <span className="font-semibold">{formatCurrency(quote.vat)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-2xl">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Premium {design.glassThickness}mm toughened safety glass
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                All hardware and fittings in {design.hardwareFinish.replace('-', ' ')} finish
              </span>
            </li>
            {design.includeSeals && (
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Complete seal package for water protection</span>
              </li>
            )}
            {design.includeInstallation && (
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Professional installation by certified fitters</span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Detailed CAD drawings and installation instructions</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Full manufacturer warranty on all components</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {onDownloadQuote && (
          <Button variant="outline" className="flex-1" onClick={onDownloadQuote}>
            <Download className="w-4 h-4 mr-2" />
            Download Quote (PDF)
          </Button>
        )}
        <Button className="flex-1" onClick={() => setShowRequestDialog(true)}>
          <Mail className="w-4 h-4 mr-2" />
          Request Final Quote
        </Button>
      </div>

      {/* Notes */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Please note:</strong> This is an estimated quote based on the information
            provided. Final pricing may vary following a professional site survey. All prices
            include VAT at 20%. Quote valid for 30 days from the date shown above.
          </p>
        </CardContent>
      </Card>

      {/* Request Quote Dialog */}
      <RequestQuoteDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        design={design}
      />
    </div>
  );
}

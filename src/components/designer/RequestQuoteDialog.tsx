/**
 * Request Quote Dialog
 * Collects customer information and saves design to database
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import type { DesignConfiguration } from '@/contexts/DesignContext';
import { saveDesign, createQuote } from '@/lib/designService';
import { generateQuote } from '@/lib/quoteCalculator';

interface RequestQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  design: DesignConfiguration;
}

export default function RequestQuoteDialog({
  open,
  onOpenChange,
  design,
}: RequestQuoteDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    quoteNumber?: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Save design to database
      const designResult = await saveDesign(design, formData.email, formData.name);

      if (!designResult.success || !designResult.designId) {
        setSubmitStatus({
          type: 'error',
          message: designResult.error || 'Failed to save design',
        });
        setIsSubmitting(false);
        return;
      }

      // Generate quote and save to database
      const quote = generateQuote(design);
      const quoteResult = await createQuote(
        designResult.designId,
        quote.subtotal,
        quote.vat,
        quote.total
      );

      if (!quoteResult.success) {
        setSubmitStatus({
          type: 'error',
          message: 'Design saved but failed to create quote',
        });
        setIsSubmitting(false);
        return;
      }

      // Success!
      setSubmitStatus({
        type: 'success',
        message: 'Your quote request has been submitted successfully!',
        quoteNumber: quoteResult.quoteNumber,
      });

      // Reset form after 3 seconds and close dialog
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', notes: '' });
        setSubmitStatus({ type: null, message: '' });
        onOpenChange(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Final Quote</DialogTitle>
          <DialogDescription>
            Enter your details and we'll send you a detailed quote within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {submitStatus.type === 'success' ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quote Request Submitted!</h3>
            {submitStatus.quoteNumber && (
              <p className="text-muted-foreground mb-4">
                Quote Number: <strong>{submitStatus.quoteNumber}</strong>
              </p>
            )}
            <p className="text-muted-foreground">
              We'll email you a detailed quote within 24 hours. Check your inbox at{' '}
              <strong>{formData.email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07XXX XXXXXX"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements or questions..."
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Error Message */}
            {submitStatus.type === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{submitStatus.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By submitting, you agree to be contacted about your quote. We'll never share your
              information with third parties.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

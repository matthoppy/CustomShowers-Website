/**
 * Customer Quote View Page
 * Public page where customers view their quote via email link
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Download,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/quoteCalculator';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function QuoteView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadQuote();
    }
  }, [id]);

  const loadQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          designs (
            *,
            customers (
              *
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Quote not found');
        return;
      }

      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      setError('Unable to load quote. Please check the link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = () => {
    // TODO: Implement Stripe payment
    alert('Payment integration coming soon!');
  };

  const handleRejectQuote = async () => {
    if (!confirm('Are you sure you want to decline this quote?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      alert('Quote declined. We\'ll be in touch if you change your mind.');
      loadQuote();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Failed to update quote status. Please contact us directly.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Under Review', color: 'text-yellow-600' },
      sent: { variant: 'default', icon: Mail, label: 'Awaiting Response', color: 'text-blue-600' },
      accepted: { variant: 'default', icon: CheckCircle, label: 'Accepted', color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Declined', color: 'text-red-600' },
      expired: { variant: 'outline', icon: AlertCircle, label: 'Expired', color: 'text-gray-600' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const isExpired = () => {
    return new Date(quote.valid_until) < new Date();
  };

  const canAccept = () => {
    return quote.status === 'sent' && !isExpired();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The quote you\'re looking for doesn\'t exist or has been removed.'}</p>
          <Button onClick={() => navigate('/')}>Go to Homepage</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const customer = quote.designs?.customers;

  return (
    <div className="min-h-screen bg-muted">
      <Navigation />

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Quote from BFS</h1>
            <p className="text-xl text-muted-foreground">Quote Number: {quote.quote_number}</p>
          </div>

          {/* Status Alert */}
          {isExpired() && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">This Quote Has Expired</p>
                    <p className="text-sm">
                      This quote was valid until {formatDate(new Date(quote.valid_until))}.
                      Please contact us for a new quote.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quote Summary */}
          <Card className="mb-6">
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Quote Summary</CardTitle>
                {getStatusBadge(quote.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {customer?.email}
                    </p>
                    {customer?.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {customer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Quote Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {formatDate(new Date(quote.created_at))}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Valid Until:</span>{' '}
                      {formatDate(new Date(quote.valid_until))}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Pricing Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pricing Breakdown</h3>

                {/* Mock line items - in production, parse from quote data */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">10mm Clear Glass Panels</p>
                      <p className="text-sm text-muted-foreground">5.2 m² × £180/m²</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(936)}</p>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Chrome Hardware & Fittings</p>
                      <p className="text-sm text-muted-foreground">Hinges, handles, mounting</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(247.5)}</p>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Seals & Weatherproofing</p>
                      <p className="text-sm text-muted-foreground">Complete seal package</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(95)}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(quote.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">VAT (20%)</span>
                    <span className="font-semibold">{formatCurrency(quote.vat_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-2xl">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">{formatCurrency(quote.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Premium 10mm toughened safety glass</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All hardware and fittings in your chosen finish</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Complete seal package for water protection</span>
                </li>
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
          {canAccept() && (
            <Card className="mb-6 bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Ready to Proceed?</h3>
                  <p className="text-primary-foreground/80">
                    Accept this quote and proceed to secure payment
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" onClick={handleAcceptQuote} className="min-w-[200px]">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Accept & Pay Now
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleRejectQuote} className="min-w-[200px]">
                    <XCircle className="w-5 h-5 mr-2" />
                    Decline Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {quote.status === 'accepted' && (
            <Card className="mb-6 border-green-500 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-green-700">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Quote Accepted!</p>
                    <p className="text-sm">
                      Thank you for accepting our quote. We'll be in touch shortly to arrange the next steps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {quote.status === 'rejected' && (
            <Card className="mb-6 border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-red-700">
                  <XCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Quote Declined</p>
                    <p className="text-sm">
                      You've declined this quote. If you change your mind or have questions, please contact us.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Questions About Your Quote?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our team is here to help. Contact us if you have any questions or need to discuss your quote.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <a href="mailto:sales@bespokeframelessshowers.co.uk">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:+441234567890">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Us
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

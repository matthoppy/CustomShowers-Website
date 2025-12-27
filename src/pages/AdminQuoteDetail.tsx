/**
 * Admin Quote Detail & Edit Page
 * View and edit individual quote details, adjust pricing, change status
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Mail,
  Edit2,
  Plus,
  Trash2,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/quoteCalculator';
import { useToast } from '@/hooks/use-toast';

interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category: string;
  isCustom?: boolean;
}

export default function AdminQuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAdmin();
  const { toast } = useToast();

  const [quote, setQuote] = useState<any>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

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

      setQuote(data);
      setEditedStatus(data.status);
      setAdminNotes(data.admin_notes || '');

      // Generate line items from quote data
      generateLineItems(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load quote details',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLineItems = (quoteData: any) => {
    // For now, create basic line items
    // In production, you'd calculate from the design configuration
    const items: QuoteLineItem[] = [
      {
        id: '1',
        description: 'Glass Panels (10mm Clear)',
        quantity: 5.2,
        unit: 'm²',
        unitPrice: 180,
        totalPrice: 936,
        category: 'glass',
      },
      {
        id: '2',
        description: 'Geneva Hinges',
        quantity: 2,
        unit: 'units',
        unitPrice: 45,
        totalPrice: 90,
        category: 'hardware',
      },
      {
        id: '3',
        description: 'U-Channel (Chrome)',
        quantity: 4.5,
        unit: 'm',
        unitPrice: 35,
        totalPrice: 157.5,
        category: 'hardware',
      },
    ];

    setLineItems(items);
  };

  const updateLineItem = (itemId: string, field: keyof QuoteLineItem, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          // Recalculate total
          if (field === 'quantity' || field === 'unitPrice') {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addCustomLineItem = () => {
    const newItem: QuoteLineItem = {
      id: `custom-${Date.now()}`,
      description: 'Custom Item',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      totalPrice: 0,
      category: 'other',
      isCustom: true,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((items) => items.filter((item) => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vat = subtotal * 0.2;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { subtotal, vat, total } = calculateTotals();

      const { error } = await supabase
        .from('quotes')
        .update({
          subtotal_amount: subtotal,
          vat_amount: vat,
          total_amount: total,
          status: editedStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Quote updated successfully',
      });

      setIsEditing(false);
      loadQuote();
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save quote',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = () => {
    toast({
      title: 'Coming Soon',
      description: 'Email functionality will be implemented next',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Quote not found</p>
          <Link to="/admin/quotes">
            <Button>Back to Quotes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { subtotal, vat, total } = calculateTotals();
  const customer = quote.designs?.customers;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/admin/quotes" className="text-sm opacity-80 hover:opacity-100 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Quotes
              </Link>
              <h1 className="text-2xl font-bold mt-1">Quote {quote.quote_number}</h1>
            </div>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{customer?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{customer?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{customer?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quote Created</Label>
                  <p className="font-medium">
                    {new Date(quote.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quote Line Items</CardTitle>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={addCustomLineItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          {isEditing ? (
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(item.id, 'description', e.target.value)
                              }
                            />
                          ) : (
                            <p className="font-medium">{item.description}</p>
                          )}
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(item.id, 'quantity', parseFloat(e.target.value))
                              }
                            />
                          ) : (
                            <p className="font-medium">
                              {item.quantity} {item.unit}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Unit Price</Label>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value))
                              }
                            />
                          ) : (
                            <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                          )}
                        </div>
                        <div>
                          <Label>Total</Label>
                          <div className="flex items-center justify-between">
                            <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                            {isEditing && item.isCustom && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeLineItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">VAT (20%)</span>
                    <span className="font-semibold">{formatCurrency(vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-2xl">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  placeholder="Add notes for internal use only..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Status</Label>
                  {isEditing ? (
                    <Select value={editedStatus} onValueChange={setEditedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="sent">Sent to Customer</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2">
                      <Badge className="text-sm">{editedStatus}</Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Valid Until</Label>
                  <p className="font-medium">
                    {new Date(quote.valid_until).toLocaleDateString('en-GB')}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">
                    {new Date(quote.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isEditing ? (
                  <>
                    <Button className="w-full" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Quote
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleSendEmail}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to Customer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        loadQuote();
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Quote ID:</strong> {quote.id}
                  </p>
                  <p>
                    <strong>Design ID:</strong> {quote.design_id}
                  </p>
                  <p>
                    <strong>Customer ID:</strong> {customer?.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

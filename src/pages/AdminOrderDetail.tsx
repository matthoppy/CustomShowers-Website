/**
 * Admin Order Detail Page
 * View and manage individual order details
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  CreditCard,
  FileText,
  Mail,
  Phone,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/quoteCalculator';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          designs (
            *,
            customers (
              *
            )
          ),
          quotes (
            *
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setOrder(data);
      setAdminNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}`,
      });

      loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ admin_notes: adminNotes })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Notes Saved',
        description: 'Admin notes have been updated',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      in_production: { variant: 'default', icon: Package, label: 'In Production' },
      ready: { variant: 'default', icon: CheckCircle, label: 'Ready' },
      shipped: { variant: 'default', icon: Truck, label: 'Shipped' },
      delivered: { variant: 'default', icon: CheckCircle, label: 'Delivered' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      paid: { variant: 'default', label: 'Paid' },
      failed: { variant: 'destructive', label: 'Failed' },
      refunded: { variant: 'outline', label: 'Refunded' },
    };

    const config = variants[paymentStatus] || variants.pending;

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading order...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const customer = order.designs?.customers;
  const quote = order.quotes;
  const design = order.designs;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/admin/orders')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-3xl font-bold">{order.order_number}</h1>
            <p className="text-muted-foreground">
              Created on {formatDate(new Date(order.created_at))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            {getPaymentBadge(order.payment_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{customer?.full_name}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p>{customer?.email}</p>
                  </div>
                  {customer?.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p>{customer.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Design Details */}
            <Card>
              <CardHeader>
                <CardTitle>Design Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Template</label>
                    <p className="capitalize">{design?.template_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Glass Type</label>
                    <p className="capitalize">{design?.glass_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hardware Finish</label>
                    <p className="capitalize">{design?.hardware_finish || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Door Opening</label>
                    <p className="capitalize">{design?.door_opening || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Quote Number</span>
                    <span className="font-medium">{quote?.quote_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium capitalize">{order.payment_method || 'N/A'}</span>
                  </div>
                  {order.stripe_payment_id && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Payment ID</span>
                      <span className="font-mono text-sm">{order.stripe_payment_id}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-2xl">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add internal notes about this order..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                />
                <Button onClick={handleSaveNotes} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_production">In Production</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Download DXF Files
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Hardware Specs
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Customer
                </Button>
                {quote && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/admin/quotes/${quote.id}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Quote
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getPaymentBadge(order.payment_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="font-medium capitalize flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {order.payment_method || 'N/A'}
                  </span>
                </div>
                {order.stripe_payment_id && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Stripe ID</span>
                    <code className="text-xs bg-muted p-1 rounded block break-all">
                      {order.stripe_payment_id}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

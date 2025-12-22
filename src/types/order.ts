/**
 * Order Type Definitions
 */

export type OrderStatus =
  | 'pending'
  | 'payment_received'
  | 'manufacturing'
  | 'ready_for_delivery'
  | 'in_transit'
  | 'delivered'
  | 'installed'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type QuoteStatus = 'active' | 'expired' | 'accepted' | 'declined';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  created_at: string;
  updated_at: string;
}

export interface AdditionalCost {
  item: string;
  cost: number;
}

export interface Quote {
  id: string;
  design_id: string;
  customer_id: string;

  // Pricing (all in GBP)
  glass_cost: number;
  hardware_cost: number;
  installation_cost: number;
  additional_costs: AdditionalCost[];

  subtotal: number;
  vat: number;
  total: number;

  // Metadata
  quote_number: string;
  valid_until: string;
  status: QuoteStatus;
  quote_details?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  quote_id: string;
  design_id: string;
  customer_id: string;

  // Status
  status: OrderStatus;

  // Payment
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  payment_method?: string;
  amount_paid?: number;
  paid_at?: string;

  // Fulfillment files
  dxf_file_url?: string;
  hardware_spec_url?: string;
  instruction_sheet_url?: string;

  // Delivery
  delivery_address?: Address;
  estimated_delivery?: string;
  actual_delivery_date?: string;
  delivery_notes?: string;

  // Notes
  customer_notes?: string;
  internal_notes?: string;

  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

/**
 * Order summary for display
 */
export interface OrderSummary {
  order: Order;
  quote: Quote;
  customer: Customer;
  status_history: OrderStatusHistory[];
}

/**
 * Payment intent data for Stripe
 */
export interface PaymentIntentData {
  amount: number; // in pence (GBP)
  currency: 'gbp';
  quote_id: string;
  customer_email: string;
  customer_name: string;
  metadata: {
    quote_id: string;
    design_id: string;
    customer_id: string;
  };
}

/**
 * Checkout session data
 */
export interface CheckoutSession {
  quote: Quote;
  customer: Customer;
  delivery_address: Address;
}

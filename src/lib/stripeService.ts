/**
 * Stripe Payment Service
 * Handles payment processing for accepted quotes
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreateCheckoutParams {
  quoteId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe checkout session for a quote
 * Redirects the user to Stripe checkout page
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { quoteId } = params;

    // Generate success and cancel URLs
    const baseUrl = window.location.origin;
    const successUrl = params.successUrl || `${baseUrl}/quote/${quoteId}?payment=success`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/quote/${quoteId}?payment=cancelled`;

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        quoteId,
        successUrl,
        cancelUrl,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }

    if (!data.success || !data.url) {
      return { success: false, error: 'Failed to create checkout session' };
    }

    // Redirect to Stripe checkout
    window.location.href = data.url;

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating checkout session:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if a payment was successful (from URL params)
 */
export function getPaymentStatus(): 'success' | 'cancelled' | null {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');

  if (payment === 'success') return 'success';
  if (payment === 'cancelled') return 'cancelled';
  return null;
}

/**
 * Clear payment status from URL
 */
export function clearPaymentStatus(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('payment');
  window.history.replaceState({}, '', url.toString());
}

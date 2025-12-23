/**
 * Design Service
 * Handles saving and loading shower designs from Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { DesignConfiguration } from '@/contexts/DesignContext';
import type { Database } from '@/integrations/supabase/types';

type DesignInsert = Database['public']['Tables']['designs']['Insert'];
type DesignRow = Database['public']['Tables']['designs']['Row'];

/**
 * Convert DesignConfiguration to database format
 */
function designToDatabase(design: DesignConfiguration, customerId?: string): Omit<DesignInsert, 'id' | 'created_at' | 'updated_at'> {
  return {
    customer_id: customerId || null,
    template_id: design.template?.id || null,
    configuration: {
      glassType: design.glassType,
      glassThickness: design.glassThickness,
      mountingType: design.mountingType,
      hardwareFinish: design.hardwareFinish,
      hingeType: design.hingeType,
      handleType: design.handleType,
      doorOpening: design.doorOpening,
      includeSeals: design.includeSeals,
      includeInstallation: design.includeInstallation,
      sealType: design.sealType,
    },
    measurements: design.measurements || null,
    measurement_points: design.measurementPoints,
    customer_notes: design.customerNotes || null,
    status: 'draft',
  };
}

/**
 * Save a design to the database
 */
export async function saveDesign(
  design: DesignConfiguration,
  customerEmail: string,
  customerName: string
): Promise<{ success: boolean; designId?: string; error?: string }> {
  try {
    // First, create or get customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .single();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: customerEmail,
          full_name: customerName,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        return { success: false, error: 'Failed to create customer record' };
      }

      customerId = newCustomer.id;
    }

    // Save design
    const designData = designToDatabase(design, customerId);

    const { data: savedDesign, error: designError } = await supabase
      .from('designs')
      .insert(designData)
      .select('id')
      .single();

    if (designError || !savedDesign) {
      return { success: false, error: 'Failed to save design' };
    }

    return { success: true, designId: savedDesign.id };
  } catch (error) {
    console.error('Error saving design:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Load a design from the database
 */
export async function loadDesign(designId: string): Promise<{ success: boolean; design?: Partial<DesignConfiguration>; error?: string }> {
  try {
    const { data: designData, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single();

    if (error || !designData) {
      return { success: false, error: 'Design not found' };
    }

    // Convert database format back to DesignConfiguration
    const config = designData.configuration as any;

    const design: Partial<DesignConfiguration> = {
      glassType: config.glassType,
      glassThickness: config.glassThickness,
      mountingType: config.mountingType,
      hardwareFinish: config.hardwareFinish,
      hingeType: config.hingeType,
      handleType: config.handleType,
      doorOpening: config.doorOpening,
      includeSeals: config.includeSeals,
      includeInstallation: config.includeInstallation,
      sealType: config.sealType,
      measurements: designData.measurements || null,
      measurementPoints: designData.measurement_points || [],
      customerNotes: designData.customer_notes || undefined,
    };

    return { success: true, design };
  } catch (error) {
    console.error('Error loading design:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a quote record in the database
 */
export async function createQuote(
  designId: string,
  subtotal: number,
  vat: number,
  total: number
): Promise<{ success: boolean; quoteId?: string; quoteNumber?: string; error?: string }> {
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        design_id: designId,
        subtotal_amount: subtotal,
        vat_amount: vat,
        total_amount: total,
        status: 'pending',
      })
      .select('id, quote_number')
      .single();

    if (error || !quote) {
      return { success: false, error: 'Failed to create quote' };
    }

    return {
      success: true,
      quoteId: quote.id,
      quoteNumber: quote.quote_number || undefined,
    };
  } catch (error) {
    console.error('Error creating quote:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', quoteId);

    if (error) {
      return { success: false, error: 'Failed to update quote status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating quote status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

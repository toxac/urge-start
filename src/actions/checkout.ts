'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const PROGRAM_OFFERING_ID = '8699e695-ebad-4e50-a160-487d5430a98c';

export async function getProgramOffering() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('offerings')
    .select('id, name, description, price, currency')
    .eq('id', PROGRAM_OFFERING_ID)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('Program offering is currently unavailable.');
  }

  return {
    ...data,
    price: Number(data.price),
    currency: data.currency || 'INR',
  };
}

export async function validateDiscountCode(code: string, offeringId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data: discount, error } = await supabase
    .from('discounts')
    .select('id, discount_type, value, valid_until')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !discount) {
    return { success: false, error: 'Invalid or inactive discount code.' };
  }

  if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
    return { success: false, error: 'This discount code has expired.' };
  }

  // Note: RLS allows us to safely return the discount value here for the client to preview
  return { success: true, discount };
}

/**
 * MOCK PAYMENT ADAPTER
 * Swap this logic later with Stripe/Razorpay SDK calls.
 */
async function processPaymentGateway(amount: number, currency: string) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  if (amount === 0) {
    return { success: true, transactionId: 'free_txn_' + Date.now() };
  }
  
  // Mock success for paid transactions
  return { success: true, transactionId: 'mock_txn_' + Date.now() };
}

export async function finalizeCheckout(offeringId: string, finalAmount: number, currency: string, discountId?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Unauthorized');

  // 1. Process Payment via Adapter
  const paymentResult = await processPaymentGateway(finalAmount, currency);

  if (!paymentResult.success) {
    throw new Error('Payment processing failed. Please try again.');
  }

  // 2. Record Transaction
  const { error: txnError } = await supabase
    .from('user_transactions')
    .insert({
      user_id: user.id,
      offering_id: offeringId,
      discount_id: discountId || null,
      amount: finalAmount,
      currency: currency,
      status: 'completed',
      provider: finalAmount === 0 ? 'discount' : 'mock_processor',
      provider_transaction_id: paymentResult.transactionId,
    });

  if (txnError) throw new Error(`Transaction recording failed: ${txnError.message}`);

  // 3. Activate Subscription
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('offering_id', offeringId);

  if (subError) throw new Error(`Failed to activate subscription: ${subError.message}`);

  return { success: true };
}
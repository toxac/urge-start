'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateDiscountCode, finalizeCheckout } from '@/actions/checkout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  offering: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
  };
}

export function CheckoutForm({ offering }: CheckoutFormProps) {
  const router = useRouter();
  
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; type: string; value: number } | null>(null);
  
  const [isApplying, setIsApplying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate final price dynamically
  let finalPrice = offering.price;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      finalPrice = Math.max(0, offering.price * (1 - appliedDiscount.value / 100));
    } else if (appliedDiscount.type === 'fixed_amount') {
      finalPrice = Math.max(0, offering.price - appliedDiscount.value);
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsApplying(true);
    setError(null);
    
    const result = await validateDiscountCode(discountCode, offering.id);
    
    if (result.success && result.discount) {
      setAppliedDiscount({
        id: result.discount.id,
        type: result.discount.discount_type,
        value: result.discount.value
      });
      setError(null);
    } else {
      setError(result.error || 'Invalid code.');
      setAppliedDiscount(null);
    }
    
    setIsApplying(false);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await finalizeCheckout(offering.id, finalPrice, offering.currency, appliedDiscount?.id);
      
      if (result.success) {
        // Payment successful, send them into the program
        router.push('/program');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      
      {/* Order Summary */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{offering.name}</h2>
          {offering.description && (
            <p className="text-sm text-muted-foreground">{offering.description}</p>
          )}
        </div>

        <div className="flex justify-between border-b border-border pb-4 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{offering.currency} {offering.price.toLocaleString()}</span>
        </div>

        {appliedDiscount && (
          <div className="flex justify-between border-b border-border pb-4 text-sm text-green-600 dark:text-green-400">
            <span>Discount ({discountCode.toUpperCase()})</span>
            <span>
              -{offering.currency} {(offering.price - finalPrice).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{offering.currency} {finalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Discount Input */}
      {!appliedDiscount && (
        <div className="space-y-2">
          <Label htmlFor="discount">Discount Code</Label>
          <div className="flex gap-2">
            <Input 
              id="discount" 
              placeholder="Enter code..." 
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              disabled={isApplying || isProcessing}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleApplyDiscount}
              disabled={!discountCode || isApplying || isProcessing}
            >
              {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Checkout Button */}
      <Button 
        onClick={handleCheckout} 
        disabled={isProcessing} 
        className="w-full h-12 text-base"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
          </span>
        ) : finalPrice === 0 ? (
          'Complete Free Registration'
        ) : (
          `Pay ${offering.currency} ${finalPrice.toLocaleString()}`
        )}
      </Button>
    </div>
  );
}
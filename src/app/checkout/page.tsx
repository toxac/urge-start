import { getProgramOffering } from '@/actions/checkout';
import { AuthShell } from '@/components/auth/AuthShell';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { AlertCircle } from 'lucide-react';

export default async function CheckoutPage() {
  try {
    // Fetch the offering server-side
    const offering = await getProgramOffering();

    return (
      <AuthShell
        eyebrow="Almost there"
        title="Complete your registration."
        description="Secure your spot in the program and start building."
      >
        <CheckoutForm offering={offering} />
      </AuthShell>
    );
  } catch (error: any) {
    return (
      <AuthShell title="Checkout Unavailable">
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error.message || 'Unable to load checkout.'}</p>
        </div>
      </AuthShell>
    );
  }
}
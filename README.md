I just realized we have to implement onboarding and authentication before i can test out the program and progress as we will need authenticated user for this.
## Role
Expert backend engineer with experience building scalable web app. 

## Current Authentication Setup
- current Pages (code is included below)
    1. src/app/(auth)/layout.tsx
    2. src/app/(auth)/login/page.tsx
    3. src/app/(auth)/signup/page.tsx
    4. src/app/(auth)/signup/check-email/page.tsx
    5. src/app/(auth)/reset-password/page.tsx
    6. src/app/(auth)/forgot-password/page.tsx
    7. src/app/auth/callback/route.ts
    8. proxy.ts -> replacement for middleware.ts in current nextjs version
- components attached
- other files attached

## the flow that I want to accomplish
1. signup (either paid or trial) 
2. confirmation link in email 
3. redirect page
    1. payment page (if paid) -> profile/onboarding page
    2. profile/onboarding page
4. (platform)/program/page.tsx -> if no progress then show welcome message


## Few thoughts on user signup
- Urge offers one main product that is program which user pay for monthly. The payment can be discounted
- We can club registration and payment together in one component to reduce the number of steps users need.
- We want to have flexibility and simplicity so lets say i wanted to have some onboarding pre-program discovery component where user can see how urge would help them in their journey. It wont impact rest of the process as we leave them with two CTA buttons either to try for a months or join the program.
- I has also implemented payment and catalogue/offering earlier which we can use here and improve/simplify if we think that works best for urge. here are urge offerings:
    - program (monthly subscription nased memebership)
    - selected events
    - merch/guides other digital and physical products
- I have included tables which i had in previous version with explanation

```ts
 discounts: {
    // discounts for offerings. it can be either by discount_type of money amount or percentage
        Row: {
          application_type: string
          code: string | null
          created_at: string
          discount_type: string
          ends_at: string | null
          id: string
          metadata: Json
          name: string
          offering_id: string
          starts_at: string | null
          status: string
          updated_at: string
          value: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        // this table reflects all offerings users are entitled to. We can use this for program subscription as well which has another dedicated table
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          scope: string | null
          source_id: string | null
          source_type: string
          starts_at: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Relationships: []
      }
      offering_prices: {
        // We can simply this to have only one price instead of varying prices based on how many months they are paying for upfront. I would simplify it to have discount code which we would offer for if they pay upfront for 3 or 6 or 12 months without changing the offering price
        Row: {
          access_duration_months: number | null
          billing_interval: string | null
          billing_interval_count: number | null
          billing_type: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          name: string
          offering_id: string
          price: number
          status: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_prices_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        // If we are just offering one price then the above table offering_prices is irrelevant 
        Row: {
          availability_status: string
          available_from: string | null
          available_until: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          slug: string
          type: string
          updated_at: string
        }
        Relationships: []
      }
      order_items: {
        
        Row: {
          created_at: string
          discount: number
          id: string
          metadata: Json
          name: string
          offering_id: string
          offering_price_id: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_offering_price_id_fkey"
            columns: ["offering_price_id"]
            isOneToOne: false
            referencedRelation: "offering_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          discount: number
          id: string
          metadata: Json
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
        }
        Relationships: []
      }
      subscriptions: {
        // this is only for program subscription
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json
          offering_price_id: string
          provider: string
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_offering_price_id_fkey"
            columns: ["offering_price_id"]
            isOneToOne: false
            referencedRelation: "offering_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        // actual transactions
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          order_id: string
          provider: string
          provider_transaction_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }

```


## Code 

1. src/app/(auth)/layout.tsx
```tsx
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return children;
}
```

2. src/app/(auth)/login/page.tsx
```tsx
// form is missing
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back
        </h1>

        <p className="mt-3 text-muted-foreground">
          Sign in to continue.
        </p>
      </div>
    </main>
  );
}
```

3. src/app/(auth)/signup/page.tsx
```tsx
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Start here"
      title="Let's get you in."
      description="You only need an email and password for now. We'll figure out the rest together later."
    >
      <SignupForm />
    </AuthShell>
  );
}
```
4. src/app/(auth)/signup/check-email/page.tsx
```tsx
import Link from 'next/link';

import { AuthShell } from '@/components/auth/AuthShell';

export default function CheckEmailPage() {
  return (
    <AuthShell
      eyebrow="One small step"
      title="Check your email."
      description="We sent you a confirmation link. Once you've confirmed your email, you can come back and sign in."
    >
      <div className="space-y-6">
        <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
          If you don&apos;t see it, check your spam or promotions folder.
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already confirmed?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
```
5. src/app/(auth)/reset-password/page.tsx

```tsx
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Almost there"
      title="Choose a new password."
      description="Pick something you'll be comfortable using next time."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

```
6. src/app/(auth)/forgot-password/page.tsx
```tsx
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password"
      title="Forgot your password?"
      description="No problem. We'll send you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

```
7. src/app/auth/callback/route.ts
```ts
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');

  const safeNext =
    next && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/program';

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=auth_callback', url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=auth_callback', url.origin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
```
8. proxy.ts -> replacement for middleware.ts in current nextjs version
```ts
import { type NextRequest } from 'next/server';

import { updateSupabaseSession } from './src/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Run proxy on all routes except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - common image/file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

9. src/app/(platform)/layout.tsx
```tsx
import type { ReactNode } from 'react';

import { UserHydrator } from '@/components/hydrators/UserHydrator';
import { AppShell } from '@/components/layout/AppShell';
import {
  getAuthenticatedUser,
  getCurrentProfile,
} from '@/lib/auth';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default async function PlatformLayout({
  children,
}: PlatformLayoutProps) {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <UserHydrator
      user={user}
      profile={profile}
    >
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </UserHydrator>
  );
}

```

## Attached Files
1. src/lib/auth.ts
2. src/components/hydrators/UserHydrator.tsx
3. src/components/auth/AuthShell.tsx
4. src/components/auth/ForgotPasswordForm.tsx
5. src/components/auth/LoginForm.tsx
6. src/components/auth/ResetPasswordForm.tsx
7. src/components/auth/SignupForm.tsx

## Important Instructions
1. Ask me for any missing files or clarifications before making any assumptions about code or implementation
2. First go through this figure out missing parts and recommend onboarding plan
3. Payment and Offering,- we don;t have these tables now in the database, so we can implement something which works better without complicating it as i had done in previous version
4. First lets have a plan

    

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
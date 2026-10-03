import Link from 'next/link';
import { Lock } from 'lucide-react';

interface TrialPaywallProps {
  missionKey: string;
}

export function TrialPaywall({ missionKey }: TrialPaywallProps) {
  const missionNumber = missionKey.split('-')[1];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h2 className="font-heading text-3xl font-bold tracking-tight">
        Mission {missionNumber} is locked.
      </h2>
      
      <p className="mt-4 text-lg text-muted-foreground">
        You are currently on the trial pass. To continue building your business and access 
        the rest of the Urge program, upgrade your account.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/program"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          Back to Program
        </Link>
        <Link
          href="/checkout"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
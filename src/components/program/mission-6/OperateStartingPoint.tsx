'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Compass,
  DollarSign,
  HeartHandshake,
  Loader2,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $activeBuild,
  $activeProject,
  $selectedOffer,
} from '@/lib/stores/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function OperateStartingPoint({ node, onComplete }: NodeComponentProps) {
  const project = useStore($activeProject);
  const offer = useStore($selectedOffer);
  const build = useStore($activeBuild);

  const [continuing, setContinuing] = useState(false);

  const econ = project?.metadata?.economics;
  const currency = offer?.metadata?.currency ?? econ?.currency ?? '₹';
  const price = offer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setContinuing(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mission 6 · Operate &amp; Grow
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Live Business Baseline Snapshot */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operating Baseline · {build?.version_label ?? 'v1.0'}
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {offer?.title ?? project?.title ?? 'Your Live Offer'}
            </h2>
          </div>
          {price > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {currency}
              {price.toLocaleString()} / sale
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Megaphone className="h-3.5 w-3.5 text-primary" />
              <span>1. Market</span>
            </div>
            <p className="leading-5 text-muted-foreground">
              Turn inquiries into paying buyers without buying expensive ads
              before conversion works.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>2. Money</span>
            </div>
            <p className="leading-5 text-muted-foreground">
              Protect your profit per sale and watch actual delivery hours
              against your Mission 4 ceiling.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <HeartHandshake className="h-3.5 w-3.5 text-amber-600" />
              <span>3. Customer</span>
            </div>
            <p className="leading-5 text-muted-foreground">
              Deliver the promised outcome in Week 1 so buyers renew and refer
              peers organically.
            </p>
          </div>
        </div>
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={continuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {continuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Set your quarterly operating targets
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
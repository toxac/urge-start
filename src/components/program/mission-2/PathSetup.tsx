'use client';

import { useState } from 'react';
import { ArrowRight, Clock, Loader2, ShieldAlert, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function PathSetup({ node, onComplete }: NodeComponentProps) {
  const [isContinuing, setIsContinuing] = useState(false);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <Wrench className="h-6 w-6 text-primary" />
          <h2 className="font-semibold text-foreground">Solutions have shapes</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The same problem can be solved with a service, a tool, a community, or training. How you solve it changes everything.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="font-semibold text-foreground">Honest accounting</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            A great problem is useless to you if it requires three years of coding or £50,000 you don’t have.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="font-semibold text-foreground">Feasible before perfect</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            You don&apos;t need to build the ultimate version. You need a version you can actually deliver in the real world.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => void handleContinue()}
          disabled={isContinuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Explore solutions
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
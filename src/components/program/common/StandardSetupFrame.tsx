'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function StandardSetupFrame({ node, onComplete }: NodeComponentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete({ completed: true });
    } catch (error) {
      console.error('[SETUP FRAME]', error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-6">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        {node.intent && (
          <p className="max-w-3xl text-xl leading-8 text-foreground font-medium">
            {node.intent}
          </p>
        )}
        {node.description && (
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground whitespace-pre-wrap">
            {node.description}
          </p>
        )}
        <div className="flex max-w-3xl justify-start pt-4">
          <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
            {isSubmitting ? 'Saving...' : "Continue"}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
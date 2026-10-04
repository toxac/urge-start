'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/registry';

export function StandardSetupFrame({ node, onComplete }: NodeComponentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Setup nodes usually don't have a payload, they just mark completion
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

        {/* We use node.intent here, but you could easily add a 'description' field to ProgramNode types later */}
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {node.intent}
        </p>

        <div className="flex max-w-3xl justify-start pt-4">
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {isSubmitting ? 'Saving...' : "Let's find out"}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
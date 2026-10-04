'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments';

export function FearAudit({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [protocol, setProtocol] = useState(
    typeof saved.protocol === 'string' ? saved.protocol : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSaveProtocol() {
    if (protocol.trim().length < 10 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveCommitment({
        statement: `Rejection Protocol: ${protocol.trim()}`,
        source_node_key: nodeKey,
      });
      setIsCommitted(true);
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onComplete({ protocol: protocol.trim(), completed: true });
  }

  return (
    <div className="w-full space-y-10">
      {!isCommitted ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Define your Rejection Protocol.</h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              You will hear "no" constantly. Write down your mechanical protocol for when it happens. (e.g., "When I hear no, I will immediately say thank you and ask what one thing would have changed their mind.")
            </p>
          </div>
          <div className="max-w-3xl space-y-4">
            <Textarea
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder="When I hear 'no', my protocol is to..."
              className="min-h-[160px] resize-none text-lg leading-8 font-medium"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex max-w-3xl justify-end">
            <Button onClick={handleSaveProtocol} disabled={protocol.trim().length < 10 || isSubmitting} className="h-12 rounded-full px-8 text-base">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Lock it in'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-12 duration-700">
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold tracking-tight">Protocol established.</h2>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <p className="font-heading text-2xl font-medium leading-relaxed">"{protocol}"</p>
            </div>
            <p className="text-lg leading-8 text-muted-foreground pt-4">This removes the emotion from hearing no. It is just a trigger for your protocol.</p>
          </div>
          <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
            Complete Quest 4 <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
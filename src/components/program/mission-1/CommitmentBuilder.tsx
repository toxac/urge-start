'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Clock, Wallet, ShieldAlert } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments'; 
import { $userContext } from '@/lib/stores/user-context';

export function CommitmentBuilder({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const rawContext = useStore($userContext) as any;
  
  // Directly pull the currency code as stored in DB (defaults to USD if unset)
  const currency = rawContext?.userProfile?.currency || rawContext?.profile?.currency || rawContext?.currency || 'USD';

  const saved = progress.payload ?? {};

  // Form State
  const [time, setTime] = useState('');
  const [money, setMoney] = useState('');
  const [promise, setPromise] = useState('');
  
  const [finalCommitment, setFinalCommitment] = useState(
    typeof saved.commitment === 'string' ? saved.commitment : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = time.trim() !== '' && money.trim() !== '' && promise.trim().length >= 10;

  async function handleSaveCommitment() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const compiledStatement = `I commit to giving this ${time} hours every week and setting aside ${money} ${currency}. When things get tough or frustrating, my rule for myself is: "${promise.trim()}"`;

    try {
      await saveCommitment({
        statement: compiledStatement,
        source_node_key: nodeKey,
      });

      setFinalCommitment(compiledStatement);
      setIsCommitted(true);
    } catch (err: any) {
      console.error('[COMMITMENT BUILDER]', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    await onComplete({
      commitment: finalCommitment,
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10 pb-16">
      
      {!isCommitted ? (
        <div className="w-full space-y-8">
          <div className="w-full space-y-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
              {node.title || "Draw your line in the sand."}
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              A commitment without boundaries is just wishful thinking. Don't promise outcomes you can't control. Define the exact time and money you are willing to spend, and decide now how you'll handle it when it gets uncomfortable.
            </p>
          </div>

          <div className="w-full space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            
            {/* Time */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Weekly focus
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="10"
                  className="w-32 text-lg"
                  disabled={isSubmitting}
                />
                <span className="text-muted-foreground">hours per week</span>
              </div>
            </div>

            {/* Money */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Budget put aside
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  placeholder="5000"
                  className="w-32 text-lg"
                  disabled={isSubmitting}
                />
                <span className="text-muted-foreground font-medium">{currency} ready to spend</span>
              </div>
            </div>

            {/* Rule for self */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Your non-negotiable
              </label>
              <p className="text-sm text-muted-foreground pb-1">
                How will you act when the initial excitement fades and you feel like quitting?
              </p>
              <Textarea
                value={promise}
                onChange={(e) => setPromise(e.target.value)}
                placeholder="I will keep going for at least 3 months, even if..."
                className="min-h-[100px] w-full resize-none text-base shadow-sm"
                disabled={isSubmitting}
              />
            </div>

          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex w-full justify-end">
            <Button
              onClick={handleSaveCommitment}
              disabled={!canSubmit || isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Committing...</>
              ) : (
                'Lock it in'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 space-y-12 duration-700">
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              Your commitment.
            </h2>
            <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
              <p className="font-heading text-2xl font-medium leading-relaxed text-foreground">
                "{finalCommitment}"
              </p>
            </div>
            <p className="text-lg leading-8 text-muted-foreground pt-4">
              We have recorded this. This is your baseline moving forward.
            </p>
          </div>

          <div className="flex">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="h-12 gap-2 rounded-full px-8 text-base shadow-md"
            >
              {isSubmitting ? 'Finalizing Quest...' : 'Complete Quest 1'}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
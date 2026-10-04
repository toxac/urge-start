'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveCommitment } from '@/actions/commitments';

const HARD_TRUTHS = [
  "I know exactly why I am doing this, and I know where my boundaries are.",
  "I have the necessary leverage to start right now. I will not wait for perfect conditions.",
  "I will not let the fear of looking foolish dictate how I operate.",
  "Rejection is just mechanical data. It does not dictate my worth or my outcome."
];

export function Mission1Action({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [acknowledged, setAcknowledged] = useState<number[]>(
    Array.isArray(saved.acknowledged) ? saved.acknowledged : []
  );
  const [declaration, setDeclaration] = useState(
    typeof saved.declaration === 'string' ? saved.declaration : ''
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAcknowledged = acknowledged.length === HARD_TRUTHS.length;
  const canSubmit = allAcknowledged && declaration.trim().length >= 10;

  const toggleAcknowledgment = (index: number) => {
    if (isCommitted) return;
    setAcknowledged(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  async function handleCompleteMission() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await saveCommitment({
        statement: `Mission 1 Final Declaration: ${declaration.trim()}`,
        source_node_key: nodeKey,
      });
      
      setIsCommitted(true);
      
      // Artificial delay to let the user see the completion screen before unmounting
      setTimeout(async () => {
        await onComplete({ acknowledged, declaration: declaration.trim(), completed: true });
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-12">
      
      {!isCommitted ? (
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {node.title || "Establish your baseline reality."}
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              You cannot proceed to the market until you fully accept these four truths about yourself. Acknowledge them to unlock the final step.
            </p>
          </div>

          <div className="max-w-4xl space-y-4">
            {HARD_TRUTHS.map((truth, idx) => {
              const isChecked = acknowledged.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleAcknowledgment(idx)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-6 text-left transition-all ${
                    isChecked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}>
                    {isChecked && <Check className="h-4 w-4" />}
                  </div>
                  <p className={`text-lg font-medium ${isChecked ? 'text-foreground' : 'text-foreground/80'}`}>
                    {truth}
                  </p>
                </button>
              );
            })}
          </div>

          {allAcknowledged && (
            <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl space-y-8 border-t border-border pt-8 duration-700">
              <div className="space-y-4">
                <label className="text-xl font-medium text-foreground">
                  Make your final declaration.
                </label>
                <p className="text-base text-muted-foreground">
                  In your own words, state that you are done hiding behind preparation and are ready to face the market. 
                </p>
                <Textarea
                  value={declaration}
                  onChange={(e) => setDeclaration(e.target.value)}
                  placeholder="I am ready because..."
                  className="min-h-[120px] resize-none text-lg leading-8"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleCompleteMission} 
                  disabled={!canSubmit || isSubmitting} 
                  className="h-14 gap-2 rounded-full px-10 text-lg"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing...</> : 'Complete Mission 1'}
                  {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95 duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-10 w-10" />
          </div>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
            Preparation Complete.
          </h2>
          <p className="max-w-xl text-xl leading-8 text-muted-foreground">
            You are leaving the safety of your own head. The next mission deals entirely with the market.
          </p>
        </div>
      )}

    </div>
  );
}
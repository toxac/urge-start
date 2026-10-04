'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';

const WARMUP_SCENARIOS = [
  { id: 'discount', title: 'The Coffee Discount', description: 'Next time you buy a coffee or small item, ask for a 10% discount for no reason. When they ask why, just say "I’m just asking."' },
  { id: 'photo', title: 'The Bad Photographer', description: 'Ask a stranger to take a photo of you. When they give it back, look at it and ask them to do it again because "the angle is bad."' },
  { id: 'wrong_store', title: 'The Wrong Store', description: 'Go into a store and earnestly ask if they sell a product you know they absolutely do not sell (e.g., asking for motor oil at a bakery).' }
];

export function LowThresholdAsk({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const [selectedId, setSelectedId] = useState<string | null>(
    typeof saved.selectedId === 'string' ? saved.selectedId : null
  );
  const [step, setStep] = useState<'select' | 'action' | 'reflection' | 'done'>(
    saved.completed ? 'done' : saved.reflection ? 'reflection' : saved.selectedId ? 'action' : 'select'
  );
  const [reflection, setReflection] = useState(
    typeof saved.reflection === 'string' ? saved.reflection : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCard = WARMUP_SCENARIOS.find(s => s.id === selectedId);

  async function handleLockScenario() {
    setStep('action');
  }

  async function handleActionDone() {
    setStep('reflection');
  }

  async function handleSaveReflection() {
    if (reflection.trim().length < 10 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveObservation({
        title: `Warmup Rejection: ${selectedCard?.title}`,
        content: reflection.trim(),
        domain: 'execution',
        focus: 'personal',
        source_node_key: nodeKey,
      });
      setStep('done');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onComplete({ selectedId, reflection: reflection.trim(), completed: true });
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Pick one of these low-stakes scenarios. Your goal is not to succeed. Your goal is to get a "no" or a weird look, and realize the world doesn't end.
        </p>
      </div>

      {step === 'select' && (
        <div className="space-y-8 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {WARMUP_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedId(scenario.id)}
                className={`flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
                  selectedId === scenario.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <h3 className={`font-heading text-xl font-medium ${selectedId === scenario.id ? 'text-foreground' : 'text-foreground/80'}`}>{scenario.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{scenario.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleLockScenario} disabled={!selectedId} className="h-12 rounded-full px-8 text-base">
              I commit to doing this
            </Button>
          </div>
        </div>
      )}

      {step === 'action' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 duration-700">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <h3 className="font-heading text-2xl font-medium">{selectedCard?.title}</h3>
            <p className="pt-2 text-lg leading-8 text-muted-foreground">{selectedCard?.description}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleActionDone} className="h-12 gap-2 rounded-full px-8 text-base">
              <Check className="h-5 w-5" /> I got my "No"
            </Button>
          </div>
        </div>
      )}

      {step === 'reflection' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-6 duration-700">
          <label className="text-lg font-medium text-foreground">
            You survived. How did the actual "no" feel compared to the anxiety of asking?
          </label>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="It felt..."
            className="min-h-[160px] resize-none text-lg leading-8"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveReflection} disabled={reflection.trim().length < 10 || isSubmitting} className="h-12 rounded-full px-8 text-base">
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : 'Lock in reflection'}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 border-t border-border pt-8 duration-700">
          <p className="text-xl leading-8 text-foreground italic font-medium">"{reflection}"</p>
          <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
            Continue <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
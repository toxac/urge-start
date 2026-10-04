'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { M1_QUEST1_CONSTANTS } from '@/lib/constants/mission1-constants';
import { updateUserProgramContext } from '@/actions/user-context';
import { saveObservation } from '@/actions/observations';

export function QuitConditionExplorer({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};
  const options = M1_QUEST1_CONSTANTS.quitConditions.options;

  const [selectedId, setSelectedId] = useState<string | null>(
    typeof saved.selectedId === 'string' ? saved.selectedId : null
  );
  
  const [elaboration, setElaboration] = useState(
    typeof saved.elaboration === 'string' ? saved.elaboration : ''
  );
  
  const [showAcknowledgment, setShowAcknowledgment] = useState(
    saved.completed === true
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = options.find((opt) => opt.id === selectedId);
  const canSubmitElaboration = elaboration.trim().length >= 10;

  async function handleSaveElaboration() {
    if (!selectedCard || !canSubmitElaboration || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserProgramContext({
        quit_conditions: {
          selected_id: selectedCard.id,
          title: selectedCard.title,
          elaboration: elaboration.trim()
        }
      });

      await saveObservation({
        title: `Quit Condition: ${selectedCard.title}`,
        content: elaboration.trim(),
        domain: 'problem',
        focus: 'personal',
        source_node_key: nodeKey,
      });

      setShowAcknowledgment(true);
    } catch (err: any) {
      console.error('[QUIT CONDITIONS]', err);
      setError('Something went wrong saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    await onComplete({
      selectedId,
      elaboration: elaboration.trim(),
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        {!selectedId && (
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            We're not asking what <em>should</em> make you quit. We're asking what actually might. Be honest about where your boundaries are.
          </p>
        )}
      </div>

      <div className={`grid gap-4 transition-all duration-500 ${selectedId ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          if (selectedId && !isSelected) return null;

          return (
            <button
              key={option.id}
              onClick={() => !showAcknowledgment && setSelectedId(option.id)}
              disabled={showAcknowledgment}
              className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              } ${showAcknowledgment ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex w-full items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className={`font-heading text-xl font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                    {option.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                
                {!showAcknowledgment && (
                  <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 duration-700">
          
          {!showAcknowledgment ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-lg font-medium text-foreground">
                  Is there anything more specific that would make you walk away?
                </label>
                <Textarea
                  value={elaboration}
                  onChange={(e) => setElaboration(e.target.value)}
                  placeholder="The thing most likely to make me stop is..."
                  className="min-h-[160px] resize-none text-lg leading-8"
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveElaboration}
                  disabled={!canSubmitElaboration || isSubmitting}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : "Lock this in"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setSelectedId(null); setElaboration(''); }}
                  disabled={isSubmitting}
                  className="h-12 rounded-full px-6 text-muted-foreground"
                >
                  Choose a different boundary
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 border-t border-border pt-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  The reality
                </div>
                <p className="text-xl leading-8 text-foreground">
                  {selectedCard?.response}
                </p>
              </div>

              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? 'Moving forward...' : 'Continue'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeSituation } from '@/actions/responses/mission1';
import type { ProgramComponentProps } from '@/lib/program/componentRegistry';

export function SituationExplorer({ progress, onComplete, nodeKey }: ProgramComponentProps) {
  const saved = progress.payload ?? {};
  
  // Phase 1: Input
  const [situation, setSituation] = useState(typeof saved.situation === 'string' ? saved.situation : '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Phase 2: Acknowledgment & Transition
  const [acknowledgment, setAcknowledgment] = useState<string | null>(
    typeof saved.acknowledgment === 'string' ? saved.acknowledgment : null
  );

  const canAnalyze = situation.trim().length >= 10;

  async function handleAnalyze() {
    if (!canAnalyze || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeSituation(situation.trim(), nodeKey);
      setAcknowledgment(result.acknowledgment);
    } catch (err: any) {
      console.error('[SITUATION EXPLORER]', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleComplete() {
    await onComplete({
      situation: situation.trim(),
      acknowledgment,
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10">
      
      {/* ------------------------------------------------ */}
      {/* PHASE 1: THE INPUT                               */}
      {/* ------------------------------------------------ */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          <MapPin className="h-4 w-4" />
          Start here
        </div>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Where are you right now?
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          There is no right starting point. Maybe you already have an idea. Maybe you just know you want to build something. Tell us what brought you here.
        </p>

        <div className="max-w-3xl space-y-4">
          <Textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="I've been thinking about starting something because..."
            className="min-h-[160px] resize-none text-lg leading-8"
            disabled={isAnalyzing || acknowledgment !== null}
          />
          <p className="text-sm leading-6 text-muted-foreground">
            Write it the way you would explain it to a friend.
          </p>
        </div>

        {!acknowledgment && (
          <div className="flex max-w-3xl justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Understanding...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {error && (
          <p className="max-w-3xl text-sm leading-6 text-destructive">{error}</p>
        )}
      </div>

      {/* ------------------------------------------------ */}
      {/* PHASE 2: AI ACKNOWLEDGMENT & TRANSITION          */}
      {/* ------------------------------------------------ */}
      {acknowledgment && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 border-t border-border pt-10 duration-700">
          
          <div className="space-y-4">
            <p className="text-xl leading-8 text-foreground">
              {acknowledgment}
            </p>
            <p className="text-lg leading-8 text-muted-foreground">
              If you've been thinking about this for a while, it brings us to the real question of this mission:
            </p>
            <p className="font-heading text-2xl font-semibold text-foreground">
              Why haven't you started yet?
            </p>
          </div>

          <div className="flex">
            <Button
              onClick={handleComplete}
              className="h-12 gap-2 rounded-full px-8 text-base"
            >
              Let's find out
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
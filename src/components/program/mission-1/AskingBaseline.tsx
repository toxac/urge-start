'use client';

import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const HESITATIONS = [
  'What I have is not good enough yet.',
  'I do not want to bother someone.',
  'I do not want to look foolish.',
  'I should have something to offer first.',
  'They will probably say no.',
];

export function AskingBaseline({
  onComplete,
}: NodeComponentProps) {
  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-16">
      <div className="max-w-3xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          MAKE THE ASK
        </p>

        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Asking sounds simple. It often isn't.
        </h1>

        <p className="text-xl leading-relaxed text-muted-foreground">
          When you are starting something, asking another person for help,
          advice, feedback, an introduction, or an opportunity can feel
          surprisingly difficult.
        </p>
      </div>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg font-medium text-foreground">
          You might find yourself thinking:
        </p>

        <div className="space-y-3">
          {HESITATIONS.map((hesitation) => (
            <div
              key={hesitation}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <p className="text-base leading-7 text-foreground">
                “{hesitation}”
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl space-y-5 border-l-2 border-primary/30 pl-6">
        <p className="text-lg leading-8 text-foreground">
          Any of these can quietly keep you working alone for much longer
          than you need to.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          But we are not going to spend this quest thinking about whether
          you are comfortable asking.
        </p>

        <p className="text-xl font-medium leading-8 text-foreground">
          You are going to find out what happens when you actually do it.
        </p>
      </div>

      <div className="flex max-w-3xl justify-end">
        <Button
          onClick={() => onComplete({ completed: true })}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          Let's find out
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
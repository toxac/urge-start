'use client';

import { ArrowRight, Check, Eye, Hand, Search, ShieldCheck } from 'lucide-react';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { Button } from '@/components/ui/button';

type RevealPayload = {
  completed: boolean;
};

const JOURNEY = [
  {
    number: '01',
    icon: Eye,
    title: 'Look inward',
    text: 'You named what has been holding you back and what makes you want to begin.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Look around',
    text: 'You took stock of the skills, experience, resources, and people you can already draw on.',
  },
  {
    number: '03',
    icon: Hand,
    title: 'Ask and find out',
    text: 'You moved beyond guessing and took a real step to find out how someone might respond.',
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Face the fear',
    text: 'You practised asking, making room for a no, and learning from what actually happened.',
  },
];

export function Mission1Reveal({ progress, onComplete }: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as Partial<RevealPayload>;
  const isComplete = saved.completed === true || progress.completed === true;

  function handleContinue() {
    const payload: RevealPayload = { completed: true };
    onComplete(payload);
  }

  return (
    <div className="w-full max-w-5xl space-y-14">
      <section className="max-w-3xl space-y-5">
        <h2 className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
          You moved.
        </h2>
        <p className="max-w-2xl text-xl leading-9 text-muted-foreground">
          You did not have to solve everything before taking a step. You looked honestly at where you were, noticed what you already had, and started finding things out.
        </p>
      </section>

      <section className="space-y-7">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Look back
          </p>
          <h3 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Four things you practised.
          </h3>
          <p className="text-lg leading-8 text-muted-foreground">
            This was not about becoming fearless or having all the answers. It was about practising a different way to begin.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {JOURNEY.map(({ number, icon: Icon, title, text }) => (
            <div key={number} className="rounded-3xl border border-border bg-card p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">
                  {number}
                </span>
              </div>
              <h4 className="mt-6 text-xl font-semibold">{title}</h4>
              <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border py-10 sm:py-12">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Keep this with you
          </p>
          <h3 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            A few things worth remembering.
          </h3>
          <ul className="space-y-4">
            <RememberItem> You do not need every answer before you begin.</RememberItem>
            <RememberItem> You are probably not starting from zero. Look for the skills, experience, resources, and people already within reach.</RememberItem>
            <RememberItem> An assumption becomes clearer when you test it in the real world.</RememberItem>
            <RememberItem> A response — including a no — is something to learn from, not a verdict on your worth.</RememberItem>
          </ul>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleContinue} className="h-12 shrink-0 gap-2 rounded-full px-7 text-base">
          {isComplete ? 'Continue to Mission 2' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}

function RememberItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-lg leading-7">
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </li>
  );
}

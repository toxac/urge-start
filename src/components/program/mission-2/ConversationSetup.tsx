'use client';

import { ArrowRight, Ear, MessageCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function ConversationSetup({ node, onComplete }: NodeComponentProps) {
  return (
    <div className="w-full space-y-8 pb-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Ear,
            title: 'Listen, don’t sell',
            body: 'Understand their experience instead of convincing them your idea is good.',
          },
          {
            icon: MessageCircle,
            title: 'Ask about real life',
            body: 'Ask about the last time it happened, not what they might do in theory.',
          },
          {
            icon: Lightbulb,
            title: 'Stay curious',
            body: 'Surprises and contradictions are useful. You do not need to prove your guess right.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="space-y-3 rounded-2xl border bg-card p-5">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl rounded-xl bg-muted/50 p-5">
        <h2 className="font-semibold">A few useful prompts</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Can you tell me about the last time this happened?</li>
          <li>How did you handle it?</li>
          <li>What was the hardest part?</li>
          <li>What have you already tried?</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          These are prompts, not a questionnaire. You can take notes here or do the
          conversation offline.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onComplete({ completed: true })} className="rounded-full">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
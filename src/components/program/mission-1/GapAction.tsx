
'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Loader2,
  PackageOpen,
  Users,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const ACTION_PATHWAYS = [
  {
    id: 'capabilities',
    number: '01',
    title: 'Put your capabilities to the test',
    description:
      'You already have skills and abilities. The next step is to use them in real situations and learn what they can do.',
    icon: Wrench,
    actions: [
      {
        title: 'Solve a real problem',
        detail:
          'Offer to help someone with a problem you know how to tackle. Start small and see what difference you can make.',
      },
      {
        title: 'Use a skill in a new situation',
        detail:
          'Take something you already know how to do and apply it somewhere unfamiliar. You may discover a new use for it.',
      },
      {
        title: 'Ask for feedback',
        detail:
          'After helping someone, ask what worked, what could be better, and whether they would want your help again.',
      },
      {
        title: 'Practise something you want to improve',
        detail:
          'Choose one skill and find a real opportunity to use it. You do not need to feel like an expert before you begin.',
      },
    ],
  },
  {
    id: 'network',
    number: '02',
    title: 'Show up and get involved',
    description:
      'The people and communities around you can open doors, share knowledge, and help you discover opportunities. But connections become useful when you take part.',
    icon: Users,
    actions: [
      {
        title: 'Reconnect with someone',
        detail:
          'Reach out to a person you have not spoken to in a while. Start a conversation without needing anything from them.',
      },
      {
        title: 'Contribute to a community',
        detail:
          'Answer a question, share something useful, offer help, or take part in a group you already belong to.',
      },
      {
        title: 'Show up somewhere new',
        detail:
          'Attend a meetup, join a discussion, volunteer, or visit a local group where you could meet people with shared interests.',
      },
      {
        title: 'Tell people what you are exploring',
        detail:
          'Share what you are curious about or trying to figure out. You might find someone with experience, an idea, or a useful connection.',
      },
    ],
  },
  {
    id: 'resources',
    number: '03',
    title: 'Make your resources go further',
    description:
      'Starting something does not mean buying everything or having unlimited time. Experiment with what you have before deciding what else you need.',
    icon: PackageOpen,
    actions: [
      {
        title: 'Make a little time',
        detail:
          'Find a small, realistic block of time to try something. Look at what you could pause, reduce, or rearrange to make room.',
      },
      {
        title: 'Borrow, share, or repurpose',
        detail:
          'Before buying a tool or resource, see whether you can borrow it, share it, use a free alternative, or adapt something you already own.',
      },
      {
        title: 'Ask for access',
        detail:
          'If you need a space, tool, introduction, or piece of information, ask someone who might help you access it.',
      },
      {
        title: 'Try a low-cost version',
        detail:
          'Find the simplest way to test your idea with the resources available today. You can invest more once you know what is useful.',
      },
    ],
  },
  {
    id: 'experience',
    number: '04',
    title: 'Turn your experience into insight',
    description:
      'Things you have seen, experienced, or learned may help you notice problems and opportunities that others overlook.',
    icon: Compass,
    actions: [
      {
        title: 'Look for a problem that keeps coming up',
        detail:
          'Think about a frustration you have faced repeatedly at work, in daily life, or in a community you know well.',
      },
      {
        title: 'Talk to someone facing a similar challenge',
        detail:
          'Ask about their experience and listen to how they handle it. Look for what is difficult, time-consuming, or still unresolved.',
      },
      {
        title: 'Observe a familiar environment',
        detail:
          'Pay attention to how people work, shop, learn, travel, or get things done. Notice workarounds and things people tolerate.',
      },
      {
        title: 'Share what you have learned',
        detail:
          'Talk about a pattern or problem you have noticed and see whether others recognise it too. Their experiences may challenge or strengthen your thinking.',
      },
    ],
  },
] as const;

export function GapAction({ node, onComplete }: NodeComponentProps) {
  const [expanded, setExpanded] = useState<string[]>([
    'capabilities',
    'network',
  ]);
  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePathway(id: string) {
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleContinue() {
    if (isContinuing) return;

    setIsContinuing(true);
    setError(null);

    try {
      await onComplete({ completed: true });
    } catch {
      setError('Something went wrong. Please try continuing again.');
      setIsContinuing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Put what you have to work'}
        </h1>

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}

        <p className="text-base leading-7 text-muted-foreground">
          You have already taken stock of what you know, who you can reach, and
          what you have available. Now, think about how you could put those
          assets to use.
        </p>

        <p className="text-base leading-7">
          These are ideas to help you get moving, not a checklist to finish.
          Explore any of the suggestions that feel useful. Try one, try several,
          or come back to the others later.
        </p>
      </header>

      <div className="space-y-4">
        {ACTION_PATHWAYS.map((pathway) => {
          const Icon = pathway.icon;
          const isExpanded = expanded.includes(pathway.id);

          return (
            <section
              key={pathway.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => togglePathway(pathway.id)}
                aria-expanded={isExpanded}
                aria-controls={`pathway-${pathway.id}`}
                className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-muted/40 sm:p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon
                    className="h-5 w-5 text-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium tracking-widest text-muted-foreground">
                    PATHWAY {pathway.number}
                  </p>

                  <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {pathway.title}
                  </h2>

                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    {pathway.description}
                  </p>
                </div>

                <span
                  className="mt-1 shrink-0 text-xl leading-none text-muted-foreground"
                  aria-hidden="true"
                >
                  {isExpanded ? '−' : '+'}
                </span>
              </button>

              {isExpanded && (
                <div
                  id={`pathway-${pathway.id}`}
                  className="border-t border-border px-5 py-5 sm:px-6"
                >
                  <ul className="space-y-5">
                    {pathway.actions.map((action, index) => (
                      <li key={action.title} className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>

                        <div className="space-y-1">
                          <h3 className="font-medium">{action.title}</h3>
                          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                            {action.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          You don't have to do everything today.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          The point is to start using what you already have. A small action can
          teach you more than a long list of things you think you need. Stay
          curious, try things in the real world, and learn as you go.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-5">
        <Button onClick={handleContinue} disabled={isContinuing}>
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default GapAction;

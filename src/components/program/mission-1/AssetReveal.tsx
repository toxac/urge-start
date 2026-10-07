'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Check, Pencil, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';

type ResourceEntry = {
  id: string;
  type: 'time' | 'money' | 'energy' | 'access' | 'credibility';
  title: string;
  detail: string;
};

type ResourcesContext = {
  items: ResourceEntry[];
};

type NetworkUse =
  | 'ask'
  | 'feedback'
  | 'find'
  | 'test'
  | 'tell'
  | 'learn'
  | 'introduction';

type NetworkEntry = {
  id: string;
  type: 'people' | 'group' | 'professional' | 'online' | 'place';
  name: string;
  access: string;
  possibleUses: NetworkUse[];
};

type CapabilityEntry = {
  id: string;
  title: string;
  evidence: string;
};

type CapabilitiesContext = {
  items: CapabilityEntry[];
};

type ExperienceEntry = {
  id: string;
  title: string;
  evidence: string;
};

type ExperienceContext = {
  items: ExperienceEntry[];
};

type GapType =
  | 'learn'
  | 'reach'
  | 'acquire'
  | 'time'
  | 'not_needed'
  | 'uncertain';

type GapEntry = {
  id: string;
  title: string;
  type: GapType;
  detail: string;
};

type AssetRevealPayload = {
  gaps: GapEntry[];
  confirmed: boolean;
};

const GAP_OPTIONS: Array<{
  type: GapType;
  title: string;
  description: string;
}> = [
  {
    type: 'learn',
    title: 'Something I need to learn',
    description: 'There is something I genuinely need to understand or learn enough to begin.',
  },
  {
    type: 'reach',
    title: 'Someone I need to reach',
    description: 'There is a person, group, or kind of person I need to get access to.',
  },
  {
    type: 'acquire',
    title: 'Something I need to acquire or access',
    description: 'There is something I need to obtain, borrow, share, or find access to.',
  },
  {
    type: 'time',
    title: 'I need more time for this',
    description: 'The real constraint is making enough time or space to move.',
  },
  {
    type: 'not_needed',
    title: 'I don’t actually need this yet',
    description: 'I may have thought I needed this, but looking at the whole picture, I can leave it alone for now.',
  },
  {
    type: 'uncertain',
    title: 'I’m not sure',
    description: 'I suspect there is a gap, but I need to find out whether it really matters.',
  },
];

const NETWORK_USE_LABELS: Record<NetworkUse, string> = {
  ask: 'Ask someone',
  feedback: 'Get feedback',
  find: 'Find someone',
  test: 'Test something',
  tell: 'Tell people',
  learn: 'Learn',
  introduction: 'Get introduced',
};

function getContextItems<T>(
  value: unknown,
  key: 'items'
): T[] {
  if (!value || typeof value !== 'object') return [];

  const items = (value as Record<string, unknown>)[key];

  return Array.isArray(items) ? (items as T[]) : [];
}

export function AssetReveal({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const { userContext } = useStore($userContext);

  const saved = progress.payload ?? {};

  const resources = getContextItems<ResourceEntry>(
    userContext?.resources,
    'items'
  );

  const networks = Array.isArray(userContext?.network_context)
    ? (userContext.network_context as NetworkEntry[])
    : [];

  const capabilities = getContextItems<CapabilityEntry>(
    userContext?.capabilities,
    'items'
  );

  const experiences = getContextItems<ExperienceEntry>(
    userContext?.experience,
    'items'
  );

  const savedPayload =
    saved &&
    typeof saved === 'object' &&
    Array.isArray((saved as AssetRevealPayload).gaps)
      ? (saved as AssetRevealPayload)
      : null;

  const [gaps, setGaps] = useState<GapEntry[]>(
    savedPayload?.gaps ?? []
  );

  const [isCommitted, setIsCommitted] = useState(
    savedPayload?.confirmed === true || progress.completed === true
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasStartingKit =
    resources.length > 0 ||
    networks.length > 0 ||
    capabilities.length > 0 ||
    experiences.length > 0;

  const toggleGap = (type: GapType) => {
    if (isCommitted && !isEditing) return;

    setGaps((current) => {
      const existing = current.find((gap) => gap.type === type);

      if (existing) {
        return current.filter((gap) => gap.type !== type);
      }

      const option = GAP_OPTIONS.find((gap) => gap.type === type);

      if (!option) return current;

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          type,
          title: option.title,
          detail: '',
        },
      ];
    });
  };

  const updateGapDetail = (type: GapType, detail: string) => {
    setGaps((current) =>
      current.map((gap) =>
        gap.type === type
          ? { ...gap, detail }
          : gap
      )
    );
  };

  const selectedGap = (type: GapType) =>
    gaps.find((gap) => gap.type === type);

  const canContinue =
    gaps.length === 0 ||
    gaps.every((gap) => gap.detail.trim().length >= 10);

  async function handleComplete() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        gaps,
        confirmed: true,
        completed: true,
      });

      setIsCommitted(true);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setIsCommitted(false);
  }

  return (
    <div className="w-full space-y-12">
      {/* Introduction */}
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'You are not starting from zero.'}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You&apos;ve just taken stock of what is already around you. Now let&apos;s
          put it together and see what you&apos;re actually starting with.
        </p>
      </div>

      {/* Starting kit */}
      <div className="max-w-5xl space-y-8">
        <div className="space-y-3">
          <h3 className="text-2xl font-medium">What you have</h3>

          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            This is what you are bringing with you. Nothing here is being
            scored or judged.
          </p>
        </div>

        {!hasStartingKit ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-lg leading-8 text-muted-foreground">
              You haven&apos;t identified much yet. That&apos;s okay. You can still
              begin by finding out what you genuinely need.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resources */}
            {resources.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-heading text-xl font-medium">
                  Resources
                </h4>

                <div className="mt-5 space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="space-y-1">
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {resource.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Network */}
            {networks.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-heading text-xl font-medium">
                  People &amp; places within reach
                </h4>

                <div className="mt-5 space-y-5">
                  {networks.map((network) => (
                    <div key={network.id} className="space-y-2">
                      <p className="font-medium">{network.name}</p>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {network.access}
                      </p>

                      {Array.isArray(network.possibleUses) &&
                        network.possibleUses.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {network.possibleUses.map((use) => (
                              <span
                                key={use}
                                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                              >
                                {NETWORK_USE_LABELS[use] ?? use}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Capabilities */}
            {capabilities.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-heading text-xl font-medium">
                  Things you can do
                </h4>

                <div className="mt-5 space-y-5">
                  {capabilities.map((capability) => (
                    <div key={capability.id} className="space-y-2">
                      <p className="font-medium">{capability.title}</p>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {capability.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-heading text-xl font-medium">
                  Things you&apos;ve lived through
                </h4>

                <div className="mt-5 space-y-5">
                  {experiences.map((experience) => (
                    <div key={experience.id} className="space-y-2">
                      <p className="font-medium">{experience.title}</p>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {experience.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Interpretation / bridge */}
      <div className="max-w-3xl space-y-5">
        <h3 className="text-2xl font-medium">
          You don&apos;t need all of this to start.
        </h3>

        <p className="text-lg leading-8 text-muted-foreground">
          You also don&apos;t need to become an expert before you begin. Some
          things you will learn by doing them.
        </p>

        <p className="text-lg leading-8 text-muted-foreground">
          The question now is not whether you have everything. It&apos;s whether
          there is anything genuinely missing that is worth doing something
          about.
        </p>
      </div>

      {/* Gap discovery */}
      <div className="max-w-5xl space-y-8">
        <div className="space-y-3">
          <h3 className="text-2xl font-medium">
            What is actually missing?
          </h3>

          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Looking at everything above, choose anything that you genuinely
            think needs attention. You do not need to find a gap just because
            one might exist.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAP_OPTIONS.map((option) => {
            const selected = Boolean(selectedGap(option.type));

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => toggleGap(option.type)}
                disabled={isSubmitting}
                className={`rounded-2xl border p-6 text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="font-heading text-xl font-medium">
                      {option.title}
                    </h4>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {gaps.length > 0 && (
          <div className="max-w-4xl space-y-6">
            {gaps.map((gap) => {
              const option = GAP_OPTIONS.find(
                (item) => item.type === gap.type
              );

              if (!option) return null;

              return (
                <div
                  key={gap.id}
                  className="space-y-4 rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    <div>
                      <h4 className="font-heading text-xl font-medium">
                        {option.title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <Textarea
                    value={gap.detail}
                    onChange={(event) =>
                      updateGapDetail(gap.type, event.target.value)
                    }
                    placeholder="What is actually missing?"
                    className="min-h-[120px] resize-none text-base leading-7"
                    disabled={isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        )}

        {gaps.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-base leading-7 text-muted-foreground">
              It&apos;s okay if you don&apos;t see anything missing right now.
              Sometimes the useful conclusion is simply: <strong>I have
              enough to begin.</strong>
            </p>
          </div>
        )}
      </div>

      {/* Completion */}
      <div className="max-w-4xl border-t border-border pt-8">
        {isCommitted && !isEditing ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-medium">
                You&apos;ve got a clearer picture of where you&apos;re starting.
              </h3>

              {gaps.length > 0 ? (
                <p className="text-base leading-7 text-muted-foreground">
                  You&apos;ve identified what you think is genuinely worth
                  attention. You&apos;ll decide what to do about it next.
                </p>
              ) : (
                <p className="text-base leading-7 text-muted-foreground">
                  You&apos;ve decided there is nothing you need to solve before
                  getting started.
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-6 text-base"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>

              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? 'Moving forward...' : 'Continue'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!canContinue || isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
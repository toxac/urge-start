'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { userContextActions, $userContext } from '@/lib/stores/user-context';

type CapabilityEntry = {
  id: string;
  title: string;
  evidence: string;
};

type CapabilitiesContext = {
  items: CapabilityEntry[];
};

const CAPABILITIES = [
  {
    id: 'make_clear',
    title: 'Make confusing things clear',
    description:
      'Turn something messy or complicated into something people can understand.',
  },
  {
    id: 'organise',
    title: 'Organise people or things',
    description:
      'Bring order to moving parts and help things happen in the right order.',
  },
  {
    id: 'find_information',
    title: 'Find information',
    description:
      'Track down useful information, answers, or resources when you need them.',
  },
  {
    id: 'fix_things',
    title: 'Fix things when they break',
    description:
      'Figure out what went wrong and find a way to make it work again.',
  },
  {
    id: 'spot_problems',
    title: 'Spot problems',
    description:
      'Notice something that is not working, missing, or likely to become a problem.',
  },
  {
    id: 'find_workarounds',
    title: 'Find workarounds',
    description:
      'Keep moving when the obvious solution is unavailable.',
  },
  {
    id: 'explain',
    title: 'Explain difficult things',
    description:
      'Help someone understand something that was difficult or unfamiliar.',
  },
  {
    id: 'get_agreement',
    title: 'Get people to agree',
    description:
      'Bring different people around to an idea or a way forward.',
  },
  {
    id: 'build_things',
    title: 'Build things',
    description:
      'Turn an idea, plan, or problem into something real.',
  },
  {
    id: 'teach_self',
    title: 'Teach yourself new things',
    description:
      'Figure out how to learn something you did not already know.',
  },
  {
    id: 'connect_people',
    title: 'Connect people',
    description:
      'Know who might be useful to whom and help make the connection.',
  },
  {
    id: 'simplify',
    title: 'Make things simpler',
    description:
      'Remove unnecessary complexity and find an easier way to do something.',
  },
];

function getSavedCapabilities(
  progress: NodeComponentProps['progress']
): CapabilityEntry[] {
  const context = $userContext.get().userContext?.capabilities as
    | CapabilitiesContext
    | null
    | undefined;

  if (context && Array.isArray(context.items)) {
    return context.items;
  }

  const saved = progress.payload?.capabilities;

  if (
    saved &&
    typeof saved === 'object' &&
    Array.isArray((saved as CapabilitiesContext).items)
  ) {
    return (saved as CapabilitiesContext).items;
  }

  return [];
}

export function CapabilityInventory({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const savedCapabilities = getSavedCapabilities(progress);

  const [items, setItems] =
    useState<CapabilityEntry[]>(savedCapabilities);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedCapabilities.map((item) => item.id)
  );

  const [isCommitted, setIsCommitted] = useState(
    savedCapabilities.length > 0 || progress.payload?.completed === true
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    if (isCommitted && !isEditing) return;

    setSelectedIds((current) => {
      if (current.includes(id)) {
        setItems((existing) =>
          existing.filter((item) => item.id !== id)
        );

        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const getCapability = (id: string) =>
    CAPABILITIES.find((capability) => capability.id === id);

  const getEvidence = (id: string) =>
    items.find((item) => item.id === id)?.evidence ?? '';

  const updateEvidence = (id: string, evidence: string) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      const capability = getCapability(id);

      if (!capability) return current;

      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, evidence } : item
        );
      }

      return [
        ...current,
        {
          id,
          title: capability.title,
          evidence,
        },
      ];
    });
  };

  const validItems = selectedIds
    .map((id) => {
      const capability = getCapability(id);
      const evidence = getEvidence(id).trim();

      if (!capability || evidence.length < 10) return null;

      return {
        id: capability.id,
        title: capability.title,
        evidence,
      };
    })
    .filter((item): item is CapabilityEntry => item !== null);

  const canSave =
    selectedIds.length > 0 &&
    selectedIds.every(
      (id) => getEvidence(id).trim().length >= 10
    );

  async function handleSave() {
    if (!canSave || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const capabilities: CapabilitiesContext = {
        items: validItems,
      };

      const result = await updateUserProgramContext({
        capabilities,
      });

      userContextActions.updateContextLocally(result.userContext);

      setItems(validItems);
      setSelectedIds(validItems.map((item) => item.id));
      setIsCommitted(true);
      setIsEditing(false);
    } catch (err) {
      console.error('[CAPABILITY INVENTORY]', err);
      setError(
        'Something went wrong saving your response. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        capabilities: {
          items,
        },
        completed: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
    setIsCommitted(false);
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What can you already do?'}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          You may not think of yourself as particularly skilled at
          business yet. That&apos;s okay. Think about the things
          people already rely on you to do — at work, at home, in
          your community, or just because you&apos;re the person who
          figures things out.
        </p>
      </div>

      {isCommitted && !isEditing ? (
        <div className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">
              These are things you already know how to do.
            </h3>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-heading text-xl font-medium">
                        {item.title}
                      </h4>

                      <p className="text-base leading-7 text-muted-foreground">
                        {item.evidence}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You don&apos;t need to turn these into a business right
            now. Just notice that you are bringing abilities with
            you. You are not starting from zero.
          </p>

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
        <>
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-xl font-medium">
                What do people already rely on you to do?
              </h3>

              {selectedIds.length > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedIds.length}{' '}
                  {selectedIds.length === 1
                    ? 'capability'
                    : 'capabilities'}{' '}
                  selected
                </span>
              )}
            </div>

            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Choose every one that genuinely fits. There is no
              limit. If they all fit, choose them all. For each one,
              you&apos;ll give us a real example.
            </p>
          </div>

          <div className="grid max-w-5xl gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((option) => {
              const isSelected = selectedIds.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSelection(option.id)}
                  disabled={isSubmitting}
                  className={`group relative flex items-start rounded-2xl border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-heading text-xl font-medium">
                        {option.title}
                      </h4>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <div className="max-w-4xl space-y-8">
              <div className="space-y-3">
                <h3 className="text-xl font-medium">
                  Now give us the evidence.
                </h3>

                <p className="text-base leading-7 text-muted-foreground">
                  For each one you selected, tell us about a real
                  situation where you did this.
                </p>
              </div>

              <div className="space-y-8">
                {selectedIds.map((id) => {
                  const capability = getCapability(id);

                  if (!capability) return null;

                  return (
                    <div
                      key={id}
                      className="space-y-4 rounded-2xl border border-border bg-card p-6"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>

                        <div>
                          <h4 className="font-heading text-xl font-medium">
                            {capability.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {capability.description}
                          </p>
                        </div>
                      </div>

                      <Textarea
                        value={getEvidence(id)}
                        onChange={(event) =>
                          updateEvidence(id, event.target.value)
                        }
                        placeholder="For example: My team often gives me messy problems because I’m good at breaking them down..."
                        className="min-h-[140px] resize-none text-base leading-7"
                        disabled={isSubmitting}
                      />
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  disabled={!canSave || isSubmitting}
                  className="h-12 rounded-full px-8 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save this'
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
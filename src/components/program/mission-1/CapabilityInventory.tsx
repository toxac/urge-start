
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  PlusCircle,
  X,
} from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';

type CapabilityOption = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

type CapabilityEntry = {
  id: string;
  title: string;
  evidence: string;
};

type CapabilitiesContext = {
  items?: CapabilityEntry[];
};

const CAPABILITIES: CapabilityOption[] = [
  {
    id: 'make_clear',
    title: 'Make confusing things clear',
    description:
      'Turn something messy or complicated into something people can understand.',
    reflectionPrompt:
      'Think of a time you made something confusing easier to understand. What was happening, and what did you do?',
    placeholder:
      'Someone was struggling to understand..., so I...',
  },
  {
    id: 'organise',
    title: 'Organise people or things',
    description:
      'Bring order to moving parts and help things happen in the right order.',
    reflectionPrompt:
      'When have you brought order to something that felt disorganised? What did you do?',
    placeholder:
      'When things got disorganised, I...',
  },
  {
    id: 'find_information',
    title: 'Find information',
    description:
      'Track down useful information, answers, or resources when you need them.',
    reflectionPrompt:
      'Think of a time you tracked down information or found an answer others needed. How did you do it?',
    placeholder:
      'I needed to find out..., so I...',
  },
  {
    id: 'fix_things',
    title: 'Fix things when they break',
    description:
      'Figure out what went wrong and find a way to make it work again.',
    reflectionPrompt:
      'Tell us about a time something went wrong and you helped fix it. What happened?',
    placeholder:
      'When this stopped working..., I...',
  },
  {
    id: 'spot_problems',
    title: 'Spot problems',
    description:
      'Notice something that is not working, missing, or likely to become a problem.',
    reflectionPrompt:
      'Think of a time you noticed a problem that others had missed. What did you notice?',
    placeholder:
      'I noticed that..., and I...',
  },
  {
    id: 'find_workarounds',
    title: 'Find workarounds',
    description:
      'Keep moving when the obvious solution is unavailable.',
    reflectionPrompt:
      'When have you found another way forward because the usual approach was not possible?',
    placeholder:
      'I could not do it the usual way, so I...',
  },
  {
    id: 'explain',
    title: 'Explain difficult things',
    description:
      'Help someone understand something that was difficult or unfamiliar.',
    reflectionPrompt:
      'Tell us about a time you helped someone understand something difficult. How did you explain it?',
    placeholder:
      'Someone was trying to understand..., so I...',
  },
  {
    id: 'get_agreement',
    title: 'Get people to agree',
    description:
      'Bring different people around to an idea or a way forward.',
    reflectionPrompt:
      'Think of a time you helped people with different views find a way forward. What did you do?',
    placeholder:
      'People disagreed about..., and I...',
  },
  {
    id: 'build_things',
    title: 'Build things',
    description:
      'Turn an idea, plan, or problem into something real.',
    reflectionPrompt:
      'Tell us about something you helped create or bring to life. What was your part in it?',
    placeholder:
      'I wanted to make..., so I...',
  },
  {
    id: 'teach_self',
    title: 'Teach yourself new things',
    description:
      'Figure out how to learn something you did not already know.',
    reflectionPrompt:
      'Think of something you learned on your own because you needed to. How did you learn it?',
    placeholder:
      'I needed to learn..., so I...',
  },
  {
    id: 'connect_people',
    title: 'Connect people',
    description:
      'Know who might be useful to whom and help make the connection.',
    reflectionPrompt:
      'Tell us about a time you connected people who could help each other. What made you bring them together?',
    placeholder:
      'I knew that... could help..., so I...',
  },
  {
    id: 'simplify',
    title: 'Make things simpler',
    description:
      'Remove unnecessary complexity and find an easier way to do something.',
    reflectionPrompt:
      'Think of a time you made a task or process simpler. What was difficult before, and what did you change?',
    placeholder:
      'The old way of doing this was..., so I...',
  },
];

function getSavedCapabilities(
  progress: NodeComponentProps['progress'],
): CapabilityEntry[] {
  const saved = progress.payload?.capabilities;

  if (
    saved &&
    typeof saved === 'object' &&
    Array.isArray((saved as CapabilitiesContext).items)
  ) {
    return (saved as CapabilitiesContext).items ?? [];
  }

  return [];
}

export function CapabilityInventory({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const hasInitialized = useRef(false);

  const savedContext = contextState.userContext?.capabilities as
    | CapabilitiesContext
    | null
    | undefined;

  const progressPayload = progress.payload ?? {};

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});

  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOption = CAPABILITIES.find(
    (option) => option.id === activeOptionId,
  );

  const selectedOptions = useMemo(
    () =>
      CAPABILITIES.filter((option) =>
        selectedIds.includes(option.id),
      ),
    [selectedIds],
  );

  const canSave = draft.trim().length >= 10;

  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextItems = savedContext?.items;
    const progressItems = getSavedCapabilities(progress);

    const initialItems = Array.isArray(contextItems)
      ? contextItems
      : progressItems;

    setSelectedIds(initialItems.map((item) => item.id));

    setEvidence(
      Object.fromEntries(
        initialItems.map((item) => [item.id, item.evidence]),
      ),
    );

    hasInitialized.current = true;
  }, [
    contextState.isHydrated,
    savedContext,
    progressPayload,
  ]);

  useEffect(() => {
    if (!activeOptionId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        setActiveOptionId(null);
        setError(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOptionId, isSaving]);

  function openReflection(option: CapabilityOption) {
    setError(null);
    setDraft(evidence[option.id] ?? '');
    setActiveOptionId(option.id);
  }

  function closeReflection() {
    if (isSaving) return;

    setActiveOptionId(null);
    setError(null);
  }

  function buildCapabilities(
    ids: string[],
    values: Record<string, string>,
  ): CapabilityEntry[] {
    return CAPABILITIES
      .filter((option) => ids.includes(option.id))
      .map((option) => ({
        id: option.id,
        title: option.title,
        evidence: (values[option.id] ?? '').trim(),
      }));
  }

  async function persistCapabilities(
    ids: string[],
    values: Record<string, string>,
  ) {
    const capabilities: CapabilitiesContext = {
      items: buildCapabilities(ids, values),
    };

    const result = await updateUserProgramContext({
      capabilities,
    });

    userContextActions.updateContextLocally(result.userContext);

    return capabilities.items ?? [];
  }

  async function saveReflection() {
    if (!activeOption || !canSave || isSaving) return;

    setIsSaving(true);
    setError(null);

    const nextIds = selectedIds.includes(activeOption.id)
      ? selectedIds
      : [...selectedIds, activeOption.id];

    const nextEvidence = {
      ...evidence,
      [activeOption.id]: draft.trim(),
    };

    try {
      await persistCapabilities(nextIds, nextEvidence);

      setSelectedIds(nextIds);
      setEvidence(nextEvidence);
      setActiveOptionId(null);
    } catch (err) {
      console.error('[CAPABILITY INVENTORY SAVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCapability(id: string) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextIds = selectedIds.filter((item) => item !== id);
    const nextEvidence = { ...evidence };
    delete nextEvidence[id];

    setIsRemoving(id);
    setError(null);

    try {
      await persistCapabilities(nextIds, nextEvidence);

      setSelectedIds(nextIds);
      setEvidence(nextEvidence);
    } catch (err) {
      console.error('[CAPABILITY INVENTORY REMOVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong removing this response.',
      );
    } finally {
      setIsRemoving(null);
    }
  }

  async function handleContinue() {
    if (
      selectedIds.length === 0 ||
      isCompleting ||
      isSaving ||
      isRemoving
    ) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    const capabilities = buildCapabilities(selectedIds, evidence);

    try {
      await persistCapabilities(selectedIds, evidence);

      await onComplete({
        capabilities: {
          items: capabilities,
        },
        completed: true,
      });
    } catch (err) {
      console.error('[CAPABILITY INVENTORY COMPLETE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      <div className="max-w-3xl space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          You may not think of yourself as particularly skilled at
          business yet. That&apos;s okay. Think about the things people
          already rely on you to do — at work, at home, in your
          community, or just because you&apos;re the person who figures
          things out.
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Choose the statements that feel familiar. When you select one,
          you&apos;ll reflect on a real example from your own experience.
          You can edit or remove your responses at any time.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {CAPABILITIES.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const reflection = evidence[option.id] ?? '';
          const isRemovingThis = isRemoving === option.id;

          return (
            <div
              key={option.id}
              className={`relative self-start rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => openReflection(option)}
                disabled={
                  isSaving || Boolean(isRemoving) || isCompleting
                }
                aria-label={
                  isSelected
                    ? `Edit evidence: ${option.title}`
                    : `Reflect on: ${option.title}`
                }
                className="flex w-full flex-col items-start p-4 text-left sm:p-5"
              >
                <div className="flex w-full items-start gap-3">
                  <h3 className="font-heading text-xl font-medium leading-snug">
                    {option.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                  {isSelected ? (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit your example
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add an example
                    </>
                  )}
                </div>

                {isSelected && reflection && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {reflection}
                  </p>
                )}
              </button>

              {isSelected && (
                <button
                  type="button"
                  aria-label={`Remove ${option.title}`}
                  title="Remove this selection"
                  disabled={
                    Boolean(isRemoving) || isSaving || isCompleting
                  }
                  onClick={() => void removeCapability(option.id)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isRemovingThis ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedOptions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedOptions.length}{' '}
          {selectedOptions.length === 1 ? 'example' : 'examples'} saved.
          You can still edit or remove them.
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-4xl text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-4xl justify-end">
        <Button
          onClick={handleContinue}
          disabled={
            selectedIds.length === 0 ||
            isCompleting ||
            isSaving ||
            Boolean(isRemoving)
          }
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {activeOption && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReflection();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="capability-dialog-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Your experience
                </p>

                <h2
                  id="capability-dialog-title"
                  className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {activeOption.title}
                </h2>

                <p className="leading-7 text-muted-foreground">
                  {activeOption.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReflection}
                disabled={isSaving}
                aria-label="Close reflection"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-7 space-y-4">
              <label
                htmlFor="capability-evidence"
                className="block text-base font-medium leading-7"
              >
                {activeOption.reflectionPrompt}
              </label>

              <Textarea
                id="capability-evidence"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeOption.placeholder}
                rows={6}
                autoFocus
                disabled={isSaving}
                className="resize-y text-base leading-7"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                Use a real example, even if it seems small. There is no
                need to make it sound impressive. We want to understand
                what you actually did.
              </p>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={closeReflection}
                disabled={isSaving}
                className="h-11 rounded-full px-6"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveReflection}
                disabled={!canSave || isSaving}
                className="h-11 gap-2 rounded-full px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save example
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

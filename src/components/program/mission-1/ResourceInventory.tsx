
'use client';

import { useEffect, useRef, useState } from 'react';
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
import { $userContext, userContextActions } from '@/lib/stores/user-context';

type ResourceType = 'time' | 'money' | 'energy' | 'access' | 'credibility';

type ResourceEntry = {
  id: string;
  type: ResourceType;
  title: string;
  detail: string;
};

type ResourceOption = {
  id: ResourceType;
  title: string;
  description: string;
  prompt: string;
  placeholder: string;
};

type ResourcesContext = {
  items?: ResourceEntry[];
};

const RESOURCE_OPTIONS: ResourceOption[] = [
  {
    id: 'time',
    title: 'Time',
    description: 'Time you can realistically give to this.',
    prompt: 'What does your available time actually look like?',
    placeholder: 'I can give this two evenings a week.',
  },
  {
    id: 'money',
    title: 'Money',
    description: 'Money you could realistically put towards getting started.',
    prompt: 'What does that actually look like for you?',
    placeholder: 'I can put aside ₹20,000 to get started.',
  },
  {
    id: 'energy',
    title: 'Energy',
    description: 'The capacity and willingness you have to put effort into this.',
    prompt: 'What does your current capacity actually look like?',
    placeholder: 'I have enough energy for a few focused hours each week.',
  },
  {
    id: 'access',
    title: 'Access',
    description:
      'Places, audiences, markets, facilities, platforms or other things you can already get access to.',
    prompt: 'What do you already have access to?',
    placeholder: 'I can use a commercial kitchen through a friend.',
  },
  {
    id: 'credibility',
    title: 'Credibility',
    description:
      'Trust, reputation, qualifications or standing you have already built.',
    prompt: 'What gives you credibility or makes it easier for people to trust you?',
    placeholder: 'People in my industry already know me and trust my work.',
  },
];

function getSavedItems(
  progress: NodeComponentProps['progress'],
): ResourceEntry[] {
  const resources = progress.payload?.resources?.items;

  if (Array.isArray(resources)) {
    return resources as ResourceEntry[];
  }

  const legacyItems = progress.payload?.items;

  if (Array.isArray(legacyItems)) {
    return legacyItems as ResourceEntry[];
  }

  return [];
}

export function ResourceInventory({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const hasInitialized = useRef(false);

  const savedContext = contextState.userContext?.resources as
    | ResourcesContext
    | null
    | undefined;

  const [items, setItems] = useState<ResourceEntry[]>([]);
  const [activeResourceId, setActiveResourceId] =
    useState<ResourceType | null>(null);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<ResourceType | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeResource = RESOURCE_OPTIONS.find(
    (resource) => resource.id === activeResourceId,
  );

  const selectedIds = items.map((item) => item.type);

  const canSave = draft.trim().length > 0;

  const canContinue = items.length > 0;

  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextItems = savedContext?.items;
    const progressItems = getSavedItems(progress);

    const initialItems = Array.isArray(contextItems)
      ? contextItems
      : progressItems;

    setItems(initialItems);
    hasInitialized.current = true;
  }, [contextState.isHydrated, savedContext, progress]);

  useEffect(() => {
    if (!activeResourceId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        setActiveResourceId(null);
        setError(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeResourceId, isSaving]);

  function openReflection(resource: ResourceOption) {
    const savedItem = items.find((item) => item.type === resource.id);

    setDraft(savedItem?.detail ?? '');
    setActiveResourceId(resource.id);
    setError(null);
  }

  function closeReflection() {
    if (isSaving) return;

    setActiveResourceId(null);
    setError(null);
  }

  async function persistResources(nextItems: ResourceEntry[]) {
    const result = await updateUserProgramContext({
      resources: {
        items: nextItems,
      },
    });

    userContextActions.updateContextLocally(result.userContext);
  }

  async function saveReflection() {
    if (!activeResource || !canSave || isSaving) return;

    setIsSaving(true);
    setError(null);

    const savedItem: ResourceEntry = {
      id: activeResource.id,
      type: activeResource.id,
      title: activeResource.title,
      detail: draft.trim(),
    };

    const nextItems = [
      ...items.filter((item) => item.type !== activeResource.id),
      savedItem,
    ];

    try {
      await persistResources(nextItems);

      setItems(nextItems);
      setActiveResourceId(null);
    } catch (err) {
      console.error('[RESOURCE INVENTORY SAVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your response.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeResource(id: ResourceType) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextItems = items.filter((item) => item.type !== id);

    setIsRemoving(id);
    setError(null);

    try {
      await persistResources(nextItems);
      setItems(nextItems);
    } catch (err) {
      console.error('[RESOURCE INVENTORY REMOVE]', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong removing this resource.',
      );
    } finally {
      setIsRemoving(null);
    }
  }

  async function handleContinue() {
    if (!canContinue || isCompleting || isSaving || isRemoving) return;

    setIsCompleting(true);
    setError(null);

    try {
      await persistResources(items);

      await onComplete({
        resources: {
          items,
        },
        completed: true,
      });
    } catch (err) {
      console.error('[RESOURCE INVENTORY COMPLETE]', err);

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
          {node.title || 'What do you already have?'}
        </h1>

        <p className="text-lg leading-8 text-muted-foreground">
          Before you decide what you need, take stock of what is already
          available to you.
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Resources aren&apos;t just money. They are things that give you
          capacity, access or leverage.
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Choose the resources you can realistically draw on. Select a card
          to reflect on what you have available. You can edit or remove your
          responses at any time.
        </p>
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {RESOURCE_OPTIONS.map((resource) => {
          const savedItem = items.find(
            (item) => item.type === resource.id,
          );
          const isSelected = Boolean(savedItem);
          const isRemovingThis = isRemoving === resource.id;

          return (
            <div
              key={resource.id}
              className={`relative self-start rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => openReflection(resource)}
                disabled={
                  isSaving || Boolean(isRemoving) || isCompleting
                }
                aria-label={
                  isSelected
                    ? `Edit response: ${resource.title}`
                    : `Reflect on: ${resource.title}`
                }
                className="flex w-full flex-col items-start p-4 text-left sm:p-5"
              >
                <div className="flex w-full items-start gap-3">
                  <h3 className="font-heading text-xl font-medium leading-snug">
                    {resource.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {resource.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                  {isSelected ? (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit your response
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" />
                      Select to reflect
                    </>
                  )}
                </div>

                {savedItem?.detail && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {savedItem.detail}
                  </p>
                )}
              </button>

              {isSelected && (
                <button
                  type="button"
                  aria-label={`Remove ${resource.title}`}
                  title="Remove this selection"
                  disabled={
                    Boolean(isRemoving) || isSaving || isCompleting
                  }
                  onClick={() => void removeResource(resource.id)}
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

      {items.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'resource' : 'resources'} saved.
          You can still edit or remove them.
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-4xl text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-4xl justify-end border-t border-border pt-8">
        <Button
          onClick={handleContinue}
          disabled={
            !canContinue ||
            isCompleting ||
            isSaving ||
            Boolean(isRemoving)
          }
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isCompleting ? (
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
      </div>

      {activeResource && (
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
            aria-labelledby="resource-dialog-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Resource reflection
                </p>

                <h2
                  id="resource-dialog-title"
                  className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {activeResource.title}
                </h2>

                <p className="leading-7 text-muted-foreground">
                  {activeResource.description}
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
                htmlFor="resource-reflection"
                className="block text-base font-medium leading-7"
              >
                {activeResource.prompt}
              </label>

              <Textarea
                id="resource-reflection"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeResource.placeholder}
                rows={5}
                autoFocus
                disabled={isSaving}
                className="resize-y text-base leading-7"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                Be realistic about what you can actually draw on. There is no
                need to make it sound bigger than it is.
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
                    Save response
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

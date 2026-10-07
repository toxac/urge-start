'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { userContextActions } from '@/lib/stores/user-context';

type ResourceType =
  | 'time'
  | 'money'
  | 'energy'
  | 'access'
  | 'credibility';

type ResourceEntry = {
  id: string;
  type: ResourceType;
  title: string;
  detail: string;
};

const RESOURCE_OPTIONS: {
  id: ResourceType;
  title: string;
  description: string;
  prompt: string;
  placeholder: string;
}[] = [
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

function getSavedItems(progress: NodeComponentProps['progress']): ResourceEntry[] {
  const contextItems = progress.payload?.resources?.items;

  if (Array.isArray(contextItems)) {
    return contextItems as ResourceEntry[];
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
  const savedItems = getSavedItems(progress);

  const [items, setItems] = useState<ResourceEntry[]>(savedItems);
  const [selectedIds, setSelectedIds] = useState<ResourceType[]>(
    savedItems.map(item => item.type)
  );
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      savedItems.map(item => [item.type, item.detail])
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(savedItems.length === 0);

  const toggleResource = (id: ResourceType) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        setDrafts(current => {
          const next = { ...current };
          delete next[id];
          return next;
        });

        setItems(current => current.filter(item => item.type !== id));

        return prev.filter(resourceId => resourceId !== id);
      }

      return [...prev, id];
    });
  };

  const updateDraft = (id: ResourceType, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const canContinue =
    selectedIds.length > 0 &&
    selectedIds.every(id => drafts[id]?.trim().length > 0);

  async function handleComplete() {
    if (isSubmitting || !canContinue) return;

    setIsSubmitting(true);

    const resourceItems: ResourceEntry[] = selectedIds.map(id => {
      const option = RESOURCE_OPTIONS.find(resource => resource.id === id)!;

      return {
        id,
        type: id,
        title: option.title,
        detail: drafts[id].trim(),
      };
    });

    try {
      const result = await updateUserProgramContext({
        resources: {
          items: resourceItems,
        },
      });

      userContextActions.updateContextLocally(result.userContext);

      await onComplete({
        resources: {
          items: resourceItems,
        },
        completed: true,
      });

      setItems(resourceItems);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  if (!isEditing && items.length > 0) {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title || 'What do you already have?'}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Before you decide what you need, take stock of what is already
            available to you.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-heading text-lg font-medium">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-base leading-7 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex max-w-3xl items-center justify-between border-t border-border pt-8">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="gap-2 rounded-full"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            onClick={() => onComplete({
              resources: {
                items,
              },
              completed: true,
            })}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'What do you already have?'}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Before you decide what you need, take stock of what is already
          available to you.
        </p>

        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Resources aren't just money. They are things that give you capacity,
          access or leverage.
        </p>
      </div>

      <div className="max-w-4xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {RESOURCE_OPTIONS.map(resource => {
            const selected = selectedIds.includes(resource.id);

            return (
              <button
                key={resource.id}
                type="button"
                onClick={() => toggleResource(resource.id)}
                className={[
                  'rounded-2xl border p-5 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-lg font-medium">
                      {resource.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>

                  <div
                    className={[
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border',
                    ].join(' ')}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="max-w-3xl space-y-8">
          <div className="border-t border-border pt-8">
            <h3 className="font-heading text-xl font-medium">
              Tell us a little more
            </h3>

            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Don't rate it. Give us something real we can understand.
            </p>
          </div>

          {selectedIds.map(id => {
            const resource = RESOURCE_OPTIONS.find(
              option => option.id === id
            )!;

            return (
              <div key={id} className="space-y-3">
                <div>
                  <label className="font-heading text-lg font-medium">
                    {resource.title}
                  </label>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.prompt}
                  </p>
                </div>

                <textarea
                  value={drafts[id] ?? ''}
                  onChange={event => updateDraft(id, event.target.value)}
                  placeholder={resource.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base leading-7 outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex max-w-3xl justify-end border-t border-border pt-8">
        <Button
          onClick={handleComplete}
          disabled={isSubmitting || !canContinue}
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
      </div>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  Star,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type ReflectiveOptionPreset = {
  id: string;
  title: string;
  description: string;
  reflectionPrompt: string;
  placeholder: string;
};

export type ReflectiveItem = {
  id: string;
  title: string;
  reflection: string;
  isPrimary?: boolean;
  isCustom?: boolean;
};

export type ReflectiveOptionGridProps = {
  title: string;
  introParagraphs: string[];
  options: ReflectiveOptionPreset[];
  initialItems?: ReflectiveItem[];
  isCompleted?: boolean;
  entityLabel: string; // e.g. "barrier", "motivation", "risk"
  primaryBadgeLabel?: string; // e.g. "Biggest barrier", "Core motivation"
  prioritizePrompt?: string;
  prioritizeSubtext?: string;
  customPromptLabel?: string;
  customPromptPlaceholder?: string;
  onSubmit: (items: ReflectiveItem[]) => Promise<void>;
  onContinueWithoutChanges?: () => Promise<void>;
};

export function ReflectiveOptionGrid({
  title,
  introParagraphs,
  options,
  initialItems = [],
  isCompleted = false,
  entityLabel,
  primaryBadgeLabel = 'Top focus',
  prioritizePrompt = `Which of these ${entityLabel}s matters most right now?`,
  prioritizeSubtext = 'They are all real, but one usually has the strongest hold. Choose the one that feels most significant.',
  customPromptLabel = `What is another ${entityLabel} for you?`,
  customPromptPlaceholder = `In your own words, describe this ${entityLabel}...`,
  onSubmit,
  onContinueWithoutChanges,
}: ReflectiveOptionGridProps) {
  // Navigation stage: 'review' | 'select' | 'prioritize'
  const hasSavedData = initialItems.length > 0;
  const [stage, setStage] = useState<'review' | 'select' | 'prioritize'>(
    isCompleted || hasSavedData ? 'review' : 'select'
  );

  // Selected items & reflections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<
    Array<{ id: string; title: string }>
  >([]);

  // Dialog state for adding/editing reflection in Step 1
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftReflection, setDraftReflection] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from initialItems whenever it updates
  useEffect(() => {
    if (initialItems.length === 0) return;

    const ids: string[] = [];
    const refls: Record<string, string> = {};
    const customs: Array<{ id: string; title: string }> = [];
    let initialPrimary: string | null = null;

    for (const item of initialItems) {
      ids.push(item.id);
      refls[item.id] = item.reflection;
      if (item.isPrimary) initialPrimary = item.id;
      if (item.isCustom) {
        customs.push({ id: item.id, title: item.title });
      }
    }

    setSelectedIds(ids);
    setReflections(refls);
    setCustomItems(customs);
    setPrimaryId(initialPrimary ?? (ids.length === 1 ? ids[0] : null));

    // If completed or returning to saved data, stay in review mode
    if (isCompleted || ids.length > 0) {
      setStage((prev) => (prev === 'select' && !hasSavedData ? 'review' : prev));
    }
  }, [initialItems, isCompleted]);

  // Dialog Escape key handler
  useEffect(() => {
    if (!activeModalId && !isCreatingCustom) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSavingDraft) {
        closeModal();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalId, isCreatingCustom, isSavingDraft]);

  const activePreset = useMemo(
    () => options.find((opt) => opt.id === activeModalId),
    [options, activeModalId]
  );

  const activeCustom = useMemo(
    () => customItems.find((item) => item.id === activeModalId),
    [customItems, activeModalId]
  );

  function openPresetModal(option: ReflectiveOptionPreset) {
    setError(null);
    setIsCreatingCustom(false);
    setDraftTitle(option.title);
    setDraftReflection(reflections[option.id] ?? '');
    setActiveModalId(option.id);
  }

  function openCustomModal(existingItem?: { id: string; title: string }) {
    setError(null);
    if (existingItem) {
      setIsCreatingCustom(false);
      setDraftTitle(existingItem.title);
      setDraftReflection(reflections[existingItem.id] ?? '');
      setActiveModalId(existingItem.id);
    } else {
      setIsCreatingCustom(true);
      setDraftTitle('');
      setDraftReflection('');
      setActiveModalId(null);
    }
  }

  function closeModal() {
    if (isSavingDraft) return;
    setActiveModalId(null);
    setIsCreatingCustom(false);
    setError(null);
  }

  function saveModal() {
    if (!draftReflection.trim() || draftReflection.trim().length < 10) {
      setError('Please write at least a sentence (10+ characters) reflecting on this.');
      return;
    }

    setIsSavingDraft(true);
    setError(null);

    if (isCreatingCustom) {
      if (!draftTitle.trim()) {
        setError(`Please give this ${entityLabel} a short title.`);
        setIsSavingDraft(false);
        return;
      }

      const newId = `custom_${Date.now()}`;
      setCustomItems((prev) => [...prev, { id: newId, title: draftTitle.trim() }]);
      setSelectedIds((prev) => [...prev, newId]);
      setReflections((prev) => ({ ...prev, [newId]: draftReflection.trim() }));
    } else if (activeModalId) {
      if (!selectedIds.includes(activeModalId)) {
        setSelectedIds((prev) => [...prev, activeModalId]);
      }
      setReflections((prev) => ({ ...prev, [activeModalId]: draftReflection.trim() }));
    }

    setIsSavingDraft(false);
    closeModal();
  }

  function removeItem(id: string) {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
    setReflections((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (primaryId === id) setPrimaryId(null);
  }

  function buildOutputPayload(chosenPrimaryId?: string | null): ReflectiveItem[] {
    const finalPrimary = chosenPrimaryId ?? primaryId ?? selectedIds[0];
    return selectedIds.map((id) => {
      const preset = options.find((opt) => opt.id === id);
      const custom = customItems.find((item) => item.id === id);
      const itemTitle = preset?.title ?? custom?.title ?? 'Custom item';

      return {
        id,
        title: itemTitle,
        reflection: (reflections[id] ?? '').trim(),
        isPrimary: finalPrimary === id,
        isCustom: Boolean(custom),
      };
    });
  }

  async function handleStep1Continue() {
    if (selectedIds.length === 0) return;

    if (selectedIds.length === 1) {
      await submitPayload(selectedIds[0]);
    } else {
      setStage('prioritize');
    }
  }

  async function submitPayload(finalPrimaryId: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = buildOutputPayload(finalPrimaryId);
      await onSubmit(payload);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Could not save your responses.');
      setIsSubmitting(false);
    }
  }

  async function handleReviewContinue() {
    setIsSubmitting(true);
    setError(null);

    try {
      if (onContinueWithoutChanges) {
        await onContinueWithoutChanges();
      } else {
        const payload = buildOutputPayload();
        await onSubmit(payload);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Could not proceed.');
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // REVISIT / REVIEW STATE: Rendered when user returns after saving/completing
  // ---------------------------------------------------------------------------
  if (stage === 'review' && selectedIds.length > 0) {
    const primaryItem = selectedIds.find((id) => id === primaryId) ?? selectedIds[0];
    const otherItems = selectedIds.filter((id) => id !== primaryItem);

    const getTitle = (id: string) =>
      options.find((o) => o.id === id)?.title ??
      customItems.find((c) => c.id === id)?.title ??
      '';

    return (
      <div className="w-full space-y-10 pb-12 animate-in fade-in duration-300">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Saved Reflection
          </span>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>

          <p className="text-lg leading-8 text-muted-foreground">
            Here is what you named. You can review your responses, make changes, or continue forward.
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Primary Item Card */}
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/[0.04] p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                <Star className="h-3 w-3 fill-current" />
                {primaryBadgeLabel}
              </span>
            </div>

            <h2 className="font-heading text-xl font-semibold text-foreground">
              {getTitle(primaryItem)}
            </h2>

            <p className="text-base leading-8 text-foreground/90 whitespace-pre-wrap">
              {reflections[primaryItem]}
            </p>
          </div>

          {/* Secondary Items */}
          {otherItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Other {entityLabel}s you identified
              </h3>

              <div className="space-y-3">
                {otherItems.map((id) => (
                  <div key={id} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <h4 className="font-medium text-foreground">{getTitle(id)}</h4>
                    <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                      {reflections[id]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="max-w-3xl text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex max-w-3xl items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStage('select')}
            disabled={isSubmitting}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            Edit your responses
          </Button>

          <Button
            onClick={handleReviewContinue}
            disabled={isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Continuing...
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

  // ---------------------------------------------------------------------------
  // STEP 2: The Deliberate Pause & Prioritize
  // ---------------------------------------------------------------------------
  if (stage === 'prioritize') {
    return (
      <div className="w-full space-y-10 pb-12 animate-in fade-in duration-300">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step 2 of 2 · The Focus
          </span>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {prioritizePrompt}
          </h1>

          <p className="text-lg leading-8 text-muted-foreground">
            {prioritizeSubtext}
          </p>
        </div>

        {/* Selected Items List */}
        <div className="max-w-3xl space-y-3">
          {selectedIds.map((id) => {
            const preset = options.find((opt) => opt.id === id);
            const custom = customItems.find((item) => item.id === id);
            const itemTitle = preset?.title ?? custom?.title ?? '';
            const reflection = reflections[id] ?? '';
            const isSelected = primaryId === id;

            return (
              <div
                key={id}
                onClick={() => setPrimaryId(id)}
                className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/30 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40 group-hover:border-primary'
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-heading text-lg font-medium text-foreground">
                        {itemTitle}
                      </h2>
                      {isSelected && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary shrink-0">
                          {primaryBadgeLabel}
                        </span>
                      )}
                    </div>

                    {reflection && (
                      <p className="text-sm leading-6 text-muted-foreground italic border-l-2 border-border/80 pl-3">
                        &ldquo;{reflection}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="max-w-3xl text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex max-w-3xl items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStage('select')}
            disabled={isSubmitting}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to edit selections
          </Button>

          <Button
            onClick={() => primaryId && submitPayload(primaryId)}
            disabled={!primaryId || isSubmitting}
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Confirm and continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 1: Select & Reflect
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-300">
      <div className="max-w-3xl space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>

        {introParagraphs.map((para, i) => (
          <p key={i} className="text-lg leading-8 text-muted-foreground">
            {para}
          </p>
        ))}
      </div>

      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const reflection = reflections[option.id] ?? '';

          return (
            <div
              key={option.id}
              className={`relative flex flex-col justify-between rounded-2xl border transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => openPresetModal(option)}
                className="flex w-full flex-col items-start p-5 text-left"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <h2 className="font-heading text-xl font-medium leading-snug">
                    {option.title}
                  </h2>
                  {isSelected && (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {option.description}
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

                {isSelected && reflection && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {reflection}
                  </p>
                )}
              </button>

              {isSelected && (
                <div className="flex items-center justify-end border-t border-border/50 px-5 py-2">
                  <button
                    type="button"
                    aria-label={`Remove ${option.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(option.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {customItems.map((item) => {
          const reflection = reflections[item.id] ?? '';

          return (
            <div
              key={item.id}
              className="relative flex flex-col justify-between rounded-2xl border border-primary bg-primary/5 ring-1 ring-primary/20"
            >
              <button
                type="button"
                onClick={() => openCustomModal(item)}
                className="flex w-full flex-col items-start p-5 text-left"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Your own
                    </span>
                    <h2 className="font-heading text-xl font-medium leading-snug">
                      {item.title}
                    </h2>
                  </div>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit your response
                </div>

                {reflection && (
                  <p className="mt-4 line-clamp-3 w-full border-t border-border/70 pt-3 text-sm leading-6 text-muted-foreground">
                    {reflection}
                  </p>
                )}
              </button>

              <div className="flex items-center justify-end border-t border-border/50 px-5 py-2">
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => removeItem(item.id)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => openCustomModal()}
          className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Plus className="h-5 w-5" />
          </div>
          <span className="mt-3 font-semibold text-foreground">
            Something else
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Add your own {entityLabel} in your own words
          </span>
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="max-w-4xl text-sm text-muted-foreground">
          <p>
            {selectedIds.length} {selectedIds.length === 1 ? 'statement' : 'statements'} selected.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-4xl text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-4xl justify-end">
        <Button
          onClick={handleStep1Continue}
          disabled={selectedIds.length === 0 || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {selectedIds.length > 1 ? 'Continue to choose top focus' : 'Continue'}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Modal Dialog for Reflection / Custom Input */}
      {(activeModalId || isCreatingCustom) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {isCreatingCustom ? `Add Your Own ${entityLabel}` : 'Reflection'}
                </span>

                {isCreatingCustom ? (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-semibold text-foreground">
                      {customPromptLabel}
                    </label>
                    <Input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={customPromptPlaceholder}
                      className="text-base"
                    />
                  </div>
                ) : (
                  <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                    {activePreset?.title ?? activeCustom?.title}
                  </h2>
                )}

                {activePreset && (
                  <p className="leading-7 text-muted-foreground">
                    {activePreset.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSavingDraft}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-base font-medium leading-7">
                {isCreatingCustom
                  ? 'How does this show up in your life or keep you from starting?'
                  : activePreset?.reflectionPrompt ?? 'How does this show up for you?'}
              </label>

              <Textarea
                value={draftReflection}
                onChange={(e) => setDraftReflection(e.target.value)}
                placeholder={
                  activePreset?.placeholder ??
                  'What actually happens when this comes up? Describe it in your own words...'
                }
                rows={6}
                disabled={isSavingDraft}
                className="resize-y text-base leading-7"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                Stay with your own experience. You don&apos;t need to get the answer perfect.
              </p>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                disabled={isSavingDraft}
                className="h-11 rounded-full px-6"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={saveModal}
                disabled={isSavingDraft || !draftReflection.trim()}
                className="h-11 gap-2 rounded-full px-6"
              >
                {isSavingDraft ? (
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
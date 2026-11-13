'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Loader2,
  Pencil,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';
import { saveUserTasks } from '@/actions/tasks';
import { generateAskPreparationGuide } from '@/actions/responses/mission1';
import type { RealWorldExperimentMetadata } from '@/program/types';

type ExperimentStage = 'prepare' | 'guide' | 'go' | 'return' | 'complete';

type AskPreparationGuide = {
  opening: string;
  wording: string;
  avoid: string[];
  ifTheySayNo: string;
  reminder: string;
};

type ExperimentPayload = {
  target: string;
  intention: string;
  why: string;
  prediction: string;
  actionTaken: string;
  outcome: string;
  reaction: string;
  reflection: string;
  preparationGuide?: AskPreparationGuide | null;
  completed: boolean;
};

type ExperimentDraft = Partial<ExperimentPayload> & {
  stage?: Exclude<ExperimentStage, 'complete'>;
  taskAdded?: boolean;
};

function getDraftStorageKey(nodeKey: string): string {
  return `urge:experiment-draft:${nodeKey}`;
}

function readLocalDraft(nodeKey: string): ExperimentDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(nodeKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as ExperimentDraft)
      : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(nodeKey: string, draft: ExperimentDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getDraftStorageKey(nodeKey),
      JSON.stringify(draft),
    );
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function clearLocalDraft(nodeKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getDraftStorageKey(nodeKey));
  } catch {
    // Ignore storage errors
  }
}

export function RealWorldExperiment({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const metadata = node.metadata as RealWorldExperimentMetadata;
  const experiment = metadata.experiment;

  const { prompt, framing, scenarioHints, difficulty, purpose } = experiment;

  const saved = (progress.payload ?? {}) as Partial<ExperimentPayload>;
  const isNodeCompleted = saved.completed === true || progress.completed === true;

  const [stage, setStage] = useState<ExperimentStage>(
    isNodeCompleted ? 'complete' : 'prepare',
  );

  const [target, setTarget] = useState(saved.target ?? '');
  const [intention, setIntention] = useState(saved.intention ?? '');
  const [why, setWhy] = useState(saved.why ?? '');
  const [prediction, setPrediction] = useState(saved.prediction ?? '');
  const [actionTaken, setActionTaken] = useState(saved.actionTaken ?? '');
  const [outcome, setOutcome] = useState(saved.outcome ?? '');
  const [reaction, setReaction] = useState(saved.reaction ?? '');
  const [reflection, setReflection] = useState(saved.reflection ?? '');

  const [guide, setGuide] = useState<AskPreparationGuide | null>(
    saved.preparationGuide ?? null,
  );

  const [hasResumedDraft, setHasResumedDraft] = useState(false);
  const [taskAdded, setTaskAdded] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pausedNotice, setPausedNotice] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate any saved in-progress draft when returning to an incomplete experiment
  useEffect(() => {
    if (isNodeCompleted) return;

    const draft = readLocalDraft(nodeKey);
    if (!draft) return;

    if (typeof draft.target === 'string') setTarget(draft.target);
    if (typeof draft.intention === 'string') setIntention(draft.intention);
    if (typeof draft.why === 'string') setWhy(draft.why);
    if (typeof draft.prediction === 'string') setPrediction(draft.prediction);
    if (typeof draft.actionTaken === 'string') setActionTaken(draft.actionTaken);
    if (typeof draft.outcome === 'string') setOutcome(draft.outcome);
    if (typeof draft.reaction === 'string') setReaction(draft.reaction);
    if (typeof draft.reflection === 'string') setReflection(draft.reflection);
    if (draft.preparationGuide) setGuide(draft.preparationGuide);
    if (typeof draft.taskAdded === 'boolean') setTaskAdded(draft.taskAdded);

    if (
      draft.stage &&
      ['prepare', 'guide', 'go', 'return'].includes(draft.stage)
    ) {
      setStage(draft.stage);
      if (draft.stage === 'go' || draft.stage === 'guide') {
        setHasResumedDraft(true);
      }
    }
  }, [isNodeCompleted, nodeKey]);

  // Persist intermediate progress locally so leaving the app never wipes prep work
  useEffect(() => {
    if (isNodeCompleted || stage === 'complete') return;

    const hasAnyInput =
      target.trim().length > 0 ||
      intention.trim().length > 0 ||
      why.trim().length > 0 ||
      prediction.trim().length > 0 ||
      actionTaken.trim().length > 0 ||
      outcome.trim().length > 0 ||
      reaction.trim().length > 0 ||
      reflection.trim().length > 0;

    if (!hasAnyInput) return;

    writeLocalDraft(nodeKey, {
      stage,
      target,
      intention,
      why,
      prediction,
      actionTaken,
      outcome,
      reaction,
      reflection,
      preparationGuide: guide,
      taskAdded,
    });
  }, [
    isNodeCompleted,
    nodeKey,
    stage,
    target,
    intention,
    why,
    prediction,
    actionTaken,
    outcome,
    reaction,
    reflection,
    guide,
    taskAdded,
  ]);

  const canPrepare =
    target.trim().length > 0 &&
    intention.trim().length > 0 &&
    why.trim().length > 0 &&
    prediction.trim().length > 0;

  const canReflect =
    actionTaken.trim().length > 0 &&
    outcome.trim().length > 0 &&
    reaction.trim().length > 0 &&
    reflection.trim().length > 0;

  async function handlePrepare() {
    if (!canPrepare || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAskPreparationGuide(
        {
          target: target.trim(),
          intention: intention.trim(),
          why: why.trim(),
          prediction: prediction.trim(),
          difficulty,
          purpose,
          framing,
        },
        nodeKey,
      );

      setGuide(result);
      setStage('guide');
    } catch (err) {
      console.error('[ASK PREPARATION GUIDE]', err);
      setError(
        'We could not prepare your guide just now. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAddAskToTasks() {
    if (taskAdded || isAddingTask || !target.trim() || !intention.trim()) return;

    setIsAddingTask(true);
    setError(null);

    try {
      await saveUserTasks([
        {
          title: `Ask ${target.trim()}: ${intention.trim()}`,
          description: `Real-world experiment (${node.title || nodeKey}). Prediction: ${prediction.trim()}`,
          task_type: 'general',
          source_node_key: nodeKey,
          is_nudge_enabled: true,
          metadata: {
            experiment_target: target.trim(),
            experiment_intention: intention.trim(),
            difficulty,
            purpose,
          },
        },
      ]);

      setTaskAdded(true);
    } catch (err) {
      console.error('[EXPERIMENT ADD TASK]', err);
      setError('Could not add this ask to your tasks right now.');
    } finally {
      setIsAddingTask(false);
    }
  }

  async function handleComplete() {
    if (!canReflect || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload: ExperimentPayload = {
      target: target.trim(),
      intention: intention.trim(),
      why: why.trim(),
      prediction: prediction.trim(),
      actionTaken: actionTaken.trim(),
      outcome: outcome.trim(),
      reaction: reaction.trim(),
      reflection: reflection.trim(),
      preparationGuide: guide,
      completed: true,
    };

    const structuredObservation = [
      `Target & Ask: Approach ${payload.target} and ask for "${payload.intention}"`,
      `Prediction: ${payload.prediction}`,
      `What I Did: ${payload.actionTaken}`,
      `What Happened: ${payload.outcome}`,
      `My Reaction: ${payload.reaction}`,
      `What Stood Out: ${payload.reflection}`,
    ].join('\n\n');

    try {
      await saveObservation({
        title: node.title || 'Reflection after making a real ask',
        content: structuredObservation,
        type: 'experiment',
        domain: 'personal',
        focus: 'asking',
        source_node_key: nodeKey,
      });

      await onComplete(payload);

      clearLocalDraft(nodeKey);
      setStage('complete');
    } catch (err) {
      console.error('[REAL WORLD EXPERIMENT]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const guideReadAloudText = guide
    ? [
        `How to open. ${guide.opening}`,
        `Making the ask. ${guide.wording}`,
        `What to avoid. ${guide.avoid.join('. ')}`,
        `If they say no. ${guide.ifTheySayNo}`,
        `Before you go. ${guide.reminder}`,
      ].join(' ')
    : '';

  if (stage === 'complete') {
    return (
      <div className="w-full max-w-4xl space-y-10 animate-in fade-in duration-300">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            You now have an actual experience to compare with what you
            expected. The answer matters, but so does what you learned
            by making the ask.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you expected
            </p>
            <p className="text-lg leading-8">{prediction}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happened
            </p>
            <p className="text-lg leading-8">{outcome}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you noticed
          </p>
          <p className="text-lg leading-8">{reflection}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStage('return')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            Edit reflection
          </Button>

          <Button
            onClick={() =>
              onComplete({
                target: target.trim(),
                intention: intention.trim(),
                why: why.trim(),
                prediction: prediction.trim(),
                actionTaken: actionTaken.trim(),
                outcome: outcome.trim(),
                reaction: reaction.trim(),
                reflection: reflection.trim(),
                preparationGuide: guide,
                completed: true,
              })
            }
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12 pb-16">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {framing}
        </p>
      </div>

      {stage === 'prepare' && (
        <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your experiment
            </p>
            <p className="text-2xl leading-10">{prompt}</p>
          </div>

          {scenarioHints.length > 0 && (
            <details className="group border-b border-border pb-4">
              <summary className="cursor-pointer list-none text-sm text-muted-foreground hover:text-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="transition-transform group-open:rotate-90">
                    ›
                  </span>
                  Need some ideas?
                </span>
              </summary>

              <ul className="mt-4 space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
                {scenarioHints.map((hint) => (
                  <li key={hint} className="list-disc">
                    {hint}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Who are you going to approach?
            </label>
            <SpeechTextarea
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Who is the person, and what is your connection to them?"
              rows={3}
              className="resize-y text-lg leading-7"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What are you going to ask for?
            </label>
            <SpeechTextarea
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              placeholder="I am going to ask..."
              rows={3}
              className="resize-y text-lg leading-7"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Why this person?
            </label>
            <SpeechTextarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              placeholder="I chose them because..."
              rows={3}
              className="resize-y text-lg leading-7"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2 border-t border-border pt-8">
            <h3 className="text-2xl font-semibold">
              Before you ask, what do you think will happen?
            </h3>
            <p className="leading-7 text-muted-foreground">
              Make your prediction before getting advice. What do you
              expect them to say or do? What makes you think that?
              There is no right answer. You will compare this with what
              actually happens.
            </p>
            <SpeechTextarea
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
              placeholder="I think they will... because..."
              rows={4}
              className="resize-y text-lg leading-8"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => void handlePrepare()}
              disabled={!canPrepare || isGenerating}
              className="h-12 gap-2 rounded-full px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing your guide...
                </>
              ) : (
                <>
                  Help me prepare
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {stage === 'guide' && guide && (
        <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                Let&apos;s prepare for the conversation.
              </h3>
              <p className="leading-7 text-muted-foreground">
                Use this as a guide, not a script. Make it sound like you, or
                listen to how it sounds aloud.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <SpeechContent
              textToRead={guideReadAloudText}
              showControls="always"
              controlsPosition="top-right"
            >
              <div className="space-y-6">
                <section className="space-y-2 pr-16">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    How to open
                  </h4>
                  <p className="text-lg leading-8">{guide.opening}</p>
                </section>

                <section className="space-y-2 border-t border-border pt-5">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Making the ask
                  </h4>
                  <p className="text-lg leading-8">{guide.wording}</p>
                </section>

                <section className="space-y-2 border-t border-border pt-5">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    What to avoid
                  </h4>
                  <ul className="space-y-2 pl-5 text-base leading-7">
                    {guide.avoid.map((item, index) => (
                      <li key={`${index}-${item}`} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2 border-t border-border pt-5">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    If they say no
                  </h4>
                  <p className="text-lg leading-8">{guide.ifTheySayNo}</p>
                </section>

                <section className="rounded-xl bg-muted/50 p-5">
                  <h4 className="text-sm font-semibold">Before you go</h4>
                  <p className="mt-2 leading-7">{guide.reminder}</p>
                </section>
              </div>
            </SpeechContent>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStage('prepare')}
              className="h-12 rounded-full px-6"
            >
              Review my answers
            </Button>
            <Button
              onClick={() => {
                setPausedNotice(false);
                setStage('go');
              }}
              className="h-12 gap-2 rounded-full px-8"
            >
              I&apos;m ready to make the ask
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'go' && (
        <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
          {hasResumedDraft && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Welcome back — your preparation and prediction are saved. Once
              you&apos;ve made the ask, log what happened below.
            </div>
          )}

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your ask
            </p>
            <p className="text-2xl leading-10">
              Approach <strong>{target}</strong> and ask for{' '}
              <strong>{intention}</strong>.
            </p>
            <p className="leading-7 text-muted-foreground">
              You have made your prediction and prepared your approach.
              Now step away from the app and find out what actually happens. You
              don&apos;t need to control the answer.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <p className="text-sm font-semibold">Your prediction</p>
            <p className="leading-7 text-muted-foreground">{prediction}</p>
          </div>

          {/* Optional sync to user_tasks while stepping away */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2.5 text-sm">
              <Bell className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {taskAdded
                  ? 'Saved to your task list so it stays on your radar.'
                  : 'Want this in your task list while you step away?'}
              </span>
            </div>

            <Button
              type="button"
              variant={taskAdded ? 'secondary' : 'outline'}
              size="sm"
              disabled={taskAdded || isAddingTask}
              onClick={() => void handleAddAskToTasks()}
              className="rounded-full"
            >
              {isAddingTask ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Adding...
                </>
              ) : taskAdded ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Added to tasks
                </>
              ) : (
                'Add to my tasks'
              )}
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStage('guide')}
              className="h-12 rounded-full px-6"
            >
              Review the guide
            </Button>
            <Button
              onClick={() => setStage('return')}
              className="h-12 gap-2 rounded-full px-8"
            >
              I&apos;ve made the ask
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPausedNotice(true)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
              I haven&apos;t made it yet — I need more time
            </button>

            {pausedNotice && (
              <p className="text-sm leading-6 text-muted-foreground">
                No rush. Your preparation and prediction are saved right here—close
                this tab whenever you&apos;re ready and come back once you&apos;ve
                had the conversation.
              </p>
            )}
          </div>
        </div>
      )}

      {stage === 'return' && (
        <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Reminder of your prediction:{' '}
            </span>
            {prediction}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              What did you actually do?
            </h3>
            <p className="text-muted-foreground">
              Describe what you said or did, in your own words.
            </p>
            <SpeechTextarea
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              placeholder="I..."
              rows={3}
              className="resize-y text-lg leading-7"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">What happened?</h3>
            <SpeechTextarea
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="They said... / What happened was..."
              rows={4}
              className="resize-y text-lg leading-7"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">How did you react?</h3>
            <SpeechTextarea
              value={reaction}
              onChange={(event) => setReaction(event.target.value)}
              placeholder="I felt... / I did..."
              rows={4}
              className="resize-y text-lg leading-7"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">What did you notice?</h3>
            <p className="text-muted-foreground">
              Think about your prediction, what actually happened, and
              anything that surprised you.
            </p>
            <SpeechTextarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What stands out to me is..."
              rows={5}
              className="resize-y text-lg leading-8"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage('go')}
              disabled={isSubmitting}
              className="h-12 rounded-full px-6"
            >
              Back to ask
            </Button>

            <Button
              onClick={() => void handleComplete()}
              disabled={!canReflect || isSubmitting}
              className="h-12 gap-2 rounded-full px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save what happened
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
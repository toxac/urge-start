
'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { saveObservation } from '@/actions/observations';
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

export function RealWorldExperiment({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const metadata = node.metadata as RealWorldExperimentMetadata;
  const experiment = metadata.experiment;

  const {
    prompt,
    framing,
    scenarioHints,
    difficulty,
    purpose,
  } = experiment;

  const saved = (progress.payload ?? {}) as Partial<ExperimentPayload>;

  const [stage, setStage] = useState<ExperimentStage>(
    saved.completed === true ? 'complete' : 'prepare',
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      await saveObservation({
        title: 'Real-world asking experiment',
        content: payload.reflection,
        context: [
          `Who I approached: ${payload.target}`,
          `What I asked for: ${payload.intention}`,
          `Why I chose this person: ${payload.why}`,
          `What I predicted: ${payload.prediction}`,
          `What I did: ${payload.actionTaken}`,
          `What happened: ${payload.outcome}`,
          `How I reacted: ${payload.reaction}`,
        ].join('\n\n'),
        type: 'experiment',
        domain: 'personal',
        focus: 'asking',
        source_node_key: nodeKey,
      });

      await onComplete(payload);
      setStage('complete');
    } catch (err) {
      console.error('[REAL WORLD EXPERIMENT]', err);
      setError('Something went wrong while saving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (saved.completed === true || progress.completed || stage === 'complete') {
    return (
      <div className="w-full max-w-4xl space-y-10">
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
          <div className="rounded-2xl border border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you expected
            </p>
            <p className="text-lg leading-8">{prediction}</p>
          </div>

          <div className="rounded-2xl border border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happened
            </p>
            <p className="text-lg leading-8">{outcome}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you noticed
          </p>
          <p className="text-lg leading-8">{reflection}</p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onComplete(saved)}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-12">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {framing}
        </p>
      </div>

      {stage === 'prepare' && (
        <div className="max-w-3xl space-y-8">
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
            <Textarea
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Who is the person, and what is your connection to them?"
              className="min-h-[90px] resize-none text-lg"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              What are you going to ask for?
            </label>
            <Textarea
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              placeholder="I am going to ask..."
              className="min-h-[90px] resize-none text-lg"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Why this person?
            </label>
            <Textarea
              value={why}
              onChange={(event) => setWhy(event.target.value)}
              placeholder="I chose them because..."
              className="min-h-[90px] resize-none text-lg"
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
            <Textarea
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
              placeholder="I think they will... because..."
              className="min-h-[140px] resize-none text-lg leading-8"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handlePrepare}
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
        <div className="max-w-3xl space-y-8">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                Let's prepare for the conversation.
              </h3>
              <p className="leading-7 text-muted-foreground">
                Use this as a guide, not a script. Make it sound like you.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="space-y-2">
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStage('prepare')}
              className="h-12 rounded-full px-6"
            >
              Review my answers
            </Button>
            <Button
              onClick={() => setStage('go')}
              className="h-12 gap-2 rounded-full px-8"
            >
              I'm ready to make the ask
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'go' && (
        <div className="max-w-3xl space-y-8">
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
              Now find out what actually happens. You don't need to
              control the answer.
            </p>
          </div>

          <div className="rounded-xl border border-border p-5">
            <p className="text-sm font-semibold">Your prediction</p>
            <p className="mt-2 leading-7">{prediction}</p>
          </div>

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
              I've made the ask
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setStage('guide')}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            I haven't made it yet — I need more time
          </button>
        </div>
      )}

      {stage === 'return' && (
        <div className="max-w-3xl space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              What did you actually do?
            </h3>
            <p className="text-muted-foreground">
              Describe what you said or did, in your own words.
            </p>
            <Textarea
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              placeholder="I..."
              className="min-h-[100px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">What happened?</h3>
            <Textarea
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="They said... / What happened was..."
              className="min-h-[120px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">How did you react?</h3>
            <Textarea
              value={reaction}
              onChange={(event) => setReaction(event.target.value)}
              placeholder="I felt... / I did..."
              className="min-h-[120px] resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">What did you notice?</h3>
            <p className="text-muted-foreground">
              Think about your prediction, what actually happened, and
              anything that surprised you.
            </p>
            <Textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What stands out to me is..."
              className="min-h-[160px] resize-none text-lg leading-8"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
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

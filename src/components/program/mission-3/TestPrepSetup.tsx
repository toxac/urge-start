'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, CheckSquare, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechContent } from '@/components/ui/speech-content';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import { fetchUserExperiments } from '@/actions/experiments';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function TestPrepSetup({ node, onComplete }: NodeComponentProps) {
  const userExpState = useStore($userExperiments);
  const [loading, setLoading] = useState(!userExpState.hydrated);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!userExpState.hydrated) {
      fetchUserExperiments({ missionKey: 'mission-3' })
        .then((items) => {
          if (!alive) return;
          userExperimentsActions.hydrate(items);
          setLoading(false);
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [userExpState.hydrated]);

  const activeTests = useMemo(() => {
    return userExpState.allIds
      .map((id) => userExpState.byId[id])
      .filter(
        (exp) =>
          exp &&
          exp.mission_key === 'mission-3' &&
          exp.status !== 'parked' &&
          exp.status !== 'iterated',
      );
  }, [userExpState]);

  const readAloudText = useMemo(() => {
    return [
      node.title || 'Set things up before you go live.',
      node.description || '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [node.title, node.description]);

  async function handleContinue() {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      await onComplete({ completed: true });
    } finally {
      setIsContinuing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your chosen tests…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <SpeechContent
        textToRead={readAloudText}
        showControls="always"
        controlsPosition="top-right"
        className="space-y-8"
      >
        <div className="max-w-3xl space-y-4 pr-16">
          <div className="flex items-center gap-2 text-primary">
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Quest 2 · Get Ready &amp; Go Live
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {node.title}
          </h1>
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        </div>

        {activeTests.length > 0 && (
          <div className="max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tests you&apos;re preparing ({activeTests.length})
            </p>
            <div className="space-y-2.5">
              {activeTests.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">{test.title}</p>
                    {test.setup?.where && (
                      <p className="text-xs text-muted-foreground">
                        Where: {test.setup.where}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    Pass {test.pass_number} · {test.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            First, you&apos;ll lock in the exact number that counts as a real
            response. Then you&apos;ll get checklists, guides, and ready-to-paste
            prompts so you can launch cleanly without overthinking.
          </p>
        </div>
      </SpeechContent>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isContinuing}
          className="h-12 rounded-full px-8 text-base"
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Set what counts as a real signal
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
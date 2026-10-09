
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import {
  ArrowRight,
  Compass,
  Footprints,
  GitBranch,
  Loader2,
} from 'lucide-react';

import { $progress } from '@/lib/stores/progress';
import { $programState } from '@/lib/stores/program-state';
import { getMissionForNode } from '@/program/index';
import { PageShell } from '@/components/layout/PageShell';

const missions = [
  {
    number: '01',
    title: 'Move Before Ready',
    description: 'Learn to act even when you feel uncertain.',
  },
  {
    number: '02',
    title: 'See What Others Miss',
    description: 'Spot problems and discover opportunities worth exploring.',
  },
  {
    number: '03',
    title: 'Put It to the Test',
    description: 'Find out whether people actually want what you might offer.',
  },
  {
    number: '04',
    title: 'Make the Business Work',
    description: 'Work out how to create value and make money.',
  },
  {
    number: '05',
    title: 'Build the Machine',
    description: 'Build your solution, test it, and find your first users.',
  },
  {
    number: '06',
    title: 'Run, Learn and Decide',
    description: 'Learn from real results and decide what comes next.',
  },
];

export default function ProgramRootPage() {
  const router = useRouter();
  const progress = useStore($progress);
  const programState = useStore($programState);

  const isHydrated = progress.isHydrated && programState.isHydrated;

  const hasProgress =
    progress.completedNodes.size > 0 &&
    Boolean(programState.currentNodeKey);

  const activeMission = hasProgress && programState.currentNodeKey
    ? getMissionForNode(programState.currentNodeKey)
    : undefined;

  useEffect(() => {
    if (isHydrated && activeMission) {
      router.replace(`/program/mission/${activeMission.key}`);
    }
  }, [isHydrated, activeMission, router]);

  // Wait until both stores have finished hydrating.
  if (!isHydrated) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // Returning users go directly to their active mission.
  if (activeMission) {
    return null;
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl space-y-14 py-8 sm:py-12">
        {/* Welcome */}
        <section className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Welcome to Urge
          </p>

          <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            You don&apos;t have to be ready to begin.
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Most people wait until they feel completely ready before they
            start. Urge takes a different approach. Over six missions,
            you&apos;ll explore possibilities, take action, and learn from
            what actually happens.
          </p>
        </section>

        {/* How Urge works */}
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              A guided exploration, not a prescribed path.
            </h2>

            <p className="max-w-3xl leading-7 text-muted-foreground">
              Urge isn&apos;t here to tell you what business to start or
              give you a formula to follow. It&apos;s designed to help you
              explore, find your own answers, and decide what to do next.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-5 sm:p-6">
            <div className="grid gap-7 sm:grid-cols-3 sm:gap-5">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Compass className="h-5 w-5" />
                </div>

                <h3 className="font-semibold">Explore</h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  Work through guided questions and exercises to understand
                  your situation and make decisions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Footprints className="h-5 w-5" />
                </div>

                <h3 className="font-semibold">
                  Take action in the real world
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  Talk to people, test assumptions and try things outside
                  the app. You learn by doing, not just reading.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GitBranch className="h-5 w-5" />
                </div>

                <h3 className="font-semibold">
                  Learn and choose your next move
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  Use what actually happens to decide whether to continue,
                  change direction or revisit an earlier step.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission journey */}
        <section className="space-y-5">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Your journey, in six missions.
            </h2>

            <p className="max-w-3xl leading-7 text-muted-foreground">
              Each mission builds on what you&apos;ve learned. You don&apos;t
              need to know all the answers before you start.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission) => (
              <div
                key={mission.number}
                className="flex min-h-36 flex-col gap-3 rounded-2xl border border-border p-5 transition-colors hover:border-primary/40"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-primary">
                  MISSION {mission.number}
                </p>

                <h3 className="text-lg font-semibold leading-snug">
                  {mission.title}
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                  {mission.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Reassurance */}
        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            You don&apos;t need an idea to begin.
          </h2>

          <p className="max-w-3xl leading-7 text-muted-foreground">
            Bring your curiosity and willingness to explore. Your findings
            may change your direction, and that&apos;s part of the process.
          </p>
        </section>

        {/* Primary action, aligned right */}
        <div className="flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Start where you are. Figure out the next step as you go.
          </p>

          <Link
            href="/program/mission/mission-1"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-end rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Start Mission 1
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

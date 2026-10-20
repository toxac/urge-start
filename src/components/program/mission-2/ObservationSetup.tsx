
'use client';

import { ArrowRight, Lightbulb, MapPin, TrendingUp, UserRound, UsersRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const observationAreas = [
  {
    title: 'Your everyday life',
    description:
      'Frustrations, wasted time, unnecessary effort, and things that cost more than they should.',
    icon: UserRound,
  },
  {
    title: 'Other people',
    description:
      'What friends, family, colleagues, or customers struggle with.',
    icon: UsersRound,
  },
  {
    title: 'Places you know',
    description:
      'What could work better in your neighbourhood, workplace, or community.',
    icon: MapPin,
  },
  {
    title: "What's changing",
    description:
      'New habits, technologies, and unmet needs in existing markets.',
    icon: TrendingUp,
  },
];

export function ObservationSetup({
  onComplete,
}: NodeComponentProps) {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mx-auto w-full max-w-4xl space-y-10 pb-8">
        {/* Opening */}
        <header className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF502F]">
            MISSION 2 · NOTICE PROBLEMS
          </p>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Become a problem spotter.
          </h1>

          <p className="text-xl leading-relaxed text-muted-foreground">
            You don't need a brilliant idea. You need to notice what others
            overlook.
          </p>
        </header>

        {/* Why problems matter */}
        <section className="flex gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FF502F]/10">
            <Lightbulb className="size-6 text-[#FF502F]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Every business starts with a problem.
            </h2>

            <p className="text-base leading-7 text-muted-foreground">
              Someone has a frustration, a need, or something they wish worked
              better. A business becomes possible when someone solves a
              problem that matters enough for people to pay for the solution.
            </p>

            <p className="text-base leading-7 text-muted-foreground">
              Your first job isn't to invent a solution. It's to get better at
              seeing the problems that are already there.
            </p>
          </div>
        </section>

        {/* Where to look */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Where should you look?
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Start with yourself, then look beyond your own experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {observationAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.title}
                  className="flex h-full gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-[#FF502F]/50 sm:p-5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon
                      className="size-5 text-foreground"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-semibold">{area.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {area.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* The challenge */}
        <section className="relative overflow-hidden rounded-2xl border border-[#FF502F]/30 bg-[#FF502F]/[0.05] p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 size-40 rounded-full bg-[#FF502F]/[0.07] blur-2xl"
          />

          <div className="relative space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FF502F]">
              Your challenge
            </p>

            <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
              How many problems can you notice?
            </h2>

            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Spend the next week paying attention. Capture what you notice.
              Don't judge it, try to solve it, or decide whether it could
              become a business. Not yet.
            </p>

            <div className="flex items-start gap-3 pt-2">
              <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FF502F]/15">
                <span className="size-2 rounded-full bg-[#FF502F]" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                A sentence is enough to start. You can add details as you learn
                more.
              </p>
            </div>
          </div>
        </section>

        {/* Continue */}
        <footer className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            You don't need to find the perfect problem. Just start paying
            attention.
          </p>

          <Button
            onClick={() => onComplete({ completed: true })}
            className="h-12 shrink-0 gap-2 rounded-full bg-[#FF502F] px-7 text-base text-white shadow-sm hover:bg-[#E94728]"
          >
            Let's begin
            <ArrowRight className="size-5" />
          </Button>
        </footer>
      </div>
    </div>
  );
}

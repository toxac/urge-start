import Link from 'next/link';
import {
  ArrowRight,
  Compass,
} from 'lucide-react';

import type { UserProfile } from '@/lib/stores/profile-store';

interface DashboardProps {
  profile: UserProfile | null;
}

const missions = [
  {
    number: '01',
    title: 'Move Before Ready',
    description:
      'Build the capacity to act before you feel ready.',
  },
  {
    number: '02',
    title: 'See What Others Miss',
    description:
      'Find a problem worth doing something about.',
  },
  {
    number: '03',
    title: 'Put It to the Test',
    description:
      'Take your opportunity to the real world.',
  },
  {
    number: '04',
    title: 'Make the Business Work',
    description:
      'Work out how the business can make money.',
  },
  {
    number: '05',
    title: 'Build the Machine',
    description:
      'Build the simplest system that can deliver.',
  },
  {
    number: '06',
    title: 'Run the Business',
    description:
      'Operate, learn and decide what happens next.',
  },
];

export function Dashboard({
  profile,
}: DashboardProps) {
  const firstName =
    profile?.display_name?.split(' ')[0] ||
    profile?.username ||
    'there';

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
          Your Urge journey
        </p>

        <h1 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
          Hey, {firstName}.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          You don't need to have everything figured out.
          You just need somewhere to start.
        </p>
      </header>

      <section className="mt-14 border-y border-border py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              Start here
            </p>

            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight">
              Move Before Ready
            </h2>

            <p className="mt-3 leading-7 text-muted-foreground">
              The first mission isn't about finding the
              perfect idea. It's about noticing what gets
              in the way of acting — and doing something
              about it.
            </p>
          </div>

          <Link
            href="/program"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              The journey
            </p>

            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight">
              Six missions. One real journey.
            </h2>
          </div>
        </div>

        <div className="mt-8 divide-y divide-border border-y border-border">
          {missions.map((mission) => (
            <div
              key={mission.number}
              className="flex gap-5 py-6 sm:gap-8"
            >
              <span className="shrink-0 pt-1 text-sm font-medium text-muted-foreground">
                {mission.number}
              </span>

              <div>
                <h3 className="font-heading text-lg font-semibold">
                  {mission.title}
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {mission.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 pb-16">
        <div className="flex items-start gap-4">
          <Compass className="mt-1 h-5 w-5 shrink-0 text-primary" />

          <div>
            <h2 className="font-heading text-lg font-semibold">
              Don't worry about finishing everything.
            </h2>

            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
              Urge is meant to be lived, not completed as
              quickly as possible. Do the work. Go outside
              the app. Come back when you have something to
              bring with you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
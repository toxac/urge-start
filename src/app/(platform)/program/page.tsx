'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { $progress } from '@/lib/stores/progress';
import { $programState } from '@/lib/stores/program-state';
import { getMissionForNode } from '@/program/index';
import { PageShell } from '@/components/layout/PageShell';

export default function ProgramRootPage() {
  const router = useRouter();
  const progress = useStore($progress);
  const programState = useStore($programState);

  // 1. Wait for layout hydration
  if (!progress.isHydrated || !programState.isHydrated) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // 2. If they have progress, route them directly to their active mission
  if (progress.completedNodes.size > 0 && programState.currentNodeKey) {
    const activeMission = getMissionForNode(programState.currentNodeKey);
    if (activeMission) {
      router.replace(`/program/mission/${activeMission.key}`);
      return null;
    }
  }

  // 3. If zero progress, show the Welcome state
  return (
    <PageShell>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Welcome to Urge.
        </h1>
        
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Most people wait until they feel completely ready before they start. 
          We are going to do something different. Over the next six missions, you are going to 
          take what you have, put it in front of people, and learn from what actually happens.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          You don't need a business idea to begin. You just need to start.
        </p>

        <div className="mt-10">
          <Link
            href="/program/mission/mission-1"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Start Mission 1
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
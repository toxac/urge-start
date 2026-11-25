'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import {
  ArrowRight,
  Award,
  CalendarCheck,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import { updateUserProjectMetadata } from '@/actions/projects';
import { saveUserTasks } from '@/actions/tasks';
import type { CrossroadsChoice } from './OperateCrossroadsDecision';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const STATUS_BY_CHOICE: Record<CrossroadsChoice, string> = {
  keep_steady: 'operating_steady',
  scale_up: 'scaling',
  pivot: 'pivoting',
  close_cleanly: 'closed',
};

export function Mission6Action({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const router = useRouter();
  const project = useStore($activeProject);

  const [joinStandups, setJoinStandups] = useState(true);
  const [shareStoryInForum, setShareStoryInForum] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const crossroads = project?.metadata?.crossroadsDecision as
    | { choice?: CrossroadsChoice; reason?: string }
    | undefined;
  const choice: CrossroadsChoice = crossroads?.choice ?? 'keep_steady';

  const scorecard = project?.metadata?.operatingScorecard as
    | { next30DayFocus?: string }
    | undefined;

  const isContinuingBusiness =
    choice === 'keep_steady' || choice === 'scale_up';

  async function handleCompleteProgram() {
    if (finishing) return;
    setFinishing(true);

    try {
      if (project) {
        const updated = await updateUserProjectMetadata(project.id, {
          status: STATUS_BY_CHOICE[choice],
          programCompletedAt: new Date().toISOString(),
          alumniPreferences: {
            biMonthlyStandups: isContinuingBusiness && joinStandups,
            shareInForum: shareStoryInForum,
          },
        });
        projectsActions.upsertProject(updated);
      }

      const nextTasks: Array<{
        title: string;
        task_type: 'practice';
        source_node_key: string;
        description: string;
      }> = [];

      if (scorecard?.next30DayFocus) {
        nextTasks.push({
          title: `Next 30-Day Focus: ${scorecard.next30DayFocus}`,
          task_type: 'practice',
          source_node_key: nodeKey,
          description: 'Post-Program Operating Priority',
        });
      }

      if (shareStoryInForum) {
        nextTasks.push({
          title:
            'Post a short recap of what you built and learned in the Urge Forum so other founders can learn from your journey',
          task_type: 'practice',
          source_node_key: nodeKey,
          description: 'Urge Alumni Knowledge Share',
        });
      }

      if (isContinuingBusiness && joinStandups) {
        nextTasks.push({
          title:
            'RSVP for the next Urge Bi-Monthly Founder Standup to review your operating metrics',
          task_type: 'practice',
          source_node_key: nodeKey,
          description: 'Ongoing Operator Support',
        });
      }

      if (nextTasks.length > 0) {
        await saveUserTasks(nextTasks);
      }

      await onComplete({
        completed: true,
        crossroadsChoice: choice,
        programCompleted: true,
      });

      if (isContinuingBusiness) {
        router.push('/program/operate');
      } else if (choice === 'pivot') {
        router.push('/program/build');
      } else {
        router.push('/program');
      }
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Award className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Program Graduation · What Comes Next
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          You completed the Urge program.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          You took an idea from raw observation to a priced offer, built v1,
          tested it with real customers, and ran it on real operating numbers.
          The structured curriculum ends here—your founder network stays open.
        </p>
      </div>

      {/* Ongoing Urge Alumni & Operator Support Card */}
      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-base font-bold text-foreground">
              Stay connected as an Urge Founder
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Your Operate Copilot, Build Workspace, community resources, and
            Urge events remain accessible as you grow.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-2 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>Urge Forum &amp; Founder Network</span>
            </div>
            <p className="leading-5 text-muted-foreground">
              Participate in discussions, swap notes with builders in your
              category, and help newer founders learn from your real-world
              experience.
            </p>
            <label className="flex items-center gap-2 pt-1 font-semibold text-foreground">
              <input
                type="checkbox"
                checked={shareStoryInForum}
                onChange={(e) => setShareStoryInForum(e.target.checked)}
              />
              Add a task to share my journey in the forum
            </label>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <span>Bi-Monthly Operator Standups &amp; Events</span>
            </div>
            <p className="leading-5 text-muted-foreground">
              Continuing with your business? Join our bi-monthly founder
              standups for ongoing accountability, plus full access to Urge
              events and resource playbooks.
            </p>
            {isContinuingBusiness && (
              <label className="flex items-center gap-2 pt-1 font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={joinStandups}
                  onChange={(e) => setJoinStandups(e.target.checked)}
                />
                Include me in bi-monthly operator standups
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <MessageSquareHeart className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Selected path:{' '}
            <strong className="uppercase text-foreground">
              {choice.replace(/_/g, ' ')}
            </strong>{' '}
            — your workspace and next 30-day actions are ready.
          </span>
        </div>
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleCompleteProgram()}
          disabled={finishing}
          className="h-12 rounded-full px-8 text-base"
        >
          {finishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizing graduation…
            </>
          ) : (
            <>
              {isContinuingBusiness
                ? 'Finish Program & Return to Operate Copilot'
                : 'Finish Program & Save Next Steps'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
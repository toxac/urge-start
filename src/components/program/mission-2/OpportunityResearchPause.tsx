'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import { saveUserTasks } from '@/actions/tasks';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ResearchPausePayload = {
  completed?: boolean;
  researchNotes?: string | null;
};

export function OpportunityResearchPause({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as ResearchPausePayload;

  const [task, setTask] = useState('');
  const [researchNotes, setResearchNotes] = useState(
    typeof saved.researchNotes === 'string' ? saved.researchNotes : '',
  );
  const [savingTask, setSavingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTask = async () => {
    if (!task.trim() || savingTask) return;
    setSavingTask(true);
    setError(null);
    try {
      await saveUserTasks([
        {
          title: task.trim(),
          task_type: 'practice',
          source_node_key: nodeKey,
          description:
            'Community or competitor research before locking in an opportunity.',
        },
      ]);
      setTask('');
      setTaskSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save this task.',
      );
    } finally {
      setSavingTask(false);
    }
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete({
        completed: true,
        researchNotes: researchNotes.trim() || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your notes.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Clock className="h-5 w-5" />
          <span>Recommended: Take 24 to 48 Hours</span>
        </div>
        <p className="text-base leading-7 text-muted-foreground">
          You are about to pick the project you will test with real people for
          weeks. Do not make this choice on impulse. Sleep on it. Look at
          communities where people discuss these problems.
        </p>

        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          <div className="space-y-1 rounded-xl bg-muted/40 p-4 text-xs">
            <p className="font-semibold text-foreground">
              1. Subreddits &amp; Groups
            </p>
            <p className="text-muted-foreground">
              Search reddit or Facebook groups for angry rants about the
              problem.
            </p>
          </div>
          <div className="space-y-1 rounded-xl bg-muted/40 p-4 text-xs">
            <p className="font-semibold text-foreground">2. 1-Star Reviews</p>
            <p className="text-muted-foreground">
              Read negative reviews of current tools or competitors on
              Trustpilot/App Store.
            </p>
          </div>
          <div className="space-y-1 rounded-xl bg-muted/40 p-4 text-xs">
            <p className="font-semibold text-foreground">3. Search Intent</p>
            <p className="text-muted-foreground">
              Check what Google suggests when you type &quot;how to fix...&quot; or
              &quot;alternative to...&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Task Add */}
      <div className="max-w-3xl space-y-3 rounded-2xl border border-border p-6">
        <label className="text-sm font-semibold">
          Add a research task to your list (Optional)
        </label>
        <div className="flex gap-2">
          <input
            value={task}
            onChange={(e) => {
              setTask(e.target.value);
              setTaskSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && task.trim()) {
                e.preventDefault();
                void handleAddTask();
              }
            }}
            placeholder="e.g. Read top 20 posts on r/smallbusiness about invoicing headaches"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm"
            disabled={savingTask || isSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleAddTask()}
            disabled={savingTask || isSubmitting || !task.trim()}
          >
            {savingTask ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 h-4 w-4" />
            )}
            Add task
          </Button>
        </div>
        {taskSaved && (
          <p role="status" className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Task saved to your dashboard.
          </p>
        )}
      </div>

      <div className="max-w-3xl space-y-3">
        <label className="text-sm font-semibold">
          What did you notice from your search? (Optional)
        </label>
        <SpeechTextarea
          rows={4}
          value={researchNotes}
          onChange={(e) => setResearchNotes(e.target.value)}
          placeholder="Jot down any surprising phrases, complaints, or alternatives people mentioned online..."
          className="w-full rounded-2xl border border-border bg-background p-4 text-base leading-7"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={isSubmitting}
          className="h-12 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Ready to review the journey
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
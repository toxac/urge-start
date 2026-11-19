'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { saveUserTasks } from '@/actions/tasks';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ConversationActionPayload = {
  completed?: boolean;
  unansweredQuestion?: string | null;
  followUpTaskCreated?: boolean;
  followUpTaskTitle?: string | null;
  opportunityId?: string | null;
};

export function ConversationAction({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as ConversationActionPayload;

  const [opps, setOpps] = useState<UserOpportunity[]>([]);
  const [opportunityId, setOpportunityId] = useState<string>(
    typeof saved.opportunityId === 'string' ? saved.opportunityId : '',
  );
  const [question, setQuestion] = useState(
    typeof saved.unansweredQuestion === 'string' ? saved.unansweredQuestion : '',
  );
  const [task, setTask] = useState(
    typeof saved.followUpTaskTitle === 'string' ? saved.followUpTaskTitle : '',
  );
  const [persistedTaskTitle, setPersistedTaskTitle] = useState<string>(
    typeof saved.followUpTaskTitle === 'string'
      ? saved.followUpTaskTitle.trim()
      : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchUserOpportunities()
      .then((rows) => {
        if (alive) setOpps(rows);
      })
      .catch(() => {
        // Optional selector; ignore if opportunities fail to load
      });
    return () => {
      alive = false;
    };
  }, []);

  async function finish() {
    if (saving) return;
    setSaving(true);
    setError('');

    const trimmedTask = task.trim();
    const trimmedQuestion = question.trim();

    try {
      // Only create a new user_tasks row if there is a non-empty task title
      // that has not already been persisted on an earlier visit.
      if (trimmedTask && trimmedTask !== persistedTaskTitle) {
        await saveUserTasks([
          {
            title: trimmedTask,
            description: trimmedQuestion || undefined,
            task_type: 'venture',
            source_node_key: nodeKey,
            metadata: {
              source: 'mission-2-quest-2',
              ...(opportunityId ? { opportunity_id: opportunityId } : {}),
            },
          },
        ]);
        setPersistedTaskTitle(trimmedTask);
      }

      await onComplete({
        completed: true,
        unansweredQuestion: trimmedQuestion || null,
        followUpTaskCreated: Boolean(trimmedTask),
        followUpTaskTitle: trimmedTask || null,
        opportunityId: opportunityId || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save follow-up.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <section className="max-w-3xl space-y-5 rounded-2xl border p-5">
        {opps.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Which opportunity is this about?{' '}
              <span className="font-normal text-muted-foreground">Optional</span>
            </label>
            <select
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              className="w-full rounded-lg border bg-background p-3 text-sm"
            >
              <option value="">All or general</option>
              {opps.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            What are you still curious about?{' '}
            <span className="font-normal text-muted-foreground">Optional</span>
          </label>
          <SpeechTextarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-lg border bg-background p-3"
            placeholder="A question you want to explore next…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            A follow-up to remember{' '}
            <span className="font-normal text-muted-foreground">Optional</span>
          </label>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full rounded-lg border bg-background p-3"
            placeholder="e.g. Speak to two more people"
          />
          {persistedTaskTitle && task.trim() === persistedTaskTitle && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              Saved to your tasks
            </p>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void finish()}
          disabled={saving}
          className="rounded-full px-6"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
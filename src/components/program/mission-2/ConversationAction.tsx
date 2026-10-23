'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveUserTasks } from '@/actions/tasks';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function ConversationAction({ node, nodeKey, onComplete }: NodeComponentProps) {
  const [question, setQuestion] = useState('');
  const [task, setTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    setSaving(true);
    setError('');
    try {
      if (task.trim())
        await saveUserTasks([
          {
            title: task.trim(),
            description: question.trim() || undefined,
            task_type: 'venture',
            source_node_key: nodeKey,
            metadata: { source: 'mission-2-quest-2' },
          },
        ]);
      await onComplete({
        completed: true,
        unansweredQuestion: question.trim() || null,
        followUpTaskCreated: Boolean(task.trim()),
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
        <div className="space-y-2">
          <label className="text-sm font-medium">
            What are you still curious about?{' '}
            <span className="font-normal text-muted-foreground">Optional</span>
          </label>
          <textarea
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
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={finish} disabled={saving} className="rounded-full px-6">
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
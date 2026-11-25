'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Check, FlaskConical, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  $userExperiments,
  userExperimentsActions,
} from '@/lib/stores/experiments';
import { updateOpsTaskStatus } from '@/actions/ops';
import { saveUserExperimentReflection } from '@/actions/experiments';
import type { OpsTaskSummary } from '@/lib/types/ops';
import type { UserExperiment } from '@/lib/types/experiments';

type OpsExecutionSidebarProps = {
  tasks: OpsTaskSummary[];
  loadingTasks: boolean;
  onTasksChange: React.Dispatch<React.SetStateAction<OpsTaskSummary[]>>;
};

export function OpsExecutionSidebar({
  tasks,
  loadingTasks,
  onTasksChange,
}: OpsExecutionSidebarProps) {
  const userExpsState = useStore($userExperiments);

  const [reflectingExpId, setReflectingExpId] = useState<string | null>(null);
  const [workedChoice, setWorkedChoice] = useState<'yes' | 'partially' | 'no'>(
    'yes',
  );
  const [howItWorked, setHowItWorked] = useState('');
  const [nextMove, setNextMove] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);

  const opsExperiments: UserExperiment[] = useMemo(() => {
    return userExpsState.allIds
      .map((id) => userExpsState.byId[id])
      .filter(
        (e): e is UserExperiment =>
          Boolean(e) && e.experiment_key === 'ops_hypothesis_test',
      );
  }, [userExpsState]);

  async function handleToggleTask(task: OpsTaskSummary) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    onTasksChange((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    );
    await updateOpsTaskStatus(task.id, nextStatus);
  }

  async function handleSaveReflection(exp: UserExperiment) {
    if (savingReflection || !howItWorked.trim()) return;
    setSavingReflection(true);
    try {
      const updated = await saveUserExperimentReflection(
        exp.id,
        {
          ...exp.reflection,
          worked: workedChoice,
          how_it_worked: howItWorked.trim(),
          next_move: nextMove.trim() || undefined,
        },
        { markCompleted: true },
      );
      userExperimentsActions.upsert(updated);
      setReflectingExpId(null);
      setHowItWorked('');
      setNextMove('');
    } finally {
      setSavingReflection(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hypothesis Experiments (Reflection-Only) */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Hypothesis Tests ({opsExperiments.length})
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Outcomes are read from your uploaded Sales &amp; Traffic data. Log
          your reflection once the test window ends.
        </p>

        {opsExperiments.length === 0 ? (
          <p className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground">
            No operating hypothesis tests running yet.
          </p>
        ) : (
          <div className="space-y-3">
            {opsExperiments.map((exp) => {
              const isReflecting = reflectingExpId === exp.id;
              return (
                <div
                  key={exp.id}
                  className="space-y-2.5 rounded-xl border border-border bg-background p-4 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {exp.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        exp.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>

                  {exp.setup?.pitch?.direction && (
                    <p className="text-muted-foreground">
                      <strong>Hypothesis:</strong> {exp.setup.pitch.direction}
                    </p>
                  )}

                  {exp.status === 'completed' ? (
                    <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                      <p className="font-semibold text-foreground">
                        Worked?{' '}
                        <span className="uppercase text-primary">
                          {exp.reflection?.worked ?? 'logged'}
                        </span>
                      </p>
                      {exp.reflection?.how_it_worked && (
                        <p className="text-muted-foreground">
                          {exp.reflection.how_it_worked}
                        </p>
                      )}
                    </div>
                  ) : isReflecting ? (
                    <div className="space-y-2.5 border-t border-border pt-3">
                      <div className="flex gap-2">
                        {(['yes', 'partially', 'no'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setWorkedChoice(opt)}
                            className={`rounded-full px-3 py-1 font-semibold capitalize ${
                              workedChoice === opt
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={howItWorked}
                        onChange={(e) => setHowItWorked(e.target.value)}
                        placeholder="How did it work based on your data?"
                        className="w-full rounded-lg border border-border bg-card p-2 text-xs"
                      />
                      <input
                        type="text"
                        value={nextMove}
                        onChange={(e) => setNextMove(e.target.value)}
                        placeholder="Keep, tweak, or drop next?"
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingReflection || !howItWorked.trim()}
                          onClick={() => void handleSaveReflection(exp)}
                        >
                          Save Reflection
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setReflectingExpId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReflectingExpId(exp.id);
                        setWorkedChoice('yes');
                        setHowItWorked('');
                        setNextMove('');
                      }}
                    >
                      Log Reflection &amp; Close Test
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Execution Tasks */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Execution Tasks (
            {tasks.filter((t) => t.status !== 'completed').length} open)
          </h2>
        </div>

        {loadingTasks ? (
          <p className="text-xs text-muted-foreground">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-xl bg-muted/30 p-4 text-xs text-muted-foreground">
            No tasks yet. Route fixes from any planner into your task list.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 15).map((task) => {
              const done = task.status === 'completed';
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => void handleToggleTask(task)}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-border/70 bg-background p-3 text-left text-xs"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {done && <Check className="h-3 w-3" />}
                  </span>
                  <span
                    className={
                      done
                        ? 'text-muted-foreground line-through'
                        : 'font-medium text-foreground'
                    }
                  >
                    {task.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
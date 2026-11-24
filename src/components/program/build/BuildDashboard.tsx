'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  Layers,
  Loader2,
  Megaphone,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  updateProjectBuild,
  upsertProjectBuild,
} from '@/actions/builds';
import { projectsActions } from '@/lib/stores/projects';
import type { UserProject, UserProjectOffer } from '@/lib/types/projects';
import type {
  MspBuildRequirement,
  UserProjectBuild,
} from '@/lib/types/builds';

type BuildDashboardProps = {
  initialProject: UserProject | null;
  initialOffer: UserProjectOffer | null;
  initialBuild: UserProjectBuild | null;
  allBuilds: UserProjectBuild[];
  warmLeadsCount: number;
  m1Constraints: {
    weeklyHours?: string;
    budgetCap?: string;
    incomeGoal?: string;
  };
};

const CATEGORY_META: Record<
  MspBuildRequirement['category'],
  { label: string; badgeClass: string }
> = {
  product_req: {
    label: 'Product',
    badgeClass: 'bg-primary/10 text-primary',
  },
  marketing_pipeline: {
    label: 'Marketing & Sales',
    badgeClass: 'bg-emerald-500/10 text-emerald-700',
  },
  branding_trust: {
    label: 'Branding & Copy',
    badgeClass: 'bg-violet-500/10 text-violet-700',
  },
  payment_ops: {
    label: 'Payments & Admin',
    badgeClass: 'bg-amber-500/10 text-amber-700',
  },
};

export function BuildDashboard({
  initialProject,
  initialOffer,
  initialBuild,
  allBuilds,
  warmLeadsCount,
  m1Constraints,
}: BuildDashboardProps) {
  const router = useRouter();

  const [builds, setBuilds] = useState<UserProjectBuild[]>(allBuilds);
  const [activeBuild, setActiveBuild] = useState<UserProjectBuild | null>(
    initialBuild,
  );
  const [tasks, setTasks] = useState<MspBuildRequirement[]>(
    initialBuild?.requirements ??
      initialProject?.metadata?.mspRequirements ??
      [],
  );
  const [activeFilter, setActiveFilter] = useState<
    'all' | MspBuildRequirement['category']
  >('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] =
    useState<MspBuildRequirement['category']>('product_req');

  const [savingTask, setSavingTask] = useState(false);
  const [completingBuild, setCompletingBuild] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const econ = initialProject?.metadata?.economics;
  const currency =
    initialOffer?.metadata?.currency ?? econ?.currency ?? '₹';
  const price =
    initialOffer?.metadata?.price_point ?? econ?.pricePerUnit ?? 0;

  const completedCount = tasks.filter((t) => t.done).length;
  const visibleTasks =
    activeFilter === 'all'
      ? tasks
      : tasks.filter((t) => t.category === activeFilter);

  async function ensureBuildRow(
    nextTasks: MspBuildRequirement[],
  ): Promise<UserProjectBuild | null> {
    if (!initialProject) return null;

    if (activeBuild) {
      const updated = await updateProjectBuild(activeBuild.id, {
        requirements: nextTasks,
      });
      setActiveBuild(updated);
      setBuilds((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      projectsActions.upsertBuild(updated);
      return updated;
    }

    const { build: created, project: updatedProj } = await upsertProjectBuild({
      projectId: initialProject.id,
      offerId: initialOffer?.id ?? null,
      versionNumber: 1,
      versionLabel: 'v1.0',
      title: initialOffer?.title
        ? `${initialOffer.title} (v1.0)`
        : `${initialProject.title} v1.0 Build`,
      status: 'building',
      requirements: nextTasks,
      setAsActive: true,
    });

    setActiveBuild(created);
    setBuilds([created, ...builds]);
    projectsActions.upsertBuild(created);
    if (updatedProj) projectsActions.upsertProject(updatedProj);
    return created;
  }

  async function persistTasks(nextTasks: MspBuildRequirement[]) {
    if (!initialProject) return;
    setSavingTask(true);
    setError(null);
    try {
      await ensureBuildRow(nextTasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save task update.',
      );
    } finally {
      setSavingTask(false);
    }
  }

  async function handleToggleTask(id: string) {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(next);
    await persistTasks(next);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: MspBuildRequirement = {
      id: `req_${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      done: false,
    };
    const next = [item, ...tasks];
    setTasks(next);
    setNewTaskTitle('');
    await persistTasks(next);
  }

  async function handleDeleteTask(id: string) {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    await persistTasks(next);
  }

  async function handleBuildComplete() {
    if (completingBuild) return;
    setCompletingBuild(true);
    setError(null);

    try {
      const ensured = await ensureBuildRow(tasks);
      if (ensured) {
        const finished = await updateProjectBuild(ensured.id, {
          requirements: tasks,
          status: 'alpha_testing',
          buildCompletedAt: new Date().toISOString(),
        });
        setActiveBuild(finished);
        projectsActions.upsertBuild(finished);
      }

      router.push('/program?mission=mission-5&node=m5-q1-build&buildComplete=1');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not mark build complete.',
      );
      setCompletingBuild(false);
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Workspace Header & Milestone CTA */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {activeBuild?.version_label ?? 'v1.0'}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {activeBuild?.status?.replace(/_/g, ' ') ?? 'Building'}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {activeBuild?.title ??
              initialProject?.title ??
              'Your Minimum Sellable Product'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {initialOffer
              ? `${initialOffer.title} · ${currency}${price.toLocaleString()}`
              : 'Work across product, marketing, payments, and tracking in any order.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {builds.length > 1 && (
            <select
              value={activeBuild?.id ?? ''}
              onChange={(e) => {
                const chosen = builds.find((b) => b.id === e.target.value);
                if (chosen) {
                  setActiveBuild(chosen);
                  setTasks(chosen.requirements ?? []);
                }
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
            >
              {builds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.version_label} · {b.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )}

          <div className="rounded-xl bg-muted/50 px-4 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              Build Checklist
            </p>
            <p className="text-sm font-bold text-foreground">
              {completedCount} / {tasks.length} done
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void handleBuildComplete()}
            disabled={completingBuild}
            className="h-11 rounded-full px-6 text-sm font-semibold"
          >
            {completingBuild ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating progress…
              </>
            ) : (
              <>
                Build complete — ready to test
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Main Split: Integrated Build Tasks (Left) + 4 Modular Widgets (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Integrated Task Board */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Build Tasks ({activeBuild?.version_label ?? 'v1.0'})
              </h2>
            </div>
            {savingTask && (
              <span className="text-xs text-muted-foreground">Saving…</span>
            )}
          </div>

          {/* Track Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', 'All'],
                ['product_req', 'Product'],
                ['marketing_pipeline', 'Marketing'],
                ['branding_trust', 'Branding'],
                ['payment_ops', 'Admin & Pay'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFilter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Quick Add Task */}
          <form onSubmit={(e) => void handleAddTask(e)} className="space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a build task…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newTaskCategory}
                onChange={(e) =>
                  setNewTaskCategory(
                    e.target.value as MspBuildRequirement['category'],
                  )
                }
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
              >
                <option value="product_req">Product</option>
                <option value="marketing_pipeline">Marketing &amp; Sales</option>
                <option value="branding_trust">Branding &amp; Copy</option>
                <option value="payment_ops">Payments &amp; Admin</option>
              </select>
              <Button
                type="submit"
                size="sm"
                disabled={!newTaskTitle.trim() || savingTask}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </form>

          {/* Task List */}
          <div className="space-y-2">
            {visibleTasks.length === 0 ? (
              <p className="rounded-xl bg-muted/30 py-8 text-center text-xs text-muted-foreground">
                No tasks in this view yet.
              </p>
            ) : (
              visibleTasks.map((task) => {
                const meta = CATEGORY_META[task.category];
                return (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background p-3 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => void handleToggleTask(task.id)}
                      className="flex flex-1 items-start gap-2.5 text-left"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          task.done
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border'
                        }`}
                      >
                        {task.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="space-y-1">
                        <span
                          className={`block leading-5 ${
                            task.done
                              ? 'text-muted-foreground line-through'
                              : 'font-medium text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteTask(task.id)}
                      aria-label="Delete task"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Modular Placeholder Widgets Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
          {/* Widget 1: Product */}
          <section className="flex flex-col justify-between space-y-4 rounded-2xl border border-dashed border-border bg-card p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Package className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Product &amp; Delivery
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Widget Placeholder
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                v1 Scope:{' '}
                {initialOffer?.metadata?.included_summary ||
                  'Defined in Mission 4'}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Future module: v1 deliverable checklist, prototype/staging URL,
                and scope-creep guardrails from your Mission 4 cut list.
              </p>
            </div>
          </section>

          {/* Widget 2: Marketing & Sales */}
          <section className="flex flex-col justify-between space-y-4 rounded-2xl border border-dashed border-border bg-card p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Megaphone className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Marketing &amp; Sales
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Widget Placeholder
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {warmLeadsCount} warm lead{warmLeadsCount === 1 ? '' : 's'}{' '}
                ready for Alpha invite
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Future module: landing page link, winning channel copy, and
                early-buyer pipeline tracker.
              </p>
            </div>
          </section>

          {/* Widget 3: Admin, Payments & Purchases */}
          <section className="flex flex-col justify-between space-y-4 rounded-2xl border border-dashed border-border bg-card p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Payments &amp; Purchases
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Widget Placeholder
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Target Price: {currency}
                {price.toLocaleString()} (
                {(
                  initialOffer?.metadata?.payment_model ??
                  econ?.paymentModel ??
                  'upfront'
                ).replace(/_/g, ' ')}
                )
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Future module: payment link status, tool/supplier purchases, and
                basic legal/invoice readiness.
              </p>
            </div>
          </section>

          {/* Widget 4: Cost & Time Tracking */}
          <section className="flex flex-col justify-between space-y-4 rounded-2xl border border-dashed border-border bg-card p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-700">
                  <Clock className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Cost &amp; Time Tracker
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Widget Placeholder
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Setup Est: {currency}
                {(econ?.oneTimeSetupCosts ?? 0).toLocaleString()} · Cap:{' '}
                {m1Constraints.weeklyHours ||
                  `${econ?.availableWeeklyHours ?? 10}h/wk`}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Future module: log actual build expenses and hours spent against
                your Mission 1 &amp; Mission 4 limits.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
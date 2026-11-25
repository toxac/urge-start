'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchOpsTasks } from '@/actions/ops';
import { OpsBaselineDashboard } from './OpsBaselineDashboard';
import { OpsGapAnalysisWidget } from './OpsGapAnalysisWidget';
import {
  OpsDomainPlannerWidget,
  type PlannerDomain,
} from './OpsDomainPlannerWidget';
import { OpsExecutionSidebar } from './OpsExecutionSidebar';
import type { OpsAnalysisGap, OpsTaskSummary } from '@/lib/types/ops';

export function OperateWorkspace() {
  const [tasks, setTasks] = useState<OpsTaskSummary[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedGap, setSelectedGap] = useState<OpsAnalysisGap | null>(null);
  const [activeDomain, setActiveDomain] = useState<PlannerDomain>('market');

  const refreshTasks = useCallback(async () => {
    try {
      const list = await fetchOpsTasks();
      setTasks(list);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  function handleSelectGap(gap: OpsAnalysisGap) {
    setSelectedGap(gap);
    setActiveDomain(gap.domain);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Deterministic KPI & Baseline Dashboard */}
      <OpsBaselineDashboard />

      {/* 2. Copilot: Gap Analysis */}
      <OpsGapAnalysisWidget
        selectedGapId={selectedGap?.id ?? null}
        onSelectGap={handleSelectGap}
      />

      {/* 3. Modular Functional Unit Planners + Execution Queues */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="flex gap-2">
            {(['market', 'money', 'customer'] as const).map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setActiveDomain(domain)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${
                  activeDomain === domain
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

          <OpsDomainPlannerWidget
            key={activeDomain}
            domain={activeDomain}
            activeGap={
              selectedGap?.domain === activeDomain ? selectedGap : null
            }
            onClearGap={() => setSelectedGap(null)}
            onTaskQueued={() => void refreshTasks()}
          />
        </div>

        <div className="lg:col-span-5">
          <OpsExecutionSidebar
            tasks={tasks}
            loadingTasks={loadingTasks}
            onTasksChange={setTasks}
          />
        </div>
      </div>
    </div>
  );
}
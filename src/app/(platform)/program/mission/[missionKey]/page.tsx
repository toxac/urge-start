'use client';

import { useStore } from '@nanostores/react';
import { Loader2, AlertCircle } from 'lucide-react';

import { $programState } from '@/lib/stores/program-state';
import { getNode, getMissionForNode } from '@/program/index';

import { PageShell } from '@/components/layout/PageShell';
import { ContextRail } from '@/components/layout/ContextRail';
import { NodeRenderer } from '@/components/program/NodeRenderer';

export default function MissionPage() {
  const { isHydrated, currentNodeKey } = useStore($programState);

  // 1. Wait for hydration from the layout
  if (!isHydrated || !currentNodeKey) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // 2. Fetch static node and mission configuration
  const activeNode = getNode(currentNodeKey);
  const mission = getMissionForNode(currentNodeKey);

  if (!activeNode || !mission) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p>Configuration not found for node: <span className="font-mono">{currentNodeKey}</span></p>
        </div>
      </PageShell>
    );
  }

  // 3. Determine Context Rail Content
  const isMissionLevel = activeNode.role === 'setup' || activeNode.role === 'reveal';
  const parentQuest = mission.quests.find((q) => 
    q.nodes.some((n) => n.key === currentNodeKey)
  );

  const contextContent = (
    <ContextRail>
      {isMissionLevel ? (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mission {mission.sequence}
          </div>
          <h3 className="font-heading text-lg font-semibold">{mission.title}</h3>
          <p className="font-medium text-foreground">{mission.question}</p>
          <p className="text-muted-foreground">{mission.description}</p>
        </div>
      ) : parentQuest ? (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {mission.title}
          </div>
          <h3 className="font-heading text-lg font-semibold">{parentQuest.title}</h3>
          <p className="text-muted-foreground">{parentQuest.description}</p>
        </div>
      ) : null}
    </ContextRail>
  );

  // 4. Render the Page Shell with the dynamic context and the active node
  return (
    <PageShell context={contextContent}>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{activeNode.title}</h1>
      </div>

      {/* The NodeRenderer will look up the dummy component and handle completion */}
      <NodeRenderer nodeKey={currentNodeKey} />
    </PageShell>
  );
}
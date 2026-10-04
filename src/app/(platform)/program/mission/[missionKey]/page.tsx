'use client';

import { useStore } from '@nanostores/react';
import { Loader2, AlertCircle } from 'lucide-react';

import { $programState } from '@/lib/stores/program-state';
import { $nodeResources } from '@/lib/stores/resources';
import { getNode, getMissionForNode } from '@/program/index';

import { PageShell } from '@/components/layout/PageShell';
import { ContextRail } from '@/components/layout/ContextRail';
import { NodeRenderer } from '@/components/program/NodeRenderer';
import { NodeResourceGuide } from '@/components/program/NodeResourceGuide';
import { ContextRailResources } from '@/components/program/ContextRailResources';

export default function MissionPage() {
  const { isHydrated, currentNodeKey } = useStore($programState);
  const resources = useStore($nodeResources);

  if (!isHydrated || !currentNodeKey) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

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

  // Filter resources strictly for the active node
  const currentNodeResources = resources.filter((r) => r.node_key === currentNodeKey);
  const keyGuide = currentNodeResources.find((r) => r.role === 'key_guide');
  const railResources = currentNodeResources.filter(
    (r) => r.role === 'supplementary' || r.role === 'ambient'
  );

  // We have removed the mission description block from the ContextRail.
  // It now strictly renders the contextual resources and ambient tracks for the active node.
  const contextContent = railResources.length > 0 ? (
    <ContextRail>
      <ContextRailResources resources={railResources} />
    </ContextRail>
  ) : undefined; // Pass undefined if empty to collapse the right column in PageShell

  return (
    <PageShell context={contextContent}>
      <div className="mb-8 space-y-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{activeNode.title}</h1>
        
        {keyGuide && <NodeResourceGuide resource={keyGuide} />}
      </div>

      <NodeRenderer nodeKey={currentNodeKey} />
    </PageShell>
  );
}
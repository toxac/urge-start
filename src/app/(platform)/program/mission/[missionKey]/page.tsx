'use client';

import { useStore } from '@nanostores/react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

import { $programState, programStateActions } from '@/lib/stores/program-state';
import { $nodeResources } from '@/lib/stores/resources';
import { getNode, getMissionForNode } from '@/program/index';

import { PageShell } from '@/components/layout/PageShell';
import { ContextRail } from '@/components/layout/ContextRail';
import { NodeRenderer } from '@/components/program/NodeRenderer';
import { ContextRailResources } from '@/components/program/ContextRailResources';
import { Button } from '@/components/ui/button';

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

  // 1. Calculate Quest Progress & Labels
  const currentQuestIndex = mission.quests.findIndex((q) => 
    q.nodes.some((n) => n.key === currentNodeKey)
  );
  const totalQuests = mission.quests.length;
  const currentQuest = currentQuestIndex >= 0 ? mission.quests[currentQuestIndex] : null;
  
  let phaseLabel = '';
  // Only label as 'Mission Briefing' if it's a setup node NOT inside a quest
  if (!currentQuest && activeNode.role === 'setup') phaseLabel = 'Mission Briefing';
  else if (!currentQuest && activeNode.role === 'reveal') phaseLabel = 'Mission Debrief';
  else if (currentQuest) phaseLabel = `Quest ${currentQuestIndex + 1} of ${totalQuests}`;

  // 2. Derive the Previous Node for "Back" navigation
  // Your nodes declare their preceding node in the dependencies array (e.g., dependencies: ['m1-setup'])
  const prevNodeKey = activeNode.dependencies?.[0];

  const handleBack = () => {
    if (prevNodeKey) {
      // Instantly switch the active node in the local store
      programStateActions.setCurrentNode(prevNodeKey);
    }
  };

  // 3. Filter Context Rail Resources
  const railResources = resources.filter(
    (r) => r.node_key === currentNodeKey && (r.role === 'supplementary' || r.role === 'ambient')
  );

  const contextContent = railResources.length > 0 ? (
    <ContextRail>
      <ContextRailResources resources={railResources} />
    </ContextRail>
  ) : undefined;

  return (
    <PageShell context={contextContent}>
      
      {/* Global Navigation & Breadcrumbs */}
      <div className="mb-10 space-y-4">
        
        {/* Back Button */}
        {prevNodeKey && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="-ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to previous
          </Button>
        )}

        {/* Universal Progress Scaffold */}
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span>Mission {mission.sequence}</span>
          <span className="text-border">•</span>
          <span className={!currentQuest && (activeNode.role === 'setup' || activeNode.role === 'reveal') ? 'text-primary' : 'text-foreground'}>
            {phaseLabel}
          </span>
          {currentQuest && (
            <>
              <span className="text-border">•</span>
              <span className="text-primary truncate">{currentQuest.title}</span>
            </>
          )}
        </div>
      </div>

      {/* The Node Owns the Rest of the Screen */}
      <NodeRenderer key={currentNodeKey} nodeKey={currentNodeKey} />
    </PageShell>
  );
}
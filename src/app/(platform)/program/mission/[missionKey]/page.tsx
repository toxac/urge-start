'use client';

import { useStore } from '@nanostores/react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

import {
  $programState,
  programStateActions,
} from '@/lib/stores/program-state';

import { $nodeResources } from '@/lib/stores/resources';

import { $progress } from '@/lib/stores/progress';

import {
  getNode,
  getMissionForNode,
} from '@/program/index';

import { PageShell } from '@/components/layout/PageShell';
import { ContextRail } from '@/components/layout/ContextRail';
import { NodeRenderer } from '@/components/program/NodeRenderer';
import { ContextRailResources } from '@/components/program/ContextRailResources';

import { MissionJourneyHeader } from '@/components/layout/program/MissionJourneyHeader';
import { MissionJourneyRail } from '@/components/layout/program/MissionJourneyRail';

import { Button } from '@/components/ui/button';

export default function MissionPage() {
  const {
    isHydrated,
    currentNodeKey,
  } = useStore($programState);

  const resources = useStore($nodeResources);
  const progress = useStore($progress);

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

          <p>
            Configuration not found for node:{' '}
            <span className="font-mono">
              {currentNodeKey}
            </span>
          </p>
        </div>
      </PageShell>
    );
  }

  /*
   * Determine the current quest.
   *
   * Setup/reveal nodes that sit outside a quest will not
   * have a current quest.
   */
  const currentQuestIndex = mission.quests.findIndex((quest) =>
    quest.nodes.some((node) => node.key === currentNodeKey)
  );

  const currentQuest =
    currentQuestIndex >= 0
      ? mission.quests[currentQuestIndex]
      : null;

  /*
   * Previous node is still determined from the node's
   * dependency chain. We are deliberately not changing
   * Back behavior as part of this layout refactor.
   */
  const prevNodeKey = activeNode.dependencies?.[0];

  const handleBack = () => {
    if (prevNodeKey) {
      programStateActions.setCurrentNode(prevNodeKey);
    }
  };

  /*
   * Context resources remain exactly as they were.
   */
  const railResources = resources.filter(
    (resource) =>
      resource.node_key === currentNodeKey &&
      (
        resource.role === 'supplementary' ||
        resource.role === 'ambient'
      )
  );

  const contextContent =
    railResources.length > 0 ? (
      <ContextRail>
        <ContextRailResources resources={railResources} />
      </ContextRail>
    ) : undefined;

  return (
    <PageShell context={contextContent}>
      <div className="w-full space-y-10">

        {/* Mission identity */}
        <MissionJourneyHeader
          nodeKey={currentNodeKey}
        />

        {/* Mission journey */}
        <MissionJourneyRail
          mission={mission}
          currentNodeKey={currentNodeKey}
          completedNodes={progress.completedNodes}
        />



        {/* Current node */}
        <main>
          <NodeRenderer
            key={currentNodeKey}
            nodeKey={currentNodeKey}
          />
        </main>

        {prevNodeKey && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="-ml-3 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to previous
            </Button>
          </div>
        )}

      </div>
    </PageShell>
  );
}
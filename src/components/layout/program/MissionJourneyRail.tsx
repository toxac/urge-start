import type { ProgramMission } from '@/program/types';

type MissionJourneyRailProps = {
  mission: ProgramMission;
  currentNodeKey: string;
  completedNodes: Set<string>;
};

export function MissionJourneyRail({
  mission,
  currentNodeKey,
  completedNodes,
}: MissionJourneyRailProps) {
  return (
    <aside
      aria-label="Mission journey"
      className="w-full"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Mission journey
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {mission.title}
          </p>
        </div>

        <div className="space-y-1">
          {mission.quests.map((quest, questIndex) => {
            const isCurrentQuest = quest.nodes.some(
              (node) => node.key === currentNodeKey
            );

            const isCompletedQuest =
              quest.nodes.length > 0 &&
              quest.nodes.every((node) =>
                completedNodes.has(node.key)
              );

            return (
              <div
                key={quest.key}
                className="relative"
              >
                {questIndex < mission.quests.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[7px] top-7 h-[calc(100%-1rem)] w-px bg-border"
                  />
                )}

                <div className="relative flex gap-3 py-2">
                  <div
                    className={[
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4 ring-background',
                      isCurrentQuest
                        ? 'bg-foreground'
                        : isCompletedQuest
                          ? 'bg-muted-foreground'
                          : 'bg-border',
                    ].join(' ')}
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p
                      className={[
                        'text-sm leading-5',
                        isCurrentQuest
                          ? 'font-medium text-foreground'
                          : isCompletedQuest
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {quest.title}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Quest {questIndex + 1}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
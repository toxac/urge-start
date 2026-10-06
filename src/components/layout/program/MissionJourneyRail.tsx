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
  const currentQuestIndex = mission.quests.findIndex((quest) =>
    quest.nodes.some((node) => node.key === currentNodeKey)
  );

  const currentQuest =
    currentQuestIndex >= 0
      ? mission.quests[currentQuestIndex]
      : null;

  return (
    <nav
      aria-label="Mission journey"
      className="w-full"
    >
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-3">
        {mission.quests.map((quest, index) => {
          const isCurrent = index === currentQuestIndex;

          const isCompleted =
            quest.nodes.length > 0 &&
            quest.nodes.every((node) =>
              completedNodes.has(node.key)
            );

          return (
            <div
              key={quest.key}
              className="flex min-w-0 flex-1 items-center"
            >
              <div
                className={[
                  'min-w-0',
                  isCurrent
                    ? 'text-foreground'
                    : isCompleted
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium',
                      isCurrent
                        ? 'bg-foreground text-background'
                        : isCompleted
                          ? 'bg-muted-foreground/20 text-muted-foreground'
                          : 'border border-border text-muted-foreground/60',
                    ].join(' ')}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </span>

                  <span
                    className={[
                      'truncate text-xs',
                      isCurrent ? 'font-medium' : 'font-normal',
                    ].join(' ')}
                  >
                    {quest.title}
                  </span>
                </div>
              </div>

              {index < mission.quests.length - 1 && (
                <div
                  aria-hidden="true"
                  className={[
                    'mx-3 h-px flex-1',
                    isCompleted
                      ? 'bg-muted-foreground/40'
                      : 'bg-border',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      {currentQuest && (
        <div className="flex items-center justify-between border-y border-border/60 py-3 md:hidden">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Quest {currentQuestIndex + 1} of {mission.quests.length}
            </p>

            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {currentQuest.title}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="ml-4 flex shrink-0 items-center gap-1"
          >
            {mission.quests.map((quest, index) => {
              const isCurrent = index === currentQuestIndex;

              const isCompleted =
                quest.nodes.length > 0 &&
                quest.nodes.every((node) =>
                  completedNodes.has(node.key)
                );

              return (
                <span
                  key={quest.key}
                  className={[
                    'block h-1.5 rounded-full',
                    isCurrent
                      ? 'w-5 bg-foreground'
                      : isCompleted
                        ? 'w-1.5 bg-muted-foreground/50'
                        : 'w-1.5 bg-border',
                  ].join(' ')}
                />
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
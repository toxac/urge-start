import { getMissionForNode } from '@/program';

type MissionJourneyHeaderProps = {
  nodeKey: string;
};

export function MissionJourneyHeader({
  nodeKey,
}: MissionJourneyHeaderProps) {
  const mission = getMissionForNode(nodeKey);

  if (!mission) {
    return null;
  }

  const questIndex = mission.quests.findIndex((quest) =>
    quest.nodes.some((node) => node.key === nodeKey)
  );

  const currentQuest =
    questIndex >= 0 ? mission.quests[questIndex] : null;

  if (!currentQuest) {
    return null;
  }

  return (
    <header className="space-y-6">
      {/* Mission identity */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Mission {mission.sequence}
        </p>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {mission.title}
        </h1>

        {mission.description && (
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {mission.description}
          </p>
        )}
      </div>

      {/* Current quest */}
      <div className="border-t border-border/60 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Quest {questIndex + 1} of {mission.quests.length}
        </p>

        <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {currentQuest.title}
        </h2>
      </div>
    </header>
  );
}
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

  return (
    <header className="w-full">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Mission {mission.sequence}
        </span>

        <span
          aria-hidden="true"
          className="text-muted-foreground/50"
        >
          ·
        </span>

        <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {mission.title}
        </h1>
      </div>
    </header>
  );
}
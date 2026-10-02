// src/app/(platform)/program/mission/[missionKey]/layout.tsx
import { getProgramHydrationData } from '@/actions/progress';
import { ProgramHydrator } from '@/components/hydrators/ProgramHydrator';
import { PageShell } from '@/components/layout/PageShell'; // Adjust path if needed

export default async function MissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { programState, progress } = await getProgramHydrationData();

  return (
    <>
      <ProgramHydrator 
        serverState={programState} 
        serverProgress={progress} 
      />
      {children}
    </>
  );
}
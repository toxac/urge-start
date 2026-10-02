import { getMissionRequirements } from '@/lib/context/requirements';
import { fetchMissionContext } from '@/actions/context';
import { MissionContextHydrator } from '@/components/hydrators/MissionContextHydrator';

export default async function MissionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { missionKey: string };
}) {
  // 1. Determine what this specific mission needs
  const requiredResources = getMissionRequirements(params.missionKey);

  // 2. Fetch only those resources
  const contextData = await fetchMissionContext(requiredResources);

  return (
    <>
      {/* 3. Hydrate the client stores */}
      <MissionContextHydrator contextData={contextData} />
      {children}
    </>
  );
}
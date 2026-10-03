import { getMissionRequirements } from '@/lib/context/requirements';
import { fetchMissionContext } from '@/actions/context';
import { getProgramSubscriptionStatus } from '@/actions/subscription';
import { MissionContextHydrator } from '@/components/hydrators/MissionContextHydrator';
import { TrialPaywall } from '@/components/program/TrialPaywall';
import { PageShell } from '@/components/layout/PageShell';

export default async function MissionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { missionKey: string };
}) {
  // 1. Check Subscription Status
  const status = await getProgramSubscriptionStatus();
  
  // 2. The Trial Gate
  if (params.missionKey !== 'mission-1' && status === 'trialing') {
    return (
      <PageShell>
        <TrialPaywall missionKey={params.missionKey} />
      </PageShell>
    );
  }

  // 3. Normal Flow: Fetch Context & Render
  const requiredResources = getMissionRequirements(params.missionKey);
  const contextData = await fetchMissionContext(requiredResources);

  return (
    <>
      <MissionContextHydrator contextData={contextData} />
      {children}
    </>
  );
}
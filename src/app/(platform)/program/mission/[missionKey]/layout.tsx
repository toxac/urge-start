import { ReactNode } from 'react';
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
  children: ReactNode;
  params: Promise<{ missionKey: string }>; // 1. Type params as a Promise
}){
  // Await the params to unwrap them
  const resolvedParams = await params;
  const missionKey = resolvedParams.missionKey;

  // 1. Check Subscription Status
  const status = await getProgramSubscriptionStatus();
  
  // 2. The Trial Gate
  if (missionKey !== 'mission-1' && status === 'trialing') {
    return (
      <PageShell>
        <TrialPaywall missionKey={missionKey} />
      </PageShell>
    );
  }

  // 3. Normal Flow: Fetch Context & Render
  const requiredResources = getMissionRequirements(missionKey);
  const contextData = await fetchMissionContext(requiredResources, missionKey);

  return (
    <>
      <MissionContextHydrator contextData={contextData} />
      {children}
    </>
  );
}
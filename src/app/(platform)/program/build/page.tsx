import { fetchMission4ContextSummary } from '@/actions/projects';
import { BuildDashboard } from '@/components/program/build/BuildDashboard';

export default async function BuildWorkspacePage() {
  const summary = await fetchMission4ContextSummary();

  return (
    <BuildDashboard
      initialProject={summary.project}
      initialOffer={summary.selectedOffer}
      initialBuild={summary.activeBuild}
      allBuilds={summary.builds}
      warmLeadsCount={summary.m3WarmLeads.length}
      m1Constraints={summary.m1Constraints}
    />
  );
}
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Wrench } from 'lucide-react';
import { getMissionRequirements } from '@/lib/context/requirements';
import { fetchMissionContext } from '@/actions/context';
import { MissionContextHydrator } from '@/components/hydrators/MissionContextHydrator';

export default async function BuildWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requirements = getMissionRequirements('mission-5');
  const contextData = await fetchMissionContext(requirements, 'mission-5');

  return (
    <div className="min-h-screen bg-background">
      <MissionContextHydrator contextData={contextData} />

      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/program"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Program
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Wrench className="h-4 w-4 text-primary" />
              <span>Mission 5 · Build Workspace</span>
            </div>
          </div>

          <Link
            href="/program/operate"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Operate (M6)
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
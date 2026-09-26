import { Dashboard } from '@/components/dashboard/Dashboard';
import {
  getAuthenticatedUser,
  getCurrentProfile,
} from '@/lib/auth';

import { PageShell } from '@/components/layout/PageShell';

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const profile = await getCurrentProfile(user.id);

  return (
    <PageShell>
      <Dashboard profile={profile} />
    </PageShell>
  );
}
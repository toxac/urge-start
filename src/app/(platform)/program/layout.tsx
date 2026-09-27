import { getAuthenticatedUser } from '@/lib/auth';
import { initializeProgram } from '@/lib/progress/initialize';
import type { ProgressSnapshot } from '@/lib/progress/types';

import { ProgressHydrator } from '@/components/hydrators/ProgressHydrator';

export default async function ProgramLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  const progressData = await initializeProgram(user.id);

  if (!progressData.programState) {
    throw new Error(
      'Program state could not be initialized',
    );
  }

  const snapshot: ProgressSnapshot = {
    programVersion:
      progressData.programState.program_version,

    currentNodeKey:
      progressData.programState.current_node_key,

    completed:
      progressData.progress.map(
        (record) => record.node_key,
      ),
  };

  return (
    <>
      <ProgressHydrator snapshot={snapshot} />
      {children}
    </>
  );
}
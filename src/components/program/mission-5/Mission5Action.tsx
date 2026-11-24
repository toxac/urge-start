'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@nanostores/react';
import { ArrowRight, LayoutDashboard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import { updateUserProjectMetadata } from '@/actions/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function Mission5Action({ node, onComplete }: NodeComponentProps) {
  const router = useRouter();
  const activeProject = useStore($activeProject);
  const [finishing, setFinishing] = useState(false);

  async function handleEnterOperate() {
    if (finishing) return;
    setFinishing(true);
    try {
      if (activeProject) {
        const updated = await updateUserProjectMetadata(activeProject.id, {
          status: 'operating',
        });
        projectsActions.upsertProject(updated);
      }
      await onComplete({ completed: true });
      router.push('/program/operate');
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mission 5 Complete · Enter Operations
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleEnterOperate()}
          disabled={finishing}
          className="h-12 rounded-full px-8 text-base"
        >
          {finishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening Operate Workspace…
            </>
          ) : (
            <>
              Open Operate Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
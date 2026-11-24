import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Wrench } from 'lucide-react';

export default function OperateWorkspacePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link
          href="/program"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Program
        </Link>
        <Link
          href="/program/build"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Wrench className="h-3.5 w-3.5" />
          Build Workspace (M5)
        </Link>
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-border bg-card p-8">
        <div className="flex items-center gap-2 text-primary">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Mission 6 · Operate Workspace
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Daily Operations &amp; Growth Command Center
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Placeholder workspace for Mission 6. Once your v1 build passes Alpha
          testing and launches in Mission 5, customer delivery, recurring
          revenue tracking, and channel growth widgets will live here.
        </p>
      </div>
    </div>
  );
}
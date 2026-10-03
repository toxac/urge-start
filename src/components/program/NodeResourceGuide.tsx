'use client';

import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  format: string;
  is_internal: boolean;
}

export function NodeResourceGuide({ resource }: { resource: Resource }) {
  const content = (
    <div className="group flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Key Guide
          </p>
          <p className="font-heading text-lg font-medium text-foreground">
            {resource.title}
          </p>
        </div>
      </div>
      {!resource.is_internal && <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />}
    </div>
  );

  if (resource.is_internal) {
    return (
      <Link href={resource.url} className="block w-full">
        {content}
      </Link>
    );
  }

  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block w-full">
      {content}
    </a>
  );
}
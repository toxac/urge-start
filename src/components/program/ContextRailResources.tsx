'use client';

import Link from 'next/link';
import { PlayCircle, BookOpen, Headphones, ExternalLink, Link2 } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  role: string;
  format: string;
  is_internal: boolean;
}

interface ContextRailResourcesProps {
  resources: Resource[];
}

export function ContextRailResources({ resources }: ContextRailResourcesProps) {
  const supplementary = resources.filter((r) => r.role === 'supplementary');
  const ambient = resources.find((r) => r.role === 'ambient' && r.format === 'music');

  const getIcon = (format: string) => {
    switch (format) {
      case 'video': return <PlayCircle className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      case 'article':
      case 'book': return <BookOpen className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  if (supplementary.length === 0 && !ambient) return null;

  return (
    <div className="mt-8 space-y-8 border-t border-border pt-8">
      
      {/* Supplementary Links */}
      {supplementary.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Dive Deeper
          </p>
          <ul className="space-y-3">
            {supplementary.map((resource) => {
              const inner = (
                <span className="flex items-start gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground">
                  <span className="mt-1 shrink-0">{getIcon(resource.format)}</span>
                  <span className="flex-1 font-medium">{resource.title}</span>
                  {!resource.is_internal && <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-50" />}
                </span>
              );

              return (
                <li key={resource.id}>
                  {resource.is_internal ? (
                    <Link href={resource.url}>{inner}</Link>
                  ) : (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">{inner}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Ambient Track (Spotify Embed) */}
      {ambient && (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Ambient Track
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            {/* Spotify embed URL format check (requires standard embed link) */}
            <iframe
              src={ambient.url}
              width="100%"
              height="152"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0 bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
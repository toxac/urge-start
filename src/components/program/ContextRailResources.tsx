'use client';

import { ExternalLink, Headphones, FileText } from 'lucide-react';
import type { Tables } from '@/database.types';

type Resource = Tables<'program_node_resources'>;

export function ContextRailResources({ resources }: { resources: Resource[] }) {
  const ambientTracks = resources.filter(r => r.role === 'ambient');
  const supplementaryLinks = resources.filter(r => r.role === 'supplementary');

  return (
    <div className="space-y-8">
      {ambientTracks.length > 0 && (
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Headphones className="h-4 w-4" />
            Ambient Focus
          </h4>
          <div className="grid gap-3">
            {ambientTracks.map(track => {
              // If it's a Spotify link, we can attempt to render an iframe embed
              if (track.url.includes('spotify.com')) {
                const embedUrl = track.url.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/');
                return (
                  <iframe 
                    key={track.id}
                    src={embedUrl}
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allowFullScreen 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="rounded-xl border-none shadow-sm"
                  />
                );
              }
              // Fallback for non-spotify ambient links
              return (
                <a key={track.id} href={track.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight group-hover:text-primary">{track.title}</p>
                    {track.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{track.description}</p>}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {supplementaryLinks.length > 0 && (
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" />
            Reference
          </h4>
          <div className="grid gap-3">
            {supplementaryLinks.map(link => (
              <a 
                key={link.id} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight group-hover:text-primary">{link.title}</p>
                  {link.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{link.description}</p>
                  )}
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
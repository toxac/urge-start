'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Plus, Trash2, Users, Globe, BookOpen, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';

type NetworkType = 'phone' | 'online_community' | 'offline_community' | 'professionals';

interface NetworkEntry {
  id: string;
  type: NetworkType;
  name: string;
  url: string;
  connections: string;
}

const NETWORK_TYPES: { id: NetworkType; label: string; icon: any }[] = [
  { id: 'phone', label: 'Phone / Socials', icon: Smartphone },
  { id: 'professionals', label: 'Professional', icon: BookOpen },
  { id: 'online_community', label: 'Online Group', icon: Globe },
  { id: 'offline_community', label: 'Local / Offline', icon: Users },
];

export function NetworkMapper({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};
  
  const [networks, setNetworks] = useState<NetworkEntry[]>(
    Array.isArray(saved.networks) ? saved.networks : []
  );
  
  const [currentType, setCurrentType] = useState<NetworkType>('phone');
  const [currentName, setCurrentName] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentConnections, setCurrentConnections] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!currentName.trim() || !currentConnections.trim()) return;

    const newEntry: NetworkEntry = {
      id: crypto.randomUUID(),
      type: currentType,
      name: currentName.trim(),
      url: currentUrl.trim(),
      connections: currentConnections.trim(),
    };

    setNetworks([...networks, newEntry]);
    setCurrentName('');
    setCurrentUrl('');
    setCurrentConnections('');
  };

  const handleRemove = (id: string) => {
    setNetworks(networks.filter(n => n.id !== id));
  };

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserProgramContext({
        network_context: networks,
      });
      
      await onComplete({ networks, completed: true });
    } catch (err) {
      console.error('[NETWORK MAPPER]', err);
      setError('Something went wrong saving your network context.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-12">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Map your distribution."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Don't worry about whether these people will buy from you yet. Just take stock of the rooms you are already in. Phone contacts, LinkedIn, subreddits, local clubs—list the ones that actually have some density.
        </p>
      </div>

      <div className="grid max-w-5xl gap-12 lg:grid-cols-[1fr_380px]">
        
        {/* ADD NEW NETWORK FORM */}
        <div className="space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              1. What kind of network?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {NETWORK_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setCurrentType(type.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                    currentType === type.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <type.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              2. The Details
            </label>
            <div className="space-y-3">
              <Input
                placeholder="Name (e.g., r/SaaS, College Alumni, Phone Book)"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="h-12 text-base"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Estimated Size (e.g., 400, 10k)"
                  value={currentConnections}
                  onChange={(e) => setCurrentConnections(e.target.value)}
                  className="h-12 text-base"
                />
                <Input
                  placeholder="URL (optional)"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleAdd} 
            disabled={!currentName.trim() || !currentConnections.trim()}
            variant="outline"
            className="w-full h-12 gap-2 rounded-xl border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add to Inventory
          </Button>
        </div>

        {/* SAVED NETWORKS LIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-medium">Your Inventory</h3>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              {networks.length} added
            </span>
          </div>

          {networks.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">No networks added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {networks.map(network => {
                const typeInfo = NETWORK_TYPES.find(t => t.id === network.type);
                const Icon = typeInfo?.icon || Users;

                return (
                  <div key={network.id} className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:border-primary/30">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{network.name}</p>
                        <p className="text-sm text-muted-foreground">{network.connections} connections</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(network.id)}
                      className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div className="flex max-w-5xl items-center justify-between border-t border-border pt-8">
        {error ? <p className="text-sm text-destructive">{error}</p> : <div />}
        <Button 
          onClick={handleComplete} 
          disabled={isSubmitting} 
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : 'Lock it in'}
          {!isSubmitting && <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>

    </div>
  );
}
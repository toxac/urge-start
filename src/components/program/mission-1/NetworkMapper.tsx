'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  BriefcaseBusiness,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import { userContextActions } from '@/lib/stores/user-context';

type NetworkType =
  | 'people'
  | 'group'
  | 'professional'
  | 'online'
  | 'place';

type NetworkUse =
  | 'ask_someone'
  | 'get_feedback'
  | 'find_someone'
  | 'test_something'
  | 'tell_people'
  | 'learn'
  | 'get_introduced';

type NetworkEntry = {
  id: string;
  type: NetworkType;
  name: string;
  access: string;
  possibleUses: NetworkUse[];
};

const NETWORK_TYPES: {
  id: NetworkType;
  title: string;
  description: string;
  icon: typeof Users;
}[] = [
    {
      id: 'people',
      title: 'People I Know',
      description: 'People you can reach directly.',
      icon: Users,
    },
    {
      id: 'group',
      title: "Groups I'm Part Of",
      description: 'Clubs, associations, alumni groups and communities.',
      icon: Users,
    },
    {
      id: 'professional',
      title: 'Professional Circles',
      description: 'People and networks connected to your work or industry.',
      icon: BriefcaseBusiness,
    },
    {
      id: 'online',
      title: 'Online Communities',
      description: 'Online groups, forums and communities where you participate.',
      icon: Globe,
    },
    {
      id: 'place',
      title: 'Places I Have Access To',
      description: 'Places where you can show up, meet people or try something.',
      icon: MapPin,
    },
  ];

const NETWORK_USES: {
  id: NetworkUse;
  label: string;
}[] = [
    { id: 'ask_someone', label: 'Ask someone' },
    { id: 'get_feedback', label: 'Get feedback' },
    { id: 'find_someone', label: 'Find someone' },
    { id: 'test_something', label: 'Test something' },
    { id: 'tell_people', label: 'Tell people' },
    { id: 'learn', label: 'Learn' },
    { id: 'get_introduced', label: 'Get introduced' },
  ];

function getSavedNetworks(
  progress: NodeComponentProps['progress']
): NetworkEntry[] {
  const contextNetworks = progress.payload?.network_context;

  if (Array.isArray(contextNetworks)) {
    return contextNetworks as NetworkEntry[];
  }

  const savedNetworks = progress.payload?.networks;

  if (Array.isArray(savedNetworks)) {
    return savedNetworks as NetworkEntry[];
  }

  return [];
}

export function NetworkMapper({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const savedNetworks = getSavedNetworks(progress);

  const [networks, setNetworks] = useState<NetworkEntry[]>(savedNetworks);
  const [currentType, setCurrentType] = useState<NetworkType>('people');
  const [currentName, setCurrentName] = useState('');
  const [currentAccess, setCurrentAccess] = useState('');
  const [currentUses, setCurrentUses] = useState<NetworkUse[]>([]);
  const [isEditing, setIsEditing] = useState(savedNetworks.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleUse = (use: NetworkUse) => {
    setCurrentUses(current =>
      current.includes(use)
        ? current.filter(item => item !== use)
        : [...current, use]
    );
  };

  const handleAdd = () => {
    if (
      !currentName.trim() ||
      !currentAccess.trim() ||
      currentUses.length === 0
    ) {
      return;
    }

    const newNetwork: NetworkEntry = {
      id: crypto.randomUUID(),
      type: currentType,
      name: currentName.trim(),
      access: currentAccess.trim(),
      possibleUses: currentUses,
    };

    setNetworks(current => [...current, newNetwork]);

    setCurrentName('');
    setCurrentAccess('');
    setCurrentUses([]);
  };

  const handleRemove = (id: string) => {
    setNetworks(current =>
      current.filter(network => network.id !== id)
    );
  };

  async function handleComplete() {
    if (isSubmitting || networks.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateUserProgramContext({
        network_context: networks,
      });

      userContextActions.updateContextLocally(result.userContext);

      await onComplete({
        network_context: networks,
        completed: true,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('[NETWORK MAPPER]', err);
      setError('Something went wrong saving your network.');
      setIsSubmitting(false);
    }
  }

  if (!isEditing && networks.length > 0) {
    return (
      <div className="w-full space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {node.title || 'Who is already within reach?'}
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            These are places and relationships you already have a way into.
            You may find them useful later.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {networks.map(network => {
            const typeInfo = NETWORK_TYPES.find(
              type => type.id === network.type
            );

            const Icon = typeInfo?.icon ?? Users;

            return (
              <div
                key={network.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {typeInfo?.title}
                      </p>

                      <h3 className="mt-1 font-heading text-lg font-medium">
                        {network.name}
                      </h3>
                    </div>

                    <p className="text-base leading-7 text-muted-foreground">
                      {network.access}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {network.possibleUses.map(use => {
                        const label =
                          NETWORK_USES.find(
                            option => option.id === use
                          )?.label ?? use;

                        return (
                          <span
                            key={use}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(network.id)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${network.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex max-w-3xl items-center justify-between border-t border-border pt-8">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="gap-2 rounded-full"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            onClick={() =>
              onComplete({
                network_context: networks,
                completed: true,
              })
            }
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Who is already within reach?'}
        </h2>

        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Think beyond your phone contacts. Where do you already have a
          place, a relationship or a way in?
        </p>
      </div>

      <div className="max-w-4xl space-y-10">
        <div className="space-y-4">
          <h3 className="font-heading text-xl font-medium">
            Where do you already have a place?
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {NETWORK_TYPES.map(type => {
              const Icon = type.icon;
              const selected = currentType === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setCurrentType(type.id)}
                  className={[
                    'rounded-2xl border p-5 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        selected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="font-heading font-medium">
                        {type.title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 border-t border-border pt-8">
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium">
              Add one
            </h3>

            <p className="text-base leading-7 text-muted-foreground">
              It could be a person, a group, a community or a place.
              Don't worry about whether they will become customers.
            </p>
          </div>

          <div className="space-y-5">
            <Input
              value={currentName}
              onChange={event =>
                setCurrentName(event.target.value)
              }
              placeholder="What is it? e.g. College alumni group"
              className="h-12 text-base"
            />

            <div className="space-y-2">
              <label className="font-heading text-base font-medium">
                How do you have access to it?
              </label>

              <Input
                value={currentAccess}
                onChange={event =>
                  setCurrentAccess(event.target.value)
                }
                placeholder="I can message people directly through the group."
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-heading text-base font-medium">
                  What could you realistically do there?
                </label>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pick anything that feels possible. This isn't a
                  commitment.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {NETWORK_USES.map(use => {
                  const selected = currentUses.includes(use.id);

                  return (
                    <button
                      key={use.id}
                      type="button"
                      onClick={() => toggleUse(use.id)}
                      className={[
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      ].join(' ')}
                    >
                      {selected && (
                        <Check className="mr-1.5 inline-block h-3.5 w-3.5" />
                      )}
                      {use.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              disabled={
                !currentName.trim() ||
                !currentAccess.trim() ||
                currentUses.length === 0
              }
              variant="outline"
              className="h-12 w-full gap-2 rounded-xl border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add to my network
            </Button>
          </div>
        </div>

        {networks.length > 0 && (
          <div className="space-y-5 border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-xl font-medium">
                  What you've found
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {networks.length}{' '}
                  {networks.length === 1
                    ? 'network'
                    : 'networks'}{' '}
                  identified
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {networks.map(network => {
                const typeInfo = NETWORK_TYPES.find(
                  type => type.id === network.type
                );

                return (
                  <div
                    key={network.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{network.name}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {typeInfo?.title}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {network.possibleUses.map(use => (
                          <span
                            key={use}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {
                              NETWORK_USES.find(
                                option => option.id === use
                              )?.label
                            }
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(network.id)}
                      className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${network.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex max-w-4xl items-center justify-between border-t border-border pt-8">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div />
        )}

        <Button
          onClick={handleComplete}
          disabled={isSubmitting || networks.length === 0}
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
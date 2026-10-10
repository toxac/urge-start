
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Loader2,
  MapPin,
  MessagesSquare,
  Pencil,
  PlusCircle,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { updateUserProgramContext } from '@/actions/user-context';
import {
  $userContext,
  userContextActions,
} from '@/lib/stores/user-context';

type NetworkType =
  | 'family_friends'
  | 'school_alumni'
  | 'past_work'
  | 'hobbies_clubs'
  | 'online_communities'
  | 'local_groups'
  | 'service_providers';

type NetworkEntry = {
  id: string;
  type: NetworkType;
  name: string;
  description: string;
  url: string;
};

type NetworkCategory = {
  id: NetworkType;
  title: string;
  description: string;
  icon: typeof Users;
  examples: string;
};

const NETWORK_TYPES: NetworkCategory[] = [
  {
    id: 'family_friends',
    title: 'Family and friends',
    description: 'People who know you personally.',
    icon: HeartHandshake,
    examples: 'Family, friends, neighbours and personal contacts',
  },
  {
    id: 'school_alumni',
    title: 'School, college and alumni',
    description: 'Connections from your education.',
    icon: GraduationCap,
    examples: 'Classmates, alumni groups, teachers and former classmates',
  },
  {
    id: 'past_work',
    title: 'Past work and volunteering',
    description: 'Relationships built through work and service.',
    icon: BriefcaseBusiness,
    examples: 'Former colleagues, internships and volunteering',
  },
  {
    id: 'hobbies_clubs',
    title: 'Hobbies, sports and clubs',
    description: 'People you meet through shared interests.',
    icon: Users,
    examples: 'Gym, sports teams, hobby groups and clubs',
  },
  {
    id: 'online_communities',
    title: 'Online communities',
    description: 'Groups and communities you participate in online.',
    icon: MessagesSquare,
    examples: 'WhatsApp, Discord, LinkedIn, Reddit and Instagram',
  },
  {
    id: 'local_groups',
    title: 'Local groups and spaces',
    description: 'Communities and places connected to your area.',
    icon: MapPin,
    examples: 'Meetups, chambers of commerce, co-working spaces and events',
  },
  {
    id: 'service_providers',
    title: 'People who support your work',
    description: 'People whose knowledge or services you can draw on.',
    icon: Handshake,
    examples: 'Mentors, teachers, coaches, accountants and lawyers',
  },
];

function normalizeNetwork(value: unknown): NetworkEntry | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Record<string, unknown>;

  if (typeof item.name !== 'string' || !item.name.trim()) return null;

  const legacyTypeMap: Record<string, NetworkType> = {
    people: 'family_friends',
    group: 'local_groups',
    professional: 'past_work',
    online: 'online_communities',
    place: 'local_groups',
  };

  const rawType = typeof item.type === 'string' ? item.type : '';

  const validTypes: NetworkType[] = [
    'family_friends',
    'school_alumni',
    'past_work',
    'hobbies_clubs',
    'online_communities',
    'local_groups',
    'service_providers',
  ];

  const type = validTypes.includes(rawType as NetworkType)
    ? (rawType as NetworkType)
    : legacyTypeMap[rawType] ?? 'family_friends';

  return {
    id:
      typeof item.id === 'string' && item.id
        ? item.id
        : crypto.randomUUID(),
    type,
    name: item.name.trim(),
    description:
      typeof item.description === 'string'
        ? item.description
        : typeof item.access === 'string'
          ? item.access
          : '',
    url: typeof item.url === 'string' ? item.url : '',
  };
}

function getSavedNetworks(
  progress: NodeComponentProps['progress'],
): NetworkEntry[] {
  const payload = progress.payload;

  const contextNetworks = payload?.network_context;
  const legacyNetworks = payload?.networks;

  const saved = Array.isArray(contextNetworks)
    ? contextNetworks
    : Array.isArray(legacyNetworks)
      ? legacyNetworks
      : [];

  return saved
    .map(normalizeNetwork)
    .filter((item): item is NetworkEntry => item !== null);
}

export function NetworkMapper({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const contextState = useStore($userContext);
  const hasInitialized = useRef(false);

  const [networks, setNetworks] = useState<NetworkEntry[]>([]);
  const [activeCategoryId, setActiveCategoryId] =
    useState<NetworkType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategory = NETWORK_TYPES.find(
    (category) => category.id === activeCategoryId,
  );

  const editingNetwork = networks.find((item) => item.id === editingId);

  useEffect(() => {
    if (!contextState.isHydrated || hasInitialized.current) return;

    const contextValue = contextState.userContext?.network_context;
    const contextNetworks = Array.isArray(contextValue)
      ? contextValue
      : null;

    const initialNetworks = contextNetworks
      ? contextNetworks
        .map(normalizeNetwork)
        .filter((item): item is NetworkEntry => item !== null)
      : getSavedNetworks(progress);

    setNetworks(initialNetworks);
    hasInitialized.current = true;
  }, [contextState.isHydrated, contextState.userContext, progress]);

  useEffect(() => {
    if (!activeCategoryId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        closeDialog();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCategoryId, isSaving]);

  function openAddDialog(categoryId: NetworkType) {
    setActiveCategoryId(categoryId);
    setEditingId(null);
    setName('');
    setDescription('');
    setUrl('');
    setError(null);
  }

  function openEditDialog(network: NetworkEntry) {
    setActiveCategoryId(network.type);
    setEditingId(network.id);
    setName(network.name);
    setDescription(network.description);
    setUrl(network.url);
    setError(null);
  }

  function closeDialog() {
    if (isSaving) return;

    setActiveCategoryId(null);
    setEditingId(null);
    setError(null);
  }

  async function persistNetworks(nextNetworks: NetworkEntry[]) {
    const result = await updateUserProgramContext({
      network_context: nextNetworks,
    });

    userContextActions.updateContextLocally(result.userContext);
  }

  async function saveNetwork() {
    if (!activeCategoryId || !name.trim() || isSaving) return;

    if (url.trim()) {
      try {
        const parsedUrl = new URL(url.trim());

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Please use a web link beginning with http:// or https://.');
        }
      } catch {
        setError('Enter a valid web link, including https://, or leave it blank.');
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    const entry: NetworkEntry = {
      id: editingId ?? crypto.randomUUID(),
      type: activeCategoryId,
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
    };

    const nextNetworks = editingId
      ? networks.map((item) => (item.id === editingId ? entry : item))
      : [...networks, entry];

    try {
      await persistNetworks(nextNetworks);
      setNetworks(nextNetworks);
      setActiveCategoryId(null);
      setEditingId(null);
    } catch (err) {
      console.error('[NETWORK MAPPER SAVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving this connection.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeNetwork(id: string) {
    if (isRemoving || isSaving || isCompleting) return;

    const nextNetworks = networks.filter((item) => item.id !== id);

    setIsRemoving(id);
    setError(null);

    try {
      await persistNetworks(nextNetworks);
      setNetworks(nextNetworks);
    } catch (err) {
      console.error('[NETWORK MAPPER REMOVE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong removing this connection.',
      );
    } finally {
      setIsRemoving(null);
    }
  }

  async function handleContinue() {
    if (networks.length === 0 || isCompleting || isSaving || isRemoving) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      await persistNetworks(networks);

      await onComplete({
        network_context: networks,
        completed: true,
      });
    } catch (err) {
      console.error('[NETWORK MAPPER COMPLETE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong completing this step.',
      );
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="w-full space-y-10 pb-12">
      <div className="max-w-3xl space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title}
        </h1>

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}
      </div>

      <section className="max-w-4xl space-y-4">
        <div>
          <h2 className="font-heading text-xl font-medium">
            Where do you already have connections?
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose a category to add a person, group or community.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {NETWORK_TYPES.map((category) => {
            const Icon = category.icon;
            const count = networks.filter(
              (network) => network.type === category.id,
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => openAddDialog(category.id)}
                disabled={isSaving || Boolean(isRemoving) || isCompleting}
                className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50 sm:p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-medium leading-snug">
                      {category.title}
                    </h3>

                    {count > 0 && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {count}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground/80">
                    {category.examples}
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add connection
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-4xl space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-medium">
              Your connections
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {networks.length === 0
                ? 'Your saved connections will appear here.'
                : `${networks.length} ${networks.length === 1 ? 'connection' : 'connections'
                } added`}
            </p>
          </div>
        </div>

        {networks.length > 0 ? (
          <div className="space-y-3">
            {networks.map((network) => {
              const category = NETWORK_TYPES.find(
                (item) => item.id === network.type,
              );
              const Icon = category?.icon ?? Users;
              const isRemovingThis = isRemoving === network.id;

              return (
                <article
                  key={network.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category?.title}
                      </p>

                      <h3 className="mt-1 font-heading text-lg font-medium">
                        {network.name}
                      </h3>

                      {network.description && (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                          {network.description}
                        </p>
                      )}

                      {network.url && (
                        <a
                          href={network.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block max-w-full break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {network.url}
                        </a>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(network)}
                          disabled={
                            isSaving || Boolean(isRemoving) || isCompleting
                          }
                          className="gap-1.5 rounded-full"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void removeNetwork(network.id)}
                          disabled={
                            isSaving || Boolean(isRemoving) || isCompleting
                          }
                          className="gap-1.5 rounded-full text-muted-foreground hover:text-destructive"
                        >
                          {isRemovingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">Your inventory starts here</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Add a connection from any category above. You can add as many
              as you need.
            </p>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="max-w-4xl text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex max-w-4xl justify-end border-t border-border pt-8">
        <Button
          onClick={handleContinue}
          disabled={
            networks.length === 0 ||
            isCompleting ||
            isSaving ||
            Boolean(isRemoving)
          }
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isCompleting ? (
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

      {activeCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="network-dialog-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-border bg-background p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {editingNetwork ? 'Edit connection' : 'Add connection'}
                </p>

                <h2
                  id="network-dialog-title"
                  className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  {activeCategory.title}
                </h2>

                <p className="text-sm leading-6 text-muted-foreground">
                  {activeCategory.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                aria-label="Close dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-7 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void saveNetwork();
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="network-name"
                  className="block text-sm font-medium"
                >
                  Name this connection?
                </label>

                <Input
                  id="network-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. My college alumni group"
                  maxLength={160}
                  autoFocus
                  disabled={isSaving}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="network-description"
                  className="block text-sm font-medium"
                >
                  Tell us a little about it
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <Textarea
                  id="network-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What would be useful to remember about this connection?"
                  rows={4}
                  maxLength={1500}
                  disabled={isSaving}
                  className="resize-y text-base leading-7"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="network-url"
                  className="block text-sm font-medium"
                >
                  Link
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <Input
                  id="network-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://..."
                  maxLength={2048}
                  disabled={isSaving}
                  className="h-12 text-base"
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Add a link if it helps you find this group or community again.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="h-11 rounded-full px-6"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!name.trim() || isSaving}
                  className="h-11 gap-2 rounded-full px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingNetwork ? 'Save changes' : 'Save connection'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

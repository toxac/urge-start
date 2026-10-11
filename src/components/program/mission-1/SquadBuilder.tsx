
'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Loader2,
  Mail,
  Plus,
  UserRound,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { createUserContact, getUserContacts } from '@/actions/contacts';
import type { SquadPersona, UserContact } from '@/lib/types/user-contacts';

const SQUAD_ROLES = [
  {
    id: 'believer',
    label: 'The Believer',
    description: 'Reminds you why you started. Lifts you when you’re low.',
    example: 'A close friend or family member',
  },
  {
    id: 'challenger',
    label: 'The Challenger',
    description: 'Asks hard questions. Pokes holes. Keeps you honest.',
    example: 'A peer or former colleague',
  },
  {
    id: 'guide',
    label: 'The Guide',
    description: 'Has walked a similar path. Shares experience, not answers.',
    example: 'Someone who is further along',
  },
  {
    id: 'doer',
    label: 'The Doer',
    description: 'Keeps you accountable. Checks in on actions, not feelings.',
    example: 'A peer at a similar stage',
  },
  {
    id: 'connector',
    label: 'The Connector',
    description: 'Opens doors. Knows people. Makes introductions.',
    example: 'Someone with a wide network',
  },
] as const satisfies readonly {
  id: SquadPersona;
  label: string;
  description: string;
  example: string;
}[];

type SquadMember = {
  id: string;
  name: string;
  email: string;
  role: SquadPersona | null;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getInitialMembers(
  payload: Record<string, any> | undefined,
): SquadMember[] {
  if (!Array.isArray(payload?.members)) return [];

  return payload.members
    .filter(
      (member: any) =>
        member &&
        typeof member.id === 'string' &&
        typeof member.email === 'string',
    )
    .map((member: any) => {
      const persona = SQUAD_ROLES.find(
        (item) =>
          item.id === member.role ||
          item.id === member.persona ||
          item.label === member.role,
      );

      return {
        id: member.id,
        name: typeof member.name === 'string' ? member.name : '',
        email: member.email,
        role: persona?.id ?? null,
      };
    });
}

function mapContactToMember(contact: UserContact): SquadMember {
  const context = isObject(contact.context) ? contact.context : {};
  const squad = isObject(context.squad) ? context.squad : {};

  const persona = SQUAD_ROLES.find(
    (item) =>
      item.id === squad.persona ||
      item.label === squad.persona_label,
  );

  return {
    id: contact.id,
    name: contact.name ?? '',
    email: contact.email ?? '',
    role: persona?.id ?? null,
  };
}

export function SquadBuilder({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const [members, setMembers] = useState<SquadMember[]>(() =>
    getInitialMembers(progress.payload),
  );

  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [selectedRole, setSelectedRole] = useState<SquadPersona | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSquadContacts() {
      setIsLoadingContacts(true);

      try {
        const contacts = await getUserContacts();

        if (cancelled) return;

        const squadMembers = contacts
          .filter((contact) => contact.roles?.includes('squad'))
          .map(mapContactToMember);

        setMembers(squadMembers);
      } catch (err) {
        console.error('Failed to load squad contacts:', err);

        if (!cancelled) {
          setError(
            'We couldn’t load your squad. Please refresh and try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingContacts(false);
        }
      }
    }

    void loadSquadContacts();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const selectedRoleDetails = SQUAD_ROLES.find(
    (role) => role.id === selectedRole,
  );

  const emailAlreadyAdded =
    normalizedEmail.length > 0 &&
    members.some(
      (member) => member.email.trim().toLowerCase() === normalizedEmail,
    );

  const canAdd =
    !!selectedRole &&
    normalizedName.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) &&
    !emailAlreadyAdded &&
    !isLoadingContacts &&
    !isAdding &&
    !isContinuing;

  async function handleAddPerson() {
    if (!canAdd || !selectedRole || !selectedRoleDetails) return;

    setIsAdding(true);
    setError(null);

    try {
      const result = await createUserContact({
        name: normalizedName,
        email: normalizedEmail,
        roles: ['squad'],
        context: {
          squad: {
            persona: selectedRole,
            persona_label: selectedRoleDetails.label,
            notes: selectedRoleDetails.description,
          },
        },
        contact_details: {},
        status: 'not_invited',
      });

      setMembers((current) => [
        ...current,
        {
          id: result.contact.id,
          name: result.contact.name ?? normalizedName,
          email: result.contact.email ?? normalizedEmail,
          role: selectedRole,
        },
      ]);

      setName('');
      setEmail('');
      setSelectedRole(null);
    } catch (err) {
      console.error(err);
      setError('We couldn’t add this person. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleContinue() {
    if (
      members.length < 3 ||
      isContinuing ||
      isAdding ||
      isLoadingContacts
    ) {
      return;
    }

    setIsContinuing(true);
    setError(null);

    try {
      await onComplete({
        members,
        completed: true,
      });
    } catch (err) {
      console.error(err);
      setError('We couldn’t save your progress. Please try again.');
      setIsContinuing(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-10">
      <header className="space-y-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Who could help you move?'}
        </h1>

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}

        <p className="text-base leading-7 text-muted-foreground">
          You don’t need a co-founder or a big team. Think about people who
          could play a useful role in your journey. Choose the kind of support
          you want, then add their details.
        </p>
      </header>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">
              {members.length > 0 ? 'Add another person' : 'Choose their role'}
            </h2>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            What kind of support would this person bring?
          </p>
        </div>

        <div className="space-y-3">
          {SQUAD_ROLES.map((role) => {
            const selected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id);
                  setError(null);
                }}
                disabled={isLoadingContacts || isAdding || isContinuing}
                aria-pressed={selected}
                className={[
                  'w-full rounded-xl border p-4 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/50',
                    ].join(' ')}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold">{role.label}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {role.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {role.example}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor="squad-name" className="text-sm font-medium">
            Their name
          </label>

          <div className="relative">
            <UserRound
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="squad-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Who are you thinking of?"
              className="h-12 pl-10 text-base"
              disabled={isLoadingContacts || isAdding || isContinuing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="squad-email" className="text-sm font-medium">
            Their email address
          </label>

          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="squad-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canAdd) {
                  event.preventDefault();
                  void handleAddPerson();
                }
              }}
              placeholder="name@example.com"
              className="h-12 pl-10 text-base"
              disabled={isLoadingContacts || isAdding || isContinuing}
            />
          </div>

          {emailAlreadyAdded && (
            <p className="text-sm text-destructive">
              You’ve already added this email address.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={handleAddPerson}
          disabled={!canAdd}
          className="h-12 w-full gap-2 rounded-full text-base"
        >
          {isLoadingContacts ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your squad...
            </>
          ) : isAdding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding person...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to my squad
            </>
          )}
        </Button>
      </section>

      {(members.length > 0 || isLoadingContacts) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-semibold">Your squad</h2>

            {!isLoadingContacts && (
              <span className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? 'person' : 'people'}
              </span>
            )}
          </div>

          {isLoadingContacts ? (
            <p className="text-sm text-muted-foreground">
              Loading your saved contacts...
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const role = SQUAD_ROLES.find(
                  (item) => item.id === member.role,
                );

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {member.name || member.email}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role?.label ?? 'Squad member'}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      Added
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {members.length}
          </div>

          <div className="flex-1">
            <p className="font-medium">
              {isLoadingContacts
                ? 'Loading your squad'
                : members.length < 3
                  ? `Add ${3 - members.length} more ${
                      3 - members.length === 1 ? 'person' : 'people'
                    } to your squad`
                  : 'Your squad is taking shape'}
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              You can choose more than three people. Think about the different
              kinds of support you might need as you move forward.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={
              members.length < 3 ||
              isLoadingContacts ||
              isContinuing ||
              isAdding
            }
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {isContinuing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SquadBuilder;

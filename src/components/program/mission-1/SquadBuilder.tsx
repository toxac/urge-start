'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { createUserContacts, inviteContact } from '@/actions/contacts';
import type {
  CreateUserContactInput,
  UserContactRelationship,
} from '@/lib/types/user-contacts';

type SquadMember = {
  id: string;
  name: string;
  organization: string;
  role: string;
  email: string;
  context: string;
  relationships: UserContactRelationship[];
  invited: boolean;
};

const RELATIONSHIPS: {
  value: UserContactRelationship;
  label: string;
}[] = [
  {
    value: 'learning',
    label: 'Someone I can learn from',
  },
  {
    value: 'challenge',
    label: 'Someone who can challenge my thinking',
  },
  {
    value: 'industry',
    label: 'Someone who knows my industry',
  },
  {
    value: 'introduction',
    label: 'Someone who can make an introduction',
  },
  {
    value: 'practical_help',
    label: 'Someone I can ask for practical help',
  },
  {
    value: 'accountability',
    label: 'Someone who will help me keep moving',
  },
  {
    value: 'feedback',
    label: 'Someone I can get feedback from',
  },
];

function createEmptyMember(): SquadMember {
  return {
    id: crypto.randomUUID(),
    name: '',
    organization: '',
    role: '',
    email: '',
    context: '',
    relationships: [],
    invited: false,
  };
}

function invitationFor(member: SquadMember) {
  const reason = member.context.trim();

  return `I'm starting something new and I'm inviting a few people into the journey. I'd like you to be one of them because ${reason.toLowerCase().startsWith('because') ? reason.slice(8).trim() : reason}. Would you be up for being in my corner?`;
}

export function SquadBuilder({
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = progress.payload ?? {};

  const savedMembers = Array.isArray(saved.members)
    ? (saved.members as SquadMember[])
    : [];

  const [members, setMembers] = useState<SquadMember[]>(
    savedMembers.length >= 3
      ? savedMembers
      : [createEmptyMember(), createEmptyMember(), createEmptyMember()]
  );

  const [step, setStep] = useState<'build' | 'invite' | 'done'>(
    saved.completed
      ? 'done'
      : saved.invitesStarted
        ? 'invite'
        : 'build'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateMember(
    id: string,
    field: keyof SquadMember,
    value: string
  ) {
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? { ...member, [field]: value }
          : member
      )
    );
  }

  function toggleRelationship(
    id: string,
    relationship: UserContactRelationship
  ) {
    setMembers((current) =>
      current.map((member) => {
        if (member.id !== id) return member;

        const relationships = member.relationships.includes(
          relationship
        )
          ? member.relationships.filter(
              (item) => item !== relationship
            )
          : [...member.relationships, relationship];

        return {
          ...member,
          relationships,
        };
      })
    );
  }

  function addMember() {
    setMembers((current) => [
      ...current,
      createEmptyMember(),
    ]);
  }

  function removeMember(id: string) {
    setMembers((current) => {
      if (current.length <= 3) return current;

      return current.filter((member) => member.id !== id);
    });
  }

  const validMembers = members.filter(
    (member) =>
      member.name.trim() &&
      member.email.trim() &&
      member.context.trim() &&
      member.relationships.length > 0
  );

  const canContinue =
    members.length >= 3 &&
    validMembers.length === members.length;

  async function handlePrepareInvites() {
    if (!canContinue || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const contacts: CreateUserContactInput[] =
        validMembers.map((member) => ({
          name: member.name.trim(),
          organization:
            member.organization.trim() || null,
          role: member.role.trim() || null,
          context: member.context.trim(),
          contact_details: {
            email: member.email.trim(),
          },
          relationships: member.relationships,
          status: 'pending',
        }));

      const result = await createUserContacts(contacts);

      setMembers((current) =>
        current.map((member, index) => ({
          ...member,
          id:
            result.contacts[index]?.id ??
            member.id,
        }))
      );

      setStep('invite');
    } catch (err) {
      console.error(err);
      setError(
        'We could not save your squad. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInvite(member: SquadMember) {
    if (isSubmitting || member.invited) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await inviteContact(
        member.id,
        invitationFor(member)
      );

      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? { ...item, invited: true }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        `We could not invite ${member.name}. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onComplete({
        members,
        invitesStarted: true,
        completed: true,
      });

      setStep('done');
    } finally {
      setIsSubmitting(false);
    }
  }

  const invitedCount = members.filter(
    (member) => member.invited
  ).length;

  if (step === 'done') {
    return (
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            YOU MADE THE ASK
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            You reached out.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            Whether they say yes, no, or never reply is not
            up to you. What mattered here was making the ask.
          </p>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>

              <div>
                <p className="font-medium">
                  {member.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  Invitation sent
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() =>
              onComplete({
                members,
                invitesStarted: true,
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

  if (step === 'invite') {
    return (
      <div className="w-full max-w-3xl space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            NOW REACH OUT
          </p>

          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Bring them into the journey.
          </h2>

          <p className="text-lg leading-8 text-muted-foreground">
            You've chosen the people. Now do the uncomfortable
            part: actually reach out.
          </p>
        </div>

        <div className="space-y-6">
          {members.map((member) => {
            const message = invitationFor(member);

            return (
              <div
                key={member.id}
                className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
              >
                <div>
                  <p className="font-heading text-xl font-medium">
                    {member.name}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>

                <div className="rounded-xl bg-muted/50 p-5">
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    YOUR INVITATION
                  </p>

                  <p className="mt-3 text-base leading-7">
                    {message}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleInvite(member)}
                    disabled={isSubmitting || member.invited}
                    className="h-11 gap-2 rounded-full px-6"
                  >
                    {member.invited ? (
                      <>
                        <Check className="h-4 w-4" />
                        Reached out
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Reach out
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {invitedCount} of {members.length} reached out
          </p>

          <Button
            onClick={handleComplete}
            disabled={
              invitedCount < 3 ||
              isSubmitting
            }
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
            {!isSubmitting && (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-10">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          PEOPLE YOU ALREADY KNOW
        </p>

        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Who could help you move?'}
        </h2>

        <p className="text-lg leading-8 text-muted-foreground">
          You do not need a co-founder or a big team. Think
          about people who could help you see something
          differently, learn something, make an introduction,
          or take a difficult step.
        </p>

        <p className="text-base leading-7 text-muted-foreground">
          Choose at least three people you already know. You
          will actually reach out to them.
        </p>
      </div>

      <div className="space-y-8">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  PERSON {index + 1}
                </p>
              </div>

              {members.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(member.id)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor={`name-${member.id}`}
                  className="text-sm font-medium"
                >
                  Who?
                </label>

                <Input
                  id={`name-${member.id}`}
                  value={member.name}
                  onChange={(event) =>
                    updateMember(
                      member.id,
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Their name"
                  className="mt-2 h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`role-${member.id}`}
                    className="text-sm font-medium"
                  >
                    What do they do?
                  </label>

                  <Input
                    id={`role-${member.id}`}
                    value={member.role}
                    onChange={(event) =>
                      updateMember(
                        member.id,
                        'role',
                        event.target.value
                      )
                    }
                    placeholder="Founder, designer, teacher..."
                    className="mt-2 h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`organization-${member.id}`}
                    className="text-sm font-medium"
                  >
                    Where do they work?
                  </label>

                  <Input
                    id={`organization-${member.id}`}
                    value={member.organization}
                    onChange={(event) =>
                      updateMember(
                        member.id,
                        'organization',
                        event.target.value
                      )
                    }
                    placeholder="Company or community"
                    className="mt-2 h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`email-${member.id}`}
                  className="text-sm font-medium"
                >
                  How can you reach them?
                </label>

                <Input
                  id={`email-${member.id}`}
                  type="email"
                  value={member.email}
                  onChange={(event) =>
                    updateMember(
                      member.id,
                      'email',
                      event.target.value
                    )
                  }
                  placeholder="Their email address"
                  className="mt-2 h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Why could they be useful?
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {RELATIONSHIPS.map((relationship) => {
                    const selected =
                      member.relationships.includes(
                        relationship.value
                      );

                    return (
                      <button
                        key={relationship.value}
                        type="button"
                        onClick={() =>
                          toggleRelationship(
                            member.id,
                            relationship.value
                          )
                        }
                        disabled={isSubmitting}
                        className={[
                          'rounded-full border px-4 py-2 text-sm transition-colors',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                        ].join(' ')}
                      >
                        {relationship.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor={`context-${member.id}`}
                  className="text-sm font-medium"
                >
                  Why this person?
                </label>

                <Textarea
                  id={`context-${member.id}`}
                  value={member.context}
                  onChange={(event) =>
                    updateMember(
                      member.id,
                      'context',
                      event.target.value
                    )
                  }
                  placeholder="What makes this person useful to you?"
                  className="mt-2 min-h-[120px] resize-none text-base leading-7"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addMember}
          disabled={isSubmitting}
          className="h-11 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add another person
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {validMembers.length} of {members.length} ready
        </p>

        <Button
          onClick={handlePrepareInvites}
          disabled={!canContinue || isSubmitting}
          className="h-12 gap-2 rounded-full px-8 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Prepare the asks
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
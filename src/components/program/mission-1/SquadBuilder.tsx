'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MessageSquarePlus,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkedinBoxFillIcon } from '@/components/ui/icons/akar-icons-linkedin-box-fill';
import { SpeechTextarea } from '@/components/ui/speech-textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import {
  createUserContact,
  deleteUserContact,
  getUserContacts,
  inviteContact,
  updateUserContact,
} from '@/actions/contacts';
import { createUserContent } from '@/actions/user-content';
import type {
  SquadPersona,
  SquadRoleContext,
  UserContact,
  UserContactStatus,
} from '@/lib/types/user-contacts';

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
  roles: SquadPersona[];
  notes: string;
  status: UserContactStatus;
  invitationMessage?: string;
  invitationToken?: string | null;
};

type SquadBuilderPayload = {
  members?: SquadMember[];
  forumPostId?: string;
  sharedOnLinkedIn?: boolean;
  completed?: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRoles(raw: unknown): SquadPersona[] {
  const validIds = new Set<SquadPersona>(SQUAD_ROLES.map((r) => r.id));

  if (Array.isArray(raw)) {
    return raw.filter((item): item is SquadPersona =>
      validIds.has(item as SquadPersona),
    );
  }

  if (typeof raw === 'string') {
    const byId = SQUAD_ROLES.find((r) => r.id === raw || r.label === raw);
    return byId ? [byId.id] : [];
  }

  return [];
}

function mapContactToMember(contact: UserContact): SquadMember {
  const context = isObject(contact.context) ? contact.context : {};
  const squad = isObject(context.squad) ? context.squad : {};
  const details = isObject(contact.contact_details)
    ? contact.contact_details
    : {};

  let roles = normalizeRoles(squad.personas);
  if (roles.length === 0 && squad.persona) {
    roles = normalizeRoles(squad.persona);
  }

  return {
    id: contact.id,
    name: contact.name ?? '',
    email: contact.email ?? '',
    roles,
    notes: typeof squad.notes === 'string' ? squad.notes : '',
    status: contact.status ?? 'not_invited',
    invitationMessage:
      typeof details.invitation_message === 'string'
        ? details.invitation_message
        : undefined,
    invitationToken:
      typeof details.invitation_token === 'string'
        ? details.invitation_token
        : null,
  };
}

function buildDefaultInviteMessage(member: SquadMember): string {
  const roleLabels = member.roles
    .map((id) => SQUAD_ROLES.find((r) => r.id === id)?.label)
    .filter(Boolean);

  const roleClause =
    roleLabels.length > 0
      ? `specifically because I value having ${roleLabels.join(' and ')} in my corner`
      : 'because I really value your perspective';

  return `Hey ${member.name || 'there'},\n\nI’m starting a new journey through Urge to explore and build something meaningful, and I’m putting together a small personal squad of people I trust.\n\nI thought of you ${roleClause}. No heavy time commitment—just someone I can occasionally bounce ideas off or check in with as I take real-world steps.\n\nWould you be up for being part of my squad?`;
}

export function SquadBuilder({
  node,
  nodeKey,
  progress,
  onComplete,
}: NodeComponentProps) {
  const saved = (progress.payload ?? {}) as SquadBuilderPayload;

  const [members, setMembers] = useState<SquadMember[]>(() =>
    Array.isArray(saved.members) ? saved.members : [],
  );
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Add / Edit Contact Form State (Person first -> Multi-role second)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<SquadPersona[]>([]);
  const [notes, setNotes] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Invite Modal State
  const [inviteTarget, setInviteTarget] = useState<SquadMember | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isPreparingInvite, setIsPreparingInvite] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Community Forum & LinkedIn Outreach State
  const [forumPostId, setForumPostId] = useState<string | null>(
    typeof saved.forumPostId === 'string' ? saved.forumPostId : null,
  );
  const [sharedOnLinkedIn, setSharedOnLinkedIn] = useState<boolean>(
    Boolean(saved.sharedOnLinkedIn),
  );
  const [activeOutreach, setActiveOutreach] = useState<
    'forum' | 'linkedin' | null
  >(null);
  const [forumTitle, setForumTitle] = useState('');
  const [forumBody, setForumBody] = useState('');
  const [isPublishingForum, setIsPublishingForum] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState('');
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  // Load squad contacts from DB on mount
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
          setError('We couldn’t load your squad. Please refresh and try again.');
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

  // Compute role coverage across all squad members
  const coveredRoles = useMemo(() => {
    const set = new Set<SquadPersona>();
    for (const member of members) {
      for (const role of member.roles) {
        set.add(role);
      }
    }
    return set;
  }, [members]);

  const missingRoles = useMemo(
    () => SQUAD_ROLES.filter((role) => !coveredRoles.has(role.id)),
    [coveredRoles],
  );

  const allRolesCovered = coveredRoles.size === SQUAD_ROLES.length;
  const hasCommunityOutreach = Boolean(forumPostId) || sharedOnLinkedIn;
  const canContinue =
    !isLoadingContacts &&
    !isSavingContact &&
    !isContinuing &&
    (allRolesCovered || hasCommunityOutreach);

  // Form validation
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const emailAlreadyAdded =
    normalizedEmail.length > 0 &&
    members.some(
      (member) =>
        member.id !== editingMemberId &&
        member.email.trim().toLowerCase() === normalizedEmail,
    );

  const canSubmitContact =
    normalizedName.length > 0 &&
    emailValid &&
    !emailAlreadyAdded &&
    selectedRoles.length > 0 &&
    !isLoadingContacts &&
    !isSavingContact &&
    !isContinuing;

  function toggleRoleSelection(roleId: SquadPersona) {
    setError(null);
    setSelectedRoles((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  function startEditingMember(member: SquadMember) {
    setEditingMemberId(member.id);
    setName(member.name);
    setEmail(member.email);
    setSelectedRoles(member.roles);
    setNotes(member.notes);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function resetContactForm() {
    setEditingMemberId(null);
    setName('');
    setEmail('');
    setSelectedRoles([]);
    setNotes('');
    setError(null);
  }

  async function handleSaveContact() {
    if (!canSubmitContact) return;

    setIsSavingContact(true);
    setError(null);

    const roleLabels: string[] = selectedRoles
      .map((id) => SQUAD_ROLES.find((r) => r.id === id)?.label)
      .filter((label): label is NonNullable<typeof label> => Boolean(label));

    const squadContext: SquadRoleContext = {
      personas: selectedRoles,
      persona_labels: roleLabels,
      // Keep primary legacy keys populated for backward compatibility
      persona: selectedRoles[0],
      persona_label: roleLabels[0],
      notes: notes.trim() || undefined,
    };

    try {
      if (editingMemberId) {
        const result = await updateUserContact(editingMemberId, {
          name: normalizedName,
          email: normalizedEmail,
          context: { squad: squadContext },
        });

        const updated = mapContactToMember(result.contact);
        setMembers((current) =>
          current.map((m) => (m.id === editingMemberId ? updated : m)),
        );
      } else {
        const result = await createUserContact({
          name: normalizedName,
          email: normalizedEmail,
          roles: ['squad'],
          context: { squad: squadContext },
          contact_details: {},
          status: 'not_invited',
        });

        const created = mapContactToMember(result.contact);
        setMembers((current) => [...current, created]);
      }

      resetContactForm();
    } catch (err) {
      console.error('[SQUAD SAVE CONTACT]', err);
      setError(
        editingMemberId
          ? 'We couldn’t update this person. Please try again.'
          : 'We couldn’t add this person. Please try again.',
      );
    } finally {
      setIsSavingContact(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (removingId || isSavingContact) return;

    setRemovingId(memberId);
    setError(null);

    try {
      await deleteUserContact(memberId);
      setMembers((current) => current.filter((m) => m.id !== memberId));
      if (editingMemberId === memberId) {
        resetContactForm();
      }
    } catch (err) {
      console.error('[SQUAD DELETE CONTACT]', err);
      setError('We couldn’t remove this person. Please try again.');
    } finally {
      setRemovingId(null);
    }
  }

  // Invite Modal Helpers
  function openInviteModal(member: SquadMember) {
    setInviteTarget(member);
    setInviteMessage(
      member.invitationMessage || buildDefaultInviteMessage(member),
    );
    setCopiedInvite(false);
    setError(null);

    if (member.invitationToken && typeof window !== 'undefined') {
      setInviteLink(
        `${window.location.origin}/squad/join?contactId=${member.id}&token=${member.invitationToken}`,
      );
    } else {
      setInviteLink(null);
    }
  }

  async function handlePrepareInvite() {
    if (!inviteTarget || !inviteMessage.trim() || isPreparingInvite) return;

    setIsPreparingInvite(true);
    setError(null);

    try {
      const res = await inviteContact(inviteTarget.id, inviteMessage.trim());
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const generatedLink = res.confirmationToken
        ? `${origin}/squad/join?contactId=${inviteTarget.id}&token=${res.confirmationToken}`
        : inviteLink;

      if (generatedLink) {
        setInviteLink(generatedLink);
      }

      setMembers((current) =>
        current.map((m) =>
          m.id === inviteTarget.id
            ? {
                ...m,
                status: res.status,
                invitationMessage: inviteMessage.trim(),
                invitationToken: res.confirmationToken ?? m.invitationToken,
              }
            : m,
        ),
      );

      if (generatedLink && typeof navigator !== 'undefined') {
        const fullCopyText = `${inviteMessage.trim()}\n\nJoin my squad here: ${generatedLink}`;
        await navigator.clipboard?.writeText(fullCopyText);
        setCopiedInvite(true);
      }
    } catch (err) {
      console.error('[SQUAD PREPARE INVITE]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not prepare the invitation link.',
      );
    } finally {
      setIsPreparingInvite(false);
    }
  }

  // Community Forum & LinkedIn Helpers
  function openForumComposer() {
    const missingLabels = missingRoles.map((r) => r.label);
    setForumTitle(
      missingLabels.length > 0 && missingLabels.length < SQUAD_ROLES.length
        ? `Looking for ${missingLabels.slice(0, 2).join(' & ')} for my Urge squad`
        : 'Looking to connect with fellow builders to form a squad',
    );
    setForumBody(
      missingLabels.length > 0
        ? `Hi everyone — I’m working through Mission 1 on Urge and putting together a small accountability and feedback squad.\n\nRight now I’m especially looking for peers who can bring:\n${missingRoles.map((r) => `• ${r.label}: ${r.description}`).join('\n')}\n\nIf you’re also building or exploring an idea and want to swap honest feedback and weekly check-ins, reply below!`
        : `Hi everyone — I’m working through Mission 1 on Urge and looking to connect with a few thoughtful peers to form a small accountability and feedback squad.\n\nHappy to act as a sounding board or accountability partner in return. Reply if you’d like to team up!`,
    );
    setActiveOutreach('forum');
    setError(null);
  }

  async function handlePublishForumPost() {
    if (!forumBody.trim() || isPublishingForum) return;

    setIsPublishingForum(true);
    setError(null);

    try {
      const result = await createUserContent({
        title: forumTitle.trim() || 'Looking for squad peers',
        body: forumBody.trim(),
        category: 'introduction',
        status: 'published',
        source_type: 'program_node',
        metadata: {
          node_key: nodeKey,
          seeking_squad: true,
          missing_roles: missingRoles.map((r) => r.id),
        },
      });

      setForumPostId(result.content.id);
      setActiveOutreach(null);
    } catch (err) {
      console.error('[SQUAD FORUM POST]', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not publish your introduction post.',
      );
    } finally {
      setIsPublishingForum(false);
    }
  }

  function openLinkedInComposer() {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://urge.start';
    const missingLabels = missingRoles.map((r) => r.label);
    setLinkedInDraft(
      `I’m starting a new entrepreneurial journey and building a small personal "squad" of people who keep me honest, share hard-earned perspective, and open doors.\n\n${
        missingLabels.length > 0 && missingLabels.length < SQUAD_ROLES.length
          ? `Right now I’m especially grateful for voices who bring ${missingLabels.join(', ')}.\n\n`
          : ''
      }If you’re building something too—or enjoy being a candid sounding board—I’d love to connect and swap notes.\n\n${origin}`,
    );
    setCopiedLinkedIn(false);
    setActiveOutreach('linkedin');
    setError(null);
  }

  async function handleCopyAndShareLinkedIn() {
    if (!linkedInDraft.trim()) return;

    if (typeof navigator !== 'undefined') {
      await navigator.clipboard?.writeText(linkedInDraft.trim());
      setCopiedLinkedIn(true);
    }

    setSharedOnLinkedIn(true);

    if (typeof window !== 'undefined') {
      const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
        linkedInDraft.trim(),
      )}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleContinue() {
    if (!canContinue) return;

    setIsContinuing(true);
    setError(null);

    try {
      await onComplete({
        members,
        forumPostId: forumPostId ?? undefined,
        sharedOnLinkedIn,
        completed: true,
      });
    } catch (err) {
      console.error(err);
      setError('We couldn’t save your progress. Please try again.');
      setIsContinuing(false);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-10 pb-16">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Build Your Support Circle
        </p>

        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || 'Who could help you move?'}
        </h1>

        {node.description && (
          <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
            {node.description}
          </p>
        )}

        <p className="text-base leading-7 text-muted-foreground">
          You don’t need a co-founder or a big team. Think about specific people
          in your life—one person can easily play more than one role. Aim to
          cover all five roles below, or post to the Urge community to find
          peers to build alongside.
        </p>
      </header>

      {/* 5 Roles Coverage Strip */}
      <section className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Squad Role Coverage ({coveredRoles.size} of {SQUAD_ROLES.length})
          </p>
          {allRolesCovered && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Check className="h-3.5 w-3.5" />
              All roles covered
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SQUAD_ROLES.map((role) => {
            const isCovered = coveredRoles.has(role.id);
            return (
              <span
                key={role.id}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  isCovered
                    ? 'border-primary/30 bg-primary/10 text-foreground'
                    : 'border-dashed border-border bg-background text-muted-foreground',
                ].join(' ')}
              >
                {isCovered ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                )}
                {role.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* STEP 1 -> STEP 2: Add / Edit Person First, Then Pick Role(s) */}
      <section
        ref={formRef}
        className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">
                {editingMemberId
                  ? 'Edit squad member'
                  : members.length > 0
                    ? 'Add another person to your squad'
                    : 'Add someone to your squad'}
              </h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Start with who you have in mind, then select all the roles they
              could play for you.
            </p>
          </div>

          {editingMemberId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetContactForm}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Cancel edit
            </Button>
          )}
        </div>

        {/* Person Details First */}
        <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="e.g. Rohan Sharma"
                className="h-11 pl-10 text-base"
                disabled={isLoadingContacts || isSavingContact || isContinuing}
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
                placeholder="name@example.com"
                className="h-11 pl-10 text-base"
                disabled={isLoadingContacts || isSavingContact || isContinuing}
              />
            </div>
          </div>
        </div>

        {emailAlreadyAdded && (
          <p className="text-sm text-destructive">
            You’ve already added this email address. Click Edit on their card
            below to update their roles.
          </p>
        )}

        {/* Multi-Role Selection Second */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Which role(s) could {normalizedName || 'this person'} play?
            </label>
            <p className="text-xs text-muted-foreground">
              Select one or more. One person often wears two or three hats.
            </p>
          </div>

          <div className="space-y-2.5">
            {SQUAD_ROLES.map((role) => {
              const selected = selectedRoles.includes(role.id);
              const alreadyCoveredByOther =
                !selected &&
                members.some(
                  (m) =>
                    m.id !== editingMemberId && m.roles.includes(role.id),
                );

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRoleSelection(role.id)}
                  disabled={
                    isLoadingContacts || isSavingContact || isContinuing
                  }
                  aria-pressed={selected}
                  className={[
                    'w-full rounded-xl border p-3.5 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/50',
                      ].join(' ')}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{role.label}</p>
                        {alreadyCoveredByOther && (
                          <span className="text-[11px] text-muted-foreground">
                            Covered
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {role.description}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {role.example}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label htmlFor="squad-notes" className="text-sm font-medium">
            Why them?{' '}
            <span className="font-normal text-muted-foreground">
              (Optional note for yourself)
            </span>
          </label>
          <Input
            id="squad-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Always gives direct feedback without sugarcoating"
            maxLength={240}
            disabled={isLoadingContacts || isSavingContact || isContinuing}
            className="h-10 text-sm"
          />
        </div>

        {error && !inviteTarget && !activeOutreach && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={() => void handleSaveContact()}
          disabled={!canSubmitContact}
          className="h-12 w-full gap-2 rounded-full text-base"
        >
          {isLoadingContacts ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your squad...
            </>
          ) : isSavingContact ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {editingMemberId ? 'Saving changes...' : 'Adding person...'}
            </>
          ) : editingMemberId ? (
            <>
              <Check className="h-4 w-4" />
              Save changes
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to my squad
            </>
          )}
        </Button>
      </section>

      {/* Current Squad List */}
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
                const isRemovingThis = removingId === member.id;

                return (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-base">
                            {member.name || member.email}
                          </p>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {member.status === 'accepted'
                              ? 'Joined'
                              : member.status === 'prepared' ||
                                  member.status === 'sent'
                                ? 'Invite ready'
                                : 'Not invited yet'}
                          </span>
                        </div>

                        <p className="truncate text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openInviteModal(member)}
                          className="h-8 gap-1.5 rounded-full text-xs text-primary hover:text-primary"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Invite
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${member.name}`}
                          onClick={() => startEditingMember(member)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${member.name}`}
                          disabled={isRemovingThis}
                          onClick={() => void handleRemoveMember(member.id)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                        >
                          {isRemovingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Assigned Role Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {member.roles.length > 0 ? (
                        member.roles.map((roleId) => {
                          const roleMeta = SQUAD_ROLES.find(
                            (r) => r.id === roleId,
                          );
                          return (
                            <span
                              key={roleId}
                              className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground"
                            >
                              {roleMeta?.label ?? roleId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No roles assigned yet — click Edit to pick roles
                        </span>
                      )}
                    </div>

                    {member.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{member.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Safety Valve: Urge Community Forum & LinkedIn Outreach */}
      <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-semibold">
            Don’t have someone for every role—or prefer building with peers?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Not everyone has a full circle ready on day one. You can introduce
            yourself in the Urge Community Forum to team up with other builders,
            or share an open call on LinkedIn.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={forumPostId ? 'secondary' : 'outline'}
            onClick={openForumComposer}
            className="gap-2 rounded-full"
          >
            {forumPostId ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                Posted on Urge Forum
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4 text-primary" />
                Post in Urge Community Forum
              </>
            )}
          </Button>

          <Button
            type="button"
            variant={sharedOnLinkedIn ? 'secondary' : 'outline'}
            onClick={openLinkedInComposer}
            className="gap-2 rounded-full"
          >
            {sharedOnLinkedIn ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                LinkedIn post copied
              </>
            ) : (
              <>
                <LinkedinBoxFillIcon className="h-4 w-4 text-primary" />
                Share open call on LinkedIn
              </>
            )}
          </Button>
        </div>

        {/* Inline Forum Post Composer */}
        {activeOutreach === 'forum' && (
          <div className="mt-4 rounded-xl border border-border bg-background p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  Publish introduction to Urge Community Forum
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveOutreach(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                value={forumTitle}
                onChange={(e) => setForumTitle(e.target.value)}
                placeholder="Post title"
                maxLength={200}
                disabled={isPublishingForum}
              />

              <SpeechTextarea
                value={forumBody}
                onChange={(e) => setForumBody(e.target.value)}
                rows={6}
                disabled={isPublishingForum}
                className="resize-y text-sm leading-6"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveOutreach(null)}
                disabled={isPublishingForum}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handlePublishForumPost()}
                disabled={!forumBody.trim() || isPublishingForum}
                className="gap-2 rounded-full"
              >
                {isPublishingForum ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publish to Forum
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Inline LinkedIn Composer */}
        {activeOutreach === 'linkedin' && (
          <div className="mt-4 rounded-xl border border-border bg-background p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkedinBoxFillIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  Share an open call on LinkedIn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveOutreach(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SpeechTextarea
              value={linkedInDraft}
              onChange={(e) => setLinkedInDraft(e.target.value)}
              rows={6}
              className="resize-y text-sm leading-6"
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveOutreach(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => void handleCopyAndShareLinkedIn()}
                disabled={!linkedInDraft.trim()}
                className="gap-2 rounded-full"
              >
                {copiedLinkedIn ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied &amp; Opened LinkedIn
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Copy &amp; Open LinkedIn
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Footer & Continue Gate */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {coveredRoles.size}/5
          </div>

          <div className="flex-1">
            <p className="font-medium">
              {isLoadingContacts
                ? 'Loading your squad'
                : allRolesCovered
                  ? 'All five squad roles are covered'
                  : hasCommunityOutreach
                    ? 'You’ve opened a call to the community'
                    : `Cover ${missingRoles.length} remaining ${
                        missingRoles.length === 1 ? 'role' : 'roles'
                      } or post in the Urge Forum to continue`}
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {allRolesCovered || hasCommunityOutreach
                ? 'You can still add, edit, or invite squad members anytime.'
                : `Still open: ${missingRoles.map((r) => r.label).join(', ')}.`}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!canContinue}
            className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
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

      {/* Invite & Share Link Modal */}
      {inviteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPreparingInvite) {
              setInviteTarget(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Invite to Squad
                </p>
                <h2 className="font-heading text-2xl font-semibold">
                  Invite {inviteTarget.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Personalize your note, generate a shareable invite link, or
                  open it directly in your email app.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInviteTarget(null)}
                disabled={isPreparingInvite}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Invitation message</label>
              <SpeechTextarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={6}
                disabled={isPreparingInvite}
                className="resize-y text-sm leading-6"
              />
            </div>

            {inviteLink && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Shareable joining link
                </p>
                <p className="break-all font-mono text-xs text-foreground">
                  {inviteLink}
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
              <a
                href={`mailto:${encodeURIComponent(
                  inviteTarget.email,
                )}?subject=${encodeURIComponent(
                  'Would you join my personal squad?',
                )}&body=${encodeURIComponent(
                  inviteLink
                    ? `${inviteMessage}\n\nJoin my squad here: ${inviteLink}`
                    : inviteMessage,
                )}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                Open in Email App
              </a>

              <Button
                type="button"
                onClick={() => void handlePrepareInvite()}
                disabled={!inviteMessage.trim() || isPreparingInvite}
                className="h-10 gap-2 rounded-full px-6"
              >
                {isPreparingInvite ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing link...
                  </>
                ) : copiedInvite ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied message &amp; link
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Prepare &amp; copy invite link
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SquadBuilder;
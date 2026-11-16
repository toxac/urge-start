'use server';

import crypto from 'crypto';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  SquadPersona,
  UserContactDetails,
  UserContactStatus,
} from '@/lib/types/user-contacts';

export type InvitedRoleDetail = {
  id: SquadPersona;
  label: string;
  description: string;
};

export type PublicSquadInvitation = {
  contactId: string;
  inviteeName: string;
  founderName: string;
  founderAvatarUrl: string | null;
  founderLocation: string | null;
  roles: InvitedRoleDetail[];
  invitationMessage: string;
  status: UserContactStatus;
  replyNote: string | null;
};

export type SquadInvitationLookupResult =
  | { state: 'valid'; invitation: PublicSquadInvitation }
  | { state: 'already_accepted'; invitation: PublicSquadInvitation }
  | { state: 'declined'; invitation: PublicSquadInvitation }
  | { state: 'invalid' };

const SQUAD_ROLE_CATALOG: Record<SquadPersona, InvitedRoleDetail> = {
  believer: {
    id: 'believer',
    label: 'The Believer',
    description: 'Reminds you why you started. Lifts you when you’re low.',
  },
  challenger: {
    id: 'challenger',
    label: 'The Challenger',
    description: 'Asks hard questions. Pokes holes. Keeps you honest.',
  },
  guide: {
    id: 'guide',
    label: 'The Guide',
    description: 'Has walked a similar path. Shares experience, not answers.',
  },
  doer: {
    id: 'doer',
    label: 'The Doer',
    description: 'Keeps you accountable. Checks in on actions, not feelings.',
  },
  connector: {
    id: 'connector',
    label: 'The Connector',
    description: 'Opens doors. Knows people. Makes introductions.',
  },
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tokensMatch(provided: string, stored: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function extractInvitedRoles(context: unknown): InvitedRoleDetail[] {
  if (!isObject(context) || !isObject(context.squad)) return [];

  const squad = context.squad;
  const rawPersonas = Array.isArray(squad.personas)
    ? squad.personas
    : typeof squad.persona === 'string'
      ? [squad.persona]
      : [];

  return rawPersonas
    .filter(
      (id): id is SquadPersona =>
        typeof id === 'string' && id in SQUAD_ROLE_CATALOG,
    )
    .map((id) => SQUAD_ROLE_CATALOG[id]);
}

async function fetchFounderPublicInfo(userId: string) {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('user_profile_public')
    .select('display_name, username, avatar_url, city, country')
    .eq('user_id', userId)
    .maybeSingle();

  const founderName =
    data?.display_name?.trim() ||
    data?.username?.trim() ||
    'Your friend';

  const locationParts = [data?.city?.trim(), data?.country?.trim()].filter(
    Boolean,
  );

  return {
    founderName,
    founderAvatarUrl: data?.avatar_url ?? null,
    founderLocation:
      locationParts.length > 0 ? locationParts.join(', ') : null,
  };
}

export async function getSquadInvitation(
  contactId: string,
  token: string,
): Promise<SquadInvitationLookupResult> {
  if (!contactId || !UUID_REGEX.test(contactId)) {
    return { state: 'invalid' };
  }

  const supabase = createSupabaseAdminClient();

  const { data: contact, error } = await supabase
    .from('user_contacts')
    .select('id, user_id, name, status, context, contact_details')
    .eq('id', contactId)
    .maybeSingle();

  if (error || !contact) {
    return { state: 'invalid' };
  }

  const status = contact.status as UserContactStatus;
  const details = isObject(contact.contact_details)
    ? (contact.contact_details as UserContactDetails)
    : {};

  const founderInfo = await fetchFounderPublicInfo(contact.user_id);

  const invitation: PublicSquadInvitation = {
    contactId: contact.id,
    inviteeName: contact.name?.trim() || 'there',
    founderName: founderInfo.founderName,
    founderAvatarUrl: founderInfo.founderAvatarUrl,
    founderLocation: founderInfo.founderLocation,
    roles: extractInvitedRoles(contact.context),
    invitationMessage:
      typeof details.invitation_message === 'string'
        ? details.invitation_message
        : '',
    status,
    replyNote:
      typeof details.invitee_reply_note === 'string'
        ? details.invitee_reply_note
        : null,
  };

  if (status === 'accepted') {
    return { state: 'already_accepted', invitation };
  }

  if (status === 'declined') {
    return { state: 'declined', invitation };
  }

  if (status !== 'prepared' && status !== 'sent') {
    return { state: 'invalid' };
  }

  const storedToken = details.invitation_token;
  if (
    !token ||
    typeof storedToken !== 'string' ||
    !tokensMatch(token.trim(), storedToken)
  ) {
    return { state: 'invalid' };
  }

  return { state: 'valid', invitation };
}

export async function respondToSquadInvitation(input: {
  contactId: string;
  token: string;
  decision: 'accepted' | 'declined';
  replyNote?: string;
}) {
  const { contactId, token, decision, replyNote } = input;

  if (!contactId || !UUID_REGEX.test(contactId) || !token) {
    throw new Error('This invitation link is invalid.');
  }

  const supabase = createSupabaseAdminClient();

  const { data: contact, error: fetchError } = await supabase
    .from('user_contacts')
    .select('id, status, contact_details')
    .eq('id', contactId)
    .maybeSingle();

  if (fetchError || !contact) {
    throw new Error('Invitation not found.');
  }

  if (contact.status === 'accepted' || contact.status === 'declined') {
    return {
      success: true,
      status: contact.status as UserContactStatus,
    };
  }

  if (contact.status !== 'prepared' && contact.status !== 'sent') {
    throw new Error('This invitation is no longer active.');
  }

  const details = isObject(contact.contact_details)
    ? (contact.contact_details as UserContactDetails)
    : {};

  const storedToken = details.invitation_token;
  if (
    typeof storedToken !== 'string' ||
    !tokensMatch(token.trim(), storedToken)
  ) {
    throw new Error('This invitation link is invalid or has expired.');
  }

  const trimmedNote = replyNote?.trim();
  const nowIso = new Date().toISOString();

  const updatedDetails: UserContactDetails = {
    ...details,
    invitation_token: null,
    ...(decision === 'accepted'
      ? { invitation_accepted_at: nowIso }
      : { invitation_declined_at: nowIso }),
    ...(trimmedNote ? { invitee_reply_note: trimmedNote } : {}),
  };

  const { data: updated, error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: decision,
      contact_details: updatedDetails,
    })
    .eq('id', contactId)
    .eq('status', contact.status)
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    throw new Error(
      'We could not record your response right now. Please try again.',
    );
  }

  return {
    success: true,
    status: decision,
  };
}
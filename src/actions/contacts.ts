
'use server';

import crypto from 'crypto';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CreateUserContactInput,
  UserContact,
  UserContactDetails,
  UserContactStatus,
} from '@/lib/types/user-contacts';

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getContactDetails(value: unknown): UserContactDetails {
  return isObject(value)
    ? (value as UserContactDetails)
    : {};
}

export async function createUserContact(
  input: CreateUserContactInput,
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_contacts')
    .insert({
      ...input,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save contact: ${error.message}`);
  }

  return {
    success: true,
    contact: data as unknown as UserContact,
  };
}

export async function createUserContacts(
  contacts: CreateUserContactInput[],
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (contacts.length === 0) {
    return {
      success: true,
      contacts: [],
    };
  }

  const contactsToInsert = contacts.map((contact) => ({
    ...contact,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('user_contacts')
    .insert(contactsToInsert)
    .select();

  if (error) {
    throw new Error(`Failed to save contacts: ${error.message}`);
  }

  return {
    success: true,
    contacts: data as unknown as UserContact[],
  };
}

/**
 * Prepare an invitation for a contact.
 *
 * This does not send an email.
 * It creates a confirmation token and changes the status:
 *
 * not_invited -> prepared
 */
export async function inviteContact(
  contactId: string,
  message: string,
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: contact, error: contactError } = await supabase
    .from('user_contacts')
    .select('id, status, contact_details')
    .eq('id', contactId)
    .eq('user_id', user.id)
    .single();

  if (contactError || !contact) {
    throw new Error('Contact not found');
  }

  if (contact.status === 'prepared' || contact.status === 'sent') {
    return {
      success: true,
      status: contact.status as UserContactStatus,
      message: 'An invitation has already been prepared.',
    };
  }

  if (contact.status !== 'not_invited') {
    throw new Error(
      `Contact cannot be invited from status "${contact.status}".`,
    );
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const contactDetails = getContactDetails(contact.contact_details);

  const updatedContactDetails: UserContactDetails = {
    ...contactDetails,
    invitation_token: invitationToken,
    invitation_message: message,
  };

  const { data: updatedContact, error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: 'prepared',
      contact_details: updatedContactDetails,
    })
    .eq('id', contactId)
    .eq('user_id', user.id)
    .eq('status', 'not_invited')
    .select('id')
    .maybeSingle();

  if (updateError) {
    throw new Error(
      `Failed to prepare invitation: ${updateError.message}`,
    );
  }

  if (!updatedContact) {
    throw new Error(
      'The contact status changed before the invitation could be prepared. Please try again.',
    );
  }

  return {
    success: true,
    status: 'prepared' as const,
    confirmationToken: invitationToken,
  };
}

/**
 * Confirm a prepared invitation.
 *
 * This changes the status:
 *
 * prepared -> accepted
 *
 * The caller must have permission to update the contact under RLS.
 * Public confirmation will need a suitable server-side authorization
 * mechanism if the recipient is not authenticated as the contact owner.
 */
export async function confirmContactInvitation(
  contactId: string,
  invitationToken: string,
) {
  if (!contactId || !invitationToken) {
    throw new Error('Invalid invitation.');
  }

  const supabase = await createSupabaseServerClient();

  const { data: contact, error: contactError } = await supabase
    .from('user_contacts')
    .select('id, status, contact_details')
    .eq('id', contactId)
    .maybeSingle();

  if (contactError || !contact) {
    throw new Error('Invitation not found.');
  }

  if (contact.status === 'accepted') {
    return {
      success: true,
      status: 'accepted' as const,
    };
  }

  if (contact.status !== 'prepared' && contact.status !== 'sent') {
    throw new Error('This invitation is no longer active.');
  }

  const contactDetails = getContactDetails(contact.contact_details);
  const storedToken = contactDetails.invitation_token;

  if (
    typeof storedToken !== 'string' ||
    storedToken !== invitationToken
  ) {
    throw new Error('Invalid invitation.');
  }

  const updatedContactDetails: UserContactDetails = {
    ...contactDetails,
    invitation_token: null,
    invitation_accepted_at: new Date().toISOString(),
  };

  const { data: updatedContact, error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: 'accepted',
      contact_details: updatedContactDetails,
    })
    .eq('id', contactId)
    .eq('status', contact.status)
    .select('id')
    .maybeSingle();

  if (updateError) {
    throw new Error(
      `Failed to confirm invitation: ${updateError.message}`,
    );
  }

  if (!updatedContact) {
    throw new Error(
      'The invitation could not be confirmed. It may have already changed.',
    );
  }

  return {
    success: true,
    status: 'accepted' as const,
  };
}



/**
 * Fetch the authenticated user's squad contacts.
 * The database is the source of truth for contact records.
 */
export async function getUserContacts(): Promise<UserContact[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_contacts')
    .select('*')
    .eq('user_id', user.id)
    .contains('roles', ['squad'])
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load squad contacts: ${error.message}`);
  }

  return (data ?? []) as unknown as UserContact[];
}

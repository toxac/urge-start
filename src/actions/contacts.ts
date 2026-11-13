
'use server';

import crypto from 'crypto';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CreateUserContactInput,
  UpdateUserContactInput,
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

  if (contact.status !== 'not_invited' && contact.status !== 'prepared') {
    return {
      success: true,
      status: contact.status as UserContactStatus,
      message: 'This invitation has already been sent or responded to.',
    };
  }

  const contactDetails = getContactDetails(contact.contact_details);
  const existingToken =
    typeof contactDetails.invitation_token === 'string' &&
    contactDetails.invitation_token
      ? contactDetails.invitation_token
      : crypto.randomBytes(32).toString('hex');

  const updatedContactDetails: UserContactDetails = {
    ...contactDetails,
    invitation_token: existingToken,
    invitation_message: message,
  };

  const { error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: 'prepared',
      contact_details: updatedContactDetails,
    })
    .eq('id', contactId)
    .eq('user_id', user.id);

  if (updateError) {
    throw new Error(`Failed to prepare invitation: ${updateError.message}`);
  }

  return {
    success: true,
    status: 'prepared' as const,
    confirmationToken: existingToken,
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



export async function updateUserContact(
  contactId: string,
  input: UpdateUserContactInput,
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
    .update(input)
    .eq('id', contactId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  return {
    success: true,
    contact: data as unknown as UserContact,
  };
}

export async function deleteUserContact(contactId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('user_contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }

  return { success: true };
}

'use server';

import crypto from 'crypto';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CreateUserContactInput,
  UserContact,
} from '@/lib/types/user-contacts';

export async function createUserContact(
  input: CreateUserContactInput
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
    contact: data as UserContact,
  };
}

export async function createUserContacts(
  contacts: CreateUserContactInput[]
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
    contacts: data as UserContact[],
  };
}

/**
 * Prepare a contact invitation.
 *
 * For now this does not send an email.
 * It creates the confirmation token and moves the contact:
 *
 * pending → invited
 *
 * The token will eventually be included in the confirmation
 * link sent by email.
 */
export async function inviteContact(
  contactId: string,
  message: string
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

  if (contact.status === 'invited') {
    return {
      success: true,
      status: 'invited' as const,
      message: 'Invitation has already been prepared.',
    };
  }

  if (contact.status !== 'pending') {
    throw new Error(
      `Contact cannot be invited from status "${contact.status}".`
    );
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');

  const contactDetails =
    contact.contact_details &&
    typeof contact.contact_details === 'object' &&
    !Array.isArray(contact.contact_details)
      ? contact.contact_details
      : {};

  const updatedContactDetails = {
    ...contactDetails,
    invitation_token: invitationToken,
    invitation_message: message,
  };

  const { error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: 'invited',
      contact_details: updatedContactDetails,
    })
    .eq('id', contactId)
    .eq('user_id', user.id);

  if (updateError) {
    throw new Error(
      `Failed to prepare invitation: ${updateError.message}`
    );
  }

  return {
    success: true,
    status: 'invited' as const,
    confirmationToken: invitationToken,
  };
}

/**
 * Confirm a contact invitation.
 *
 * This will eventually be called by the public confirmation
 * page reached through the email invitation link.
 *
 * invited → accepted
 */
export async function confirmContactInvitation(
  contactId: string,
  invitationToken: string
) {
  if (!contactId || !invitationToken) {
    throw new Error('Invalid invitation.');
  }

  const supabase = await createSupabaseServerClient();

  const { data: contact, error: contactError } = await supabase
    .from('user_contacts')
    .select('id, status, contact_details')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error('Invitation not found.');
  }

  if (contact.status === 'accepted') {
    return {
      success: true,
      status: 'accepted' as const,
    };
  }

  if (contact.status !== 'invited') {
    throw new Error('This invitation is no longer active.');
  }

  const contactDetails =
    contact.contact_details &&
    typeof contact.contact_details === 'object' &&
    !Array.isArray(contact.contact_details)
      ? contact.contact_details
      : {};

  const storedToken = contactDetails.invitation_token;

  if (
    typeof storedToken !== 'string' ||
    storedToken !== invitationToken
  ) {
    throw new Error('Invalid invitation.');
  }

  const updatedContactDetails = {
    ...contactDetails,
    invitation_token: null,
    invitation_accepted_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('user_contacts')
    .update({
      status: 'accepted',
      contact_details: updatedContactDetails,
    })
    .eq('id', contactId)
    .eq('status', 'invited');

  if (updateError) {
    throw new Error(
      `Failed to confirm invitation: ${updateError.message}`
    );
  }

  return {
    success: true,
    status: 'accepted' as const,
  };
}
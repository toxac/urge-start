'use server';

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
 * Temporary placeholder for the future notification/invitation system.
 * This deliberately does not send anything yet.
 */
export async function inviteContact(
  contactId: string,
  message: string
) {
  console.log(`[INVITE MOCK] Contact: ${contactId}`);
  console.log(`[INVITE MOCK] Message: "${message}"`);

  return {
    success: true,
  };
}
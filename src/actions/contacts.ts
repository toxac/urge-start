'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function inviteSquad(emails: string[], message: string, sourceNodeKey: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // Map to the actual user_contacts schema requirements
  const contactsToInsert = emails.filter(Boolean).map(email => ({
    user_id: user.id,
    name: email.trim(), // 'name' is required, so we default to the email address
    role: 'squad',
    context: `Invited from ${sourceNodeKey}`,
    contact_details: {
      email: email.trim(),
      status: 'invited',
      source_node: sourceNodeKey
    }
  }));

  if (contactsToInsert.length > 0) {
    const { error: dbError } = await supabase.from('user_contacts').insert(contactsToInsert);
    if (dbError) throw new Error(`Failed to save contacts: ${dbError.message}`);
  }

  // 2. Trigger Email Sending (Mocked for now)
  console.log(`[EMAIL MOCK] Sending squad invites to ${emails.join(', ')}`);
  console.log(`[EMAIL MOCK] Message: "${message}"`);

  return { success: true };
}
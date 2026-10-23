'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import type { CustomerInteraction } from '@/lib/types/interactions';

async function context() {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized');
    return { supabase, user };
}


export async function getInterviewContacts(): Promise<Array<{ id: string; name: string }>> {
    const { supabase, user } = await context();
    const { data, error } = await supabase.from('user_contacts')
        .select('id,name').eq('user_id', user.id).order('name', { ascending: true });
    if (error) throw new Error(`Failed to load contacts: ${error.message}`);
    return data ?? [];
}

export async function getOpportunityInteractions(opportunityId: string): Promise<CustomerInteraction[]> {
    const { supabase, user } = await context();
    const { data, error } = await (supabase as any).from('user_interactions').select('*')
        .eq('user_id', user.id).eq('opportunity_id', opportunityId)
        .order('interaction_at', { ascending: false });
    if (error) throw new Error(`Failed to load notes: ${error.message}`);
    return (data ?? []) as CustomerInteraction[];
}

export async function saveOpportunityInteraction(input: {
    opportunityId: string; contactId?: string | null; notes: string; id?: string;
}) {
    const { supabase, user } = await context();
    const notes = input.notes.trim();
    if (!input.opportunityId || !notes) throw new Error('Choose an opportunity and add a note.');
    const { data: opportunity } = await supabase.from('user_opportunities').select('id')
        .eq('id', input.opportunityId).eq('user_id', user.id).maybeSingle();
    if (!opportunity) throw new Error('Opportunity not found.');
    if (input.contactId) {
        const { data: contact } = await supabase.from('user_contacts').select('id')
            .eq('id', input.contactId).eq('user_id', user.id).maybeSingle();
        if (!contact) throw new Error('Contact not found.');
    }
    const row = {
        user_id: user.id, opportunity_id: input.opportunityId,
        contact_id: input.contactId || null, notes
    };
    const base = (supabase as any).from('user_interactions');
    const query = input.id
        ? base.update(row).eq('id', input.id).eq('user_id', user.id)
        : base.insert(row);
    const { data, error } = await query.select('*').single();
    
    if (error) throw new Error(`Failed to save note: ${error.message}`);
    return data as CustomerInteraction;
}

export async function saveOpportunityReflection(opportunityId: string, reflection: string) {
    const { supabase, user } = await context();
    const { data, error } = await (supabase as any).from('user_opportunities')
        .update({ customer_interaction_reflection: reflection.trim() })
        .eq('id', opportunityId).eq('user_id', user.id).select('id').maybeSingle();
    if (error) throw new Error(`Failed to save reflection: ${error.message}`);
    if (!data) throw new Error('Opportunity not found.');
}
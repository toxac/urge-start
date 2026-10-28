'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserProject } from '@/lib/stores/projects';

export async function createProjectFromOpportunity(params: {
  opportunityId: string;
  title: string;
  description: string;
  forwardQuestion?: string;
}): Promise<UserProject> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // 1. Fetch opportunity to snapshot details
  const { data: opp, error: oppErr } = await supabase
    .from('user_opportunities')
    .select('*')
    .eq('id', params.opportunityId)
    .eq('user_id', user.id)
    .single();

  if (oppErr || !opp) throw new Error('Opportunity not found');

  // 2. Insert into user_projects
  const { data: project, error: projErr } = await supabase
    .from('user_projects')
    .insert({
      user_id: user.id,
      opportunity_id: params.opportunityId,
      title: params.title.trim(),
      description: params.description.trim(),
      metadata: {
        forward_question: params.forwardQuestion?.trim() || null,
        opportunity_snapshot: {
          problem: opp.problem || opp.title,
          problem_details: opp.problem_details,
          approach: (opp.metadata as Record<string, any>)?.approach || null,
          feasibility: (opp.metadata as Record<string, any>)?.feasibility || null,
        },
      },
    })
    .select('*')
    .single();

  if (projErr) throw new Error(`Failed to create project: ${projErr.message}`);

  // 3. Mark opportunity as testing
  await supabase
    .from('user_opportunities')
    .update({ status: 'testing', updated_at: new Date().toISOString() })
    .eq('id', params.opportunityId)
    .eq('user_id', user.id);

  return project;
}

export async function getActiveProject(): Promise<UserProject | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
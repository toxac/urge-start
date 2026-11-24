'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/database.types';
import {
  mapUserProjectOfferRow,
  mapUserProjectRow,
  type Mission4ContextSummary,
  type UserProject,
  type UserProjectMetadata,
  type UserProjectOffer,
  type UserProjectOfferMetadata,
} from '@/lib/types/projects';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function createProjectFromOpportunity(params: {
  opportunityId: string;
  title: string;
  description: string;
  forwardQuestion?: string;
}): Promise<UserProject> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // 1. Fetch opportunity to snapshot details
  const { data: opp, error: oppErr } = await supabase
    .from('user_opportunities')
    .select('*')
    .eq('id', params.opportunityId)
    .eq('user_id', user.id)
    .single();

  if (oppErr || !opp) throw new Error('Opportunity not found');

  const oppMetadata = asRecord(opp.metadata);

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
          approach: oppMetadata.approach || null,
          feasibility: oppMetadata.feasibility || null,
        },
      } as unknown as Json,
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

  return mapUserProjectRow(project);
}

export async function getActiveProject(): Promise<UserProject | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapUserProjectRow(data) : null;
}

export async function fetchUserProjects(): Promise<UserProject[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return (data ?? []).map(mapUserProjectRow);
}

export async function fetchUserProjectOffers(
  projectId?: string,
): Promise<UserProjectOffer[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('user_project_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch project offers: ${error.message}`);
  }

  return (data ?? []).map(mapUserProjectOfferRow);
}

export async function updateUserProjectMetadata(
  projectId: string,
  metadataPatch: Partial<UserProjectMetadata>,
  options?: {
    title?: string;
    description?: string | null;
    selectedOfferId?: string | null;
  },
): Promise<UserProject> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('user_projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    throw new Error('Project not found.');
  }

  const mergedMetadata: UserProjectMetadata = {
    ...(asRecord(existing.metadata) as UserProjectMetadata),
    ...metadataPatch,
  };

  const { data, error } = await supabase
    .from('user_projects')
    .update({
      metadata: mergedMetadata as unknown as Json,
      ...(options?.title !== undefined ? { title: options.title } : {}),
      ...(options?.description !== undefined
        ? { description: options.description }
        : {}),
      ...(options?.selectedOfferId !== undefined
        ? { selected_offer_id: options.selectedOfferId }
        : {}),
    })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return mapUserProjectRow(data);
}

export async function upsertUserProjectOffer(params: {
  offerId?: string | null;
  projectId: string;
  title: string;
  description?: string | null;
  promise?: string | null;
  hook?: string | null;
  ask?: string | null;
  metadata?: UserProjectOfferMetadata;
  setAsSelected?: boolean;
}): Promise<{ offer: UserProjectOffer; project?: UserProject }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let offerRow;

  if (params.offerId) {
    const { data: existingOffer } = await supabase
      .from('user_project_offers')
      .select('metadata')
      .eq('id', params.offerId)
      .single();

    const mergedMeta = {
      ...asRecord(existingOffer?.metadata),
      ...(params.metadata ?? {}),
    };

    const { data, error } = await supabase
      .from('user_project_offers')
      .update({
        title: params.title.trim(),
        description: params.description?.trim() || null,
        promise: params.promise?.trim() || null,
        hook: params.hook?.trim() || null,
        ask: params.ask?.trim() || null,
        metadata: mergedMeta as unknown as Json,
      })
      .eq('id', params.offerId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update offer: ${error.message}`);
    }
    offerRow = data;
  } else {
    const { data, error } = await supabase
      .from('user_project_offers')
      .insert({
        project_id: params.projectId,
        title: params.title.trim(),
        description: params.description?.trim() || null,
        promise: params.promise?.trim() || null,
        hook: params.hook?.trim() || null,
        ask: params.ask?.trim() || null,
        metadata: (params.metadata ?? {}) as unknown as Json,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create offer: ${error.message}`);
    }
    offerRow = data;
  }

  const mappedOffer = mapUserProjectOfferRow(offerRow);

  if (params.setAsSelected) {
    const updatedProject = await updateUserProjectMetadata(
      params.projectId,
      {},
      { selectedOfferId: mappedOffer.id },
    );
    return { offer: mappedOffer, project: updatedProject };
  }

  return { offer: mappedOffer };
}

export async function fetchMission4ContextSummary(): Promise<Mission4ContextSummary> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const [projectsRes, m3ExpRes, progressRes, obsRes] = await Promise.all([
    supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_experiments')
      .select('*')
      .eq('user_id', user.id)
      .eq('mission_key', 'mission-3')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_progress')
      .select('node_key, payload')
      .eq('user_id', user.id)
      .in('node_key', ['m3-action', 'm3-reveal', 'm1-action']),
    supabase
      .from('user_observations')
      .select('content')
      .eq('user_id', user.id)
      .eq('domain', 'problem')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const projects = (projectsRes.data ?? []).map(mapUserProjectRow);
  const activeProject =
    projects.find((p) => p.metadata?.status === 'active') ??
    projects[0] ??
    null;

  let offers: UserProjectOffer[] = [];
  if (activeProject) {
    const { data: offerRows } = await supabase
      .from('user_project_offers')
      .select('*')
      .eq('project_id', activeProject.id)
      .order('created_at', { ascending: false });
    offers = (offerRows ?? []).map(mapUserProjectOfferRow);
  }

  const selectedOffer =
    (activeProject?.selected_offer_id
      ? offers.find((o) => o.id === activeProject.selected_offer_id)
      : undefined) ??
    offers[0] ??
    null;

  const progressMap = new Map<string, Record<string, unknown>>();
  for (const row of progressRes.data ?? []) {
    progressMap.set(row.node_key, asRecord(row.payload));
  }

  const m3Action = progressMap.get('m3-action') ?? {};
  const m3Reveal = progressMap.get('m3-reveal') ?? {};
  const m1Action = progressMap.get('m1-action') ?? {};

  const warmLeads: Mission4ContextSummary['m3WarmLeads'] = [];
  const expQuotes: string[] = [];
  const seenLead = new Set<string>();

  for (const exp of m3ExpRes.data ?? []) {
    const results = asRecord(exp.results);
    const leads = Array.isArray(results.warm_leads) ? results.warm_leads : [];
    for (const lead of leads) {
      if (typeof lead === 'object' && lead !== null) {
        const l = lead as Record<string, unknown>;
        const name = typeof l.name === 'string' ? l.name : '';
        const contact = typeof l.contact === 'string' ? l.contact : '';
        const key = `${name.toLowerCase()}|${contact.toLowerCase()}`;
        if (name && !seenLead.has(key)) {
          seenLead.add(key);
          warmLeads.push({
            id: typeof l.id === 'string' ? l.id : `lead_${warmLeads.length}`,
            name,
            contact,
            action_taken:
              typeof l.action_taken === 'string'
                ? l.action_taken
                : 'Raised hand in M3',
          });
        }
      }
    }

    const quotes = Array.isArray(results.quotes) ? results.quotes : [];
    for (const q of quotes) {
      if (
        typeof q === 'object' &&
        q !== null &&
        typeof (q as Record<string, unknown>).quote === 'string'
      ) {
        expQuotes.push(((q as Record<string, unknown>).quote as string).trim());
      }
    }
  }

  const obsQuotes = (obsRes.data ?? [])
    .map((o) => (typeof o.content === 'string' ? o.content.trim() : ''))
    .filter(Boolean);

  const combinedQuotes = Array.from(new Set([...expQuotes, ...obsQuotes])).slice(
    0,
    8,
  );

  const oppSnapshot = asRecord(activeProject?.metadata?.opportunity_snapshot);
  const probDetails = asRecord(oppSnapshot.problem_details);
  const workaroundParts = [
    typeof probDetails.current_option === 'string' &&
    probDetails.current_option.trim()
      ? `Current option: ${probDetails.current_option.trim()}`
      : '',
    typeof probDetails.workaround === 'string' && probDetails.workaround.trim()
      ? `Workaround: ${probDetails.workaround.trim()}`
      : '',
  ].filter(Boolean);

  return {
    project: activeProject,
    selectedOffer,
    offers,
    m3ProblemStatement:
      typeof m3Action.problemStatement === 'string'
        ? m3Action.problemStatement
        : activeProject?.description ?? '',
    m3PlanAroundNote:
      typeof m3Action.planAroundNote === 'string'
        ? m3Action.planAroundNote
        : '',
    m3SignalStrength:
      typeof m3Reveal.signalStrength === 'string'
        ? m3Reveal.signalStrength
        : 'thin',
    m3WarmLeads: warmLeads,
    m3Quotes: combinedQuotes,
    m2WorkaroundSummary: workaroundParts.join(' · '),
    m1Constraints: {
      weeklyHours:
        typeof m1Action.weeklyHours === 'string'
          ? m1Action.weeklyHours
          : undefined,
      budgetCap:
        typeof m1Action.budgetCap === 'string'
          ? m1Action.budgetCap
          : undefined,
      incomeGoal:
        typeof m1Action.incomeGoal === 'string'
          ? m1Action.incomeGoal
          : undefined,
    },
  };
}
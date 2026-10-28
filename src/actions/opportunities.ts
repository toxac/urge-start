
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import type { Json } from '@/database.types';
import type {
  ProblemDetails,
} from '@/lib/types/observations';
import type {
  UserOpportunity,
  UserOpportunityInsert,
} from '@/lib/types/opportunities';

const MAX_PROMOTED_OBSERVATIONS = 3;

type QualificationAnswer = 'yes' | 'not_sure' | 'no';

function parseProblemDetails(value: Json): ProblemDetails {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error('An observation has invalid qualification details.');
  }

  const details = value as Record<string, Json | undefined>;
  const validAnswers: QualificationAnswer[] = [
    'yes',
    'not_sure',
    'no',
  ];

  const understands = details.understands;
  const cares = details.cares;
  const canSolve = details.can_solve;

  if (
    typeof understands !== 'string' ||
    !validAnswers.includes(understands as QualificationAnswer) ||
    typeof cares !== 'string' ||
    !validAnswers.includes(cares as QualificationAnswer) ||
    typeof canSolve !== 'string' ||
    !validAnswers.includes(canSolve as QualificationAnswer)
  ) {
    throw new Error(
      'Every selected observation must have all three qualification answers saved.',
    );
  }

  return value as ProblemDetails;
}

export async function fetchUserOpportunities(): Promise<UserOpportunity[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('user_opportunities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  return (data ?? []).map((opportunity) => ({
    ...opportunity,
    problem_details: opportunity.problem_details as ProblemDetails,
  }));
}

export async function promoteObservationsToOpportunities(
  observationIds: string[],
): Promise<{ success: true; opportunities: UserOpportunity[] }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (
    !Array.isArray(observationIds) ||
    observationIds.length === 0 ||
    observationIds.length > MAX_PROMOTED_OBSERVATIONS
  ) {
    throw new Error('Select between one and three observations.');
  }

  const uniqueIds = [...new Set(observationIds)];

  if (uniqueIds.length !== observationIds.length) {
    throw new Error('An observation can only be selected once.');
  }

  // Load only observations owned by the authenticated user.
  const { data: observations, error: observationsError } = await supabase
    .from('user_observations')
    .select('*')
    .eq('user_id', user.id)
    .in('id', uniqueIds);

  if (observationsError) {
    throw new Error(
      `Failed to load selected observations: ${observationsError.message}`,
    );
  }

  if (!observations || observations.length !== uniqueIds.length) {
    throw new Error(
      'One or more selected observations were not found or are unavailable.',
    );
  }

  // Validate the entire selection before writing any opportunities.
  const validatedObservations = observations.map((observation) => {
    if (observation.domain !== 'problem') {
      throw new Error(
        'Only problem observations can be promoted to opportunities.',
      );
    }

    const problemDetails = parseProblemDetails(
      observation.problem_details,
    );

    return {
      observation,
      problemDetails,
    };
  });

  // Check whether any selected observation has already been promoted.
  const { data: existing, error: existingError } = await supabase
    .from('user_opportunities')
    .select('problem_observation_source_id')
    .eq('user_id', user.id)
    .in('problem_observation_source_id', uniqueIds);

  if (existingError) {
    throw new Error(
      `Failed to check existing opportunities: ${existingError.message}`,
    );
  }

  const alreadyPromoted = new Set(
    (existing ?? [])
      .map((item) => item.problem_observation_source_id)
      .filter((id): id is string => id !== null),
  );

  if (uniqueIds.some((id) => alreadyPromoted.has(id))) {
    throw new Error(
      'One or more selected observations have already been promoted. Refresh your observations and try again.',
    );
  }

  const inserts: UserOpportunityInsert[] = validatedObservations.map(
    ({ observation, problemDetails }) => ({
      user_id: user.id,
      title: observation.title,
      description: observation.content,
      problem_details: problemDetails,
      problem_observation_source_id: observation.id,
      status: 'added',
      metadata: {},
    }),
  );

  const { data: created, error: insertError } = await supabase
    .from('user_opportunities')
    .insert(inserts)
    .select('*');

  if (insertError) {
    throw new Error(
      `Failed to create opportunities: ${insertError.message}`,
    );
  }

  return {
    success: true,
    opportunities: (created ?? []).map((opportunity) => ({
      ...opportunity,
      problem_details: opportunity.problem_details as ProblemDetails,
    })),
  };
}


export async function updateOpportunityApproach(
  opportunityId: string,
  approach: {
    type: 'do_for_them' | 'tool' | 'connect' | 'teach';
    description: string;
    rationale?: string;
  },
): Promise<UserOpportunity> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: current, error: fetchErr } = await supabase
    .from('user_opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !current) throw new Error('Opportunity not found');

  const metadata = (current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata))
    ? current.metadata as Record<string, Json>
    : {};

  const updatedMetadata = { ...metadata, approach };

  const { data, error } = await supabase
    .from('user_opportunities')
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update approach: ${error.message}`);
  return data as unknown as UserOpportunity;
}

export async function updateOpportunityFeasibility(
  opportunityId: string,
  feasibility: {
    hasSkills: 'yes' | 'partial' | 'no';
    skillsNotes: string;
    hasCollaborators: boolean;
    collaboratorNotes?: string;
    timeCommitment: string;
    hasTime: boolean;
    capitalRequirement: 'minimal' | 'moderate' | 'significant';
    capitalNotes?: string;
    regulatoryNotes?: string;
  },
): Promise<UserOpportunity> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: current, error: fetchErr } = await supabase
    .from('user_opportunities')
    .select('metadata')
    .eq('id', opportunityId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !current) throw new Error('Opportunity not found');

  const metadata = (current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata))
    ? current.metadata as Record<string, Json>
    : {};

  const updatedMetadata = { ...metadata, feasibility };

  const { data, error } = await supabase
    .from('user_opportunities')
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update feasibility: ${error.message}`);
  return data as unknown as UserOpportunity;
}

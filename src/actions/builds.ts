'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/database.types';
import {
  mapUserProjectBuildRow,
  type AlphaAnalysisResult,
  type BuildTrackingSummary,
  type LaunchSummary,
  type MspBuildRequirement,
  type UserProjectBuild,
  type UserProjectBuildStatus,
} from '@/lib/types/builds';
import { mapUserProjectRow, type UserProject } from '@/lib/types/projects';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function fetchUserProjectBuilds(
  projectId?: string,
): Promise<UserProjectBuild[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('user_project_builds')
    .select('*')
    .eq('user_id', user.id)
    .order('version_number', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch project builds: ${error.message}`);
  }

  return (data ?? []).map(mapUserProjectBuildRow);
}

export async function upsertProjectBuild(params: {
  buildId?: string | null;
  projectId: string;
  offerId?: string | null;
  versionNumber?: number;
  versionLabel?: string;
  title: string;
  status?: UserProjectBuildStatus;
  requirements?: MspBuildRequirement[];
  tracking?: BuildTrackingSummary;
  alphaSummary?: Partial<AlphaAnalysisResult>;
  launchSummary?: Partial<LaunchSummary>;
  buildCompletedAt?: string | null;
  launchedAt?: string | null;
  setAsActive?: boolean;
}): Promise<{ build: UserProjectBuild; project?: UserProject }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let buildRow;

  if (params.buildId) {
    const { data: existing } = await supabase
      .from('user_project_builds')
      .select('*')
      .eq('id', params.buildId)
      .eq('user_id', user.id)
      .single();

    const mergedTracking = {
      ...asRecord(existing?.tracking),
      ...(params.tracking ?? {}),
    };
    const mergedAlpha = {
      ...asRecord(existing?.alpha_summary),
      ...(params.alphaSummary ?? {}),
    };
    const mergedLaunch = {
      ...asRecord(existing?.launch_summary),
      ...(params.launchSummary ?? {}),
    };

    const { data, error } = await supabase
      .from('user_project_builds')
      .update({
        title: params.title.trim(),
        ...(params.offerId !== undefined ? { offer_id: params.offerId } : {}),
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.requirements !== undefined
          ? { requirements: params.requirements as unknown as Json }
          : {}),
        tracking: mergedTracking as unknown as Json,
        alpha_summary: mergedAlpha as unknown as Json,
        launch_summary: mergedLaunch as unknown as Json,
        ...(params.buildCompletedAt !== undefined
          ? { build_completed_at: params.buildCompletedAt }
          : {}),
        ...(params.launchedAt !== undefined
          ? { launched_at: params.launchedAt }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.buildId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update build: ${error.message}`);
    }
    buildRow = data;
  } else {
    const versionNum = params.versionNumber ?? 1;
    const { data, error } = await supabase
      .from('user_project_builds')
      .insert({
        user_id: user.id,
        project_id: params.projectId,
        offer_id: params.offerId ?? null,
        version_number: versionNum,
        version_label: params.versionLabel ?? `v${versionNum}.0`,
        title: params.title.trim(),
        status: params.status ?? 'building',
        requirements: (params.requirements ?? []) as unknown as Json,
        tracking: (params.tracking ?? {}) as unknown as Json,
        alpha_summary: (params.alphaSummary ?? {}) as unknown as Json,
        launch_summary: (params.launchSummary ?? {}) as unknown as Json,
        build_completed_at: params.buildCompletedAt ?? null,
        launched_at: params.launchedAt ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create build: ${error.message}`);
    }
    buildRow = data;
  }

  const mappedBuild = mapUserProjectBuildRow(buildRow);

  if (params.setAsActive) {
    const { data: updatedProjRow, error: projError } = await supabase
      .from('user_projects')
      .update({ active_build_id: mappedBuild.id })
      .eq('id', params.projectId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (projError) {
      throw new Error(`Failed to link active build: ${projError.message}`);
    }

    return {
      build: mappedBuild,
      project: mapUserProjectRow(updatedProjRow),
    };
  }

  return { build: mappedBuild };
}

export async function updateProjectBuild(
  buildId: string,
  patch: {
    title?: string;
    status?: UserProjectBuildStatus;
    requirements?: MspBuildRequirement[];
    tracking?: BuildTrackingSummary;
    alphaSummary?: Partial<AlphaAnalysisResult>;
    launchSummary?: Partial<LaunchSummary>;
    buildCompletedAt?: string | null;
    launchedAt?: string | null;
  },
): Promise<UserProjectBuild> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('user_project_builds')
    .select('*')
    .eq('id', buildId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !existing) {
    throw new Error('Build not found.');
  }

  const { data, error } = await supabase
    .from('user_project_builds')
    .update({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.requirements !== undefined
        ? { requirements: patch.requirements as unknown as Json }
        : {}),
      ...(patch.tracking !== undefined
        ? {
            tracking: {
              ...asRecord(existing.tracking),
              ...patch.tracking,
            } as unknown as Json,
          }
        : {}),
      ...(patch.alphaSummary !== undefined
        ? {
            alpha_summary: {
              ...asRecord(existing.alpha_summary),
              ...patch.alphaSummary,
            } as unknown as Json,
          }
        : {}),
      ...(patch.launchSummary !== undefined
        ? {
            launch_summary: {
              ...asRecord(existing.launch_summary),
              ...patch.launchSummary,
            } as unknown as Json,
          }
        : {}),
      ...(patch.buildCompletedAt !== undefined
        ? { build_completed_at: patch.buildCompletedAt }
        : {}),
      ...(patch.launchedAt !== undefined
        ? { launched_at: patch.launchedAt }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', buildId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update build: ${error.message}`);
  }

  return mapUserProjectBuildRow(data);
}
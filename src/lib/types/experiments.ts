export type ExperimentCategory =
  | 'demand'
  | 'build'
  | 'cost'
  | 'pricing'
  | 'traction';

export type MetricFieldType =
  | 'number'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'text';

export type MetricDirection = 'at_least' | 'at_most' | 'exact';

export type ExperimentMetricDefinition = {
  key: string;
  label: string;
  type: MetricFieldType;
  direction?: MetricDirection;
  unit?: string;
  default_target?: number | boolean | string;
  is_primary?: boolean;
  placeholder?: string;
  helper?: string;
};

export type ExperimentMatchingRules = {
  requires_access?: string[];
  access_mode?: 'all' | 'any';
  preferred_approaches?: string[];
  default_timeframe_days?: number;
};

export type ExperimentHeadsUp = {
  watch_out_for?: string[];
  how_to_do_it_better?: string[];
};

export type ExperimentBlueprint = {
  id: string;
  key: string;
  mission_key: string;
  category: ExperimentCategory;
  involves_people: boolean;
  name: string;
  one_line: string;
  tells_you: string;
  cost_estimate: string;
  strong_signal_guide: string;
  weak_signal_guide: string;
  best_when: string;
  resource_slug: string | null;
  metrics: ExperimentMetricDefinition[];
  matching_rules: ExperimentMatchingRules;
  prep_checklist: string[];
  heads_up: ExperimentHeadsUp;
  prompt_template: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type UserExperimentStatus =
  | 'draft'
  | 'ready'
  | 'live'
  | 'completed'
  | 'iterated'
  | 'parked';

export type ExperimentPitchSetup = {
  audience?: string;
  pain?: string;
  direction?: string;
  ask?: string;
  one_liner?: string;
};

export type UserExperimentSetup = {
  pitch?: ExperimentPitchSetup;
  where?: string;
  channels?: string[];
  checklist?: Record<string, boolean>;
  generated_prompt?: string;
  live_url?: string;
  notes?: string;
};

export type MetricThresholdTarget = {
  target: number | boolean | string;
  direction?: MetricDirection;
};

export type UserExperimentThreshold = {
  targets?: Record<string, MetricThresholdTarget>;
  timeframe_days?: number;
  strong_signal_note?: string;
  weak_signal_note?: string;
  locked_at?: string;
};

export type MetricRecordedValue = number | string | boolean | null;

export type UserExperimentResults = {
  values?: Record<string, MetricRecordedValue>;
  notes?: string;
  last_logged_at?: string;
};

export type SignalSituation =
  | 'wanted_and_acting'
  | 'wanted_no_action'
  | 'acting_vague_problem'
  | 'neither_yet';

export type UserExperimentReflection = {
  shows?: string;
  might_mean?: string;
  unclear?: string;
  founder_takeaway?: string;
  situation?: SignalSituation;
  next_step?: 'proceed' | 'iterate' | 'switch_opportunity' | 'pause';
  decision_reason?: string;
};

export type UserExperiment = {
  id: string;
  user_id: string;
  experiment_id: string | null;
  experiment_key: string;
  project_id: string | null;
  opportunity_id: string | null;
  mission_key: string;
  source_node_key: string | null;
  pass_number: number;
  previous_experiment_id: string | null;
  title: string;
  setup: UserExperimentSetup;
  custom_metrics: ExperimentMetricDefinition[];
  threshold: UserExperimentThreshold;
  results: UserExperimentResults;
  reflection: UserExperimentReflection;
  shared_content_id: string | null;
  status: UserExperimentStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserExperimentWithBlueprint = UserExperiment & {
  blueprint: ExperimentBlueprint | null;
};

export type FounderAccessProfile = {
  canPostOnline?: boolean;
  canBuildSimplePage?: boolean;
  canRunSmallAds?: boolean;
  canMeetInPerson?: boolean;
  hasWarmContacts?: boolean;
  weeklyHours?: number | string;
  approachType?: string | null;
};

/**
 * Resolves the active metric definitions for a user experiment, falling back
 * to `custom_metrics` when `experiment_key === 'custom'` or blueprint is absent.
 */
export function resolveExperimentMetrics(
  userExp: Pick<UserExperiment, 'custom_metrics'>,
  blueprint?: ExperimentBlueprint | null,
): ExperimentMetricDefinition[] {
  if (blueprint?.metrics && blueprint.metrics.length > 0) {
    return blueprint.metrics;
  }
  return Array.isArray(userExp.custom_metrics) ? userExp.custom_metrics : [];
}

/**
 * Fills {{project_title}}, {{audience}}, {{pain}}, {{direction}}, {{ask}},
 * and {{channels}} placeholders in a blueprint's prompt_template.
 */
export function renderExperimentPrompt(
  template: string | null | undefined,
  vars: {
    projectTitle?: string;
    pitch?: ExperimentPitchSetup;
    channels?: string[] | string;
  },
): string {
  if (!template) return '';
  const pitch = vars.pitch ?? {};
  const channelText = Array.isArray(vars.channels)
    ? vars.channels.filter(Boolean).join(', ')
    : vars.channels?.trim() || '';

  const replacements: Record<string, string> = {
    project_title: vars.projectTitle?.trim() || 'My project',
    audience: pitch.audience?.trim() || '(not specified yet)',
    pain: pitch.pain?.trim() || '(not specified yet)',
    direction: pitch.direction?.trim() || '(not specified yet)',
    ask: pitch.ask?.trim() || '(not specified yet)',
    channels: channelText || '(choose your channel)',
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    return replacements[token] ?? '';
  });
}

/**
 * Evaluates a recorded metric value against its locked threshold target.
 * Returns null if no numeric/boolean comparison applies.
 */
export function evaluateMetricThreshold(
  actual: MetricRecordedValue | undefined,
  targetSpec: MetricThresholdTarget | undefined,
): boolean | null {
  if (actual === undefined || actual === null || !targetSpec) return null;

  if (typeof targetSpec.target === 'boolean' && typeof actual === 'boolean') {
    return actual === targetSpec.target;
  }

  const numActual = typeof actual === 'number' ? actual : Number(actual);
  const numTarget =
    typeof targetSpec.target === 'number'
      ? targetSpec.target
      : Number(targetSpec.target);

  if (Number.isNaN(numActual) || Number.isNaN(numTarget)) return null;

  const direction = targetSpec.direction ?? 'at_least';
  if (direction === 'at_most') return numActual <= numTarget;
  if (direction === 'exact') return numActual === numTarget;
  return numActual >= numTarget;
}

/**
 * Programmatically filters & ranks experiment blueprints based on the founder's
 * access profile and Mission 2 approach type.
 */
export function recommendExperimentsForFounder(
  blueprints: ExperimentBlueprint[],
  access: FounderAccessProfile,
): ExperimentBlueprint[] {
  const accessMap: Record<string, boolean> = {
    canPostOnline: Boolean(access.canPostOnline),
    canBuildSimplePage: Boolean(access.canBuildSimplePage),
    canRunSmallAds: Boolean(access.canRunSmallAds),
    canMeetInPerson: Boolean(access.canMeetInPerson),
    hasWarmContacts: Boolean(access.hasWarmContacts),
  };

  const eligible = blueprints.filter((bp) => {
    const reqs = bp.matching_rules?.requires_access ?? [];
    if (reqs.length === 0) return true;
    const mode = bp.matching_rules?.access_mode ?? 'all';
    return mode === 'any'
      ? reqs.some((key) => accessMap[key])
      : reqs.every((key) => accessMap[key]);
  });

  const pool = eligible.length > 0 ? eligible : blueprints;

  return [...pool].sort((a, b) => {
    const aPreferred =
      access.approachType &&
      a.matching_rules?.preferred_approaches?.includes(access.approachType)
        ? 1
        : 0;
    const bPreferred =
      access.approachType &&
      b.matching_rules?.preferred_approaches?.includes(access.approachType)
        ? 1
        : 0;

    if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    return a.sort_order - b.sort_order;
  });
}
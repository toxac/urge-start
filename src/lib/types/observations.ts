import type { Database } from '@/database.types';

// -----------------------------------------------------------------------------
// Database types
// -----------------------------------------------------------------------------

export type UserObservation =
    Database['public']['Tables']['user_observations']['Row'];

export type UserObservationInsert =
    Database['public']['Tables']['user_observations']['Insert'];

export type UserObservationUpdate =
    Database['public']['Tables']['user_observations']['Update'];

export type ObservationLink =
    Database['public']['Tables']['observation_links']['Row'];

export type ObservationLinkInsert =
    Database['public']['Tables']['observation_links']['Insert'];

export type ObservationLinkUpdate =
    Database['public']['Tables']['observation_links']['Update'];

// -----------------------------------------------------------------------------
// Observation vocabulary
// -----------------------------------------------------------------------------
// type = what kind of observation/evidence is this?
// domain = what area does it concern?
// focus = what lens are we looking through?
// context = where/how did I encounter it?
// -----------------------------------------------------------------------------

export const OBSERVATION_TYPES = [
    'observation',
    'personal',
    'conversation',
    'research',
    'behavior',
    'experiment',
    'event',
] as const;

export type ObservationType =
    (typeof OBSERVATION_TYPES)[number];

export const OBSERVATION_DOMAINS = [
    'problem',
    'customer',
    'product',
    'marketing',
    'sales',
    'finance',
    'operations',
    'competition',
    'market',
    'personal',
    'other',
] as const;

export type ObservationDomain =
    (typeof OBSERVATION_DOMAINS)[number];

export const OBSERVATION_FOCUS_OPTIONS = {
    problem: [
        'personal',
        'people',
        'zone_of_influence',
        'changes',
        'markets',
    ],
    experiment: [
    'asking',
  ],
} as const;

// -----------------------------------------------------------------------------
// Observation links
// -----------------------------------------------------------------------------

export const OBSERVATION_LINK_ENTITY_TYPES = [
    'opportunity',
    'project',
] as const;

export type ObservationLinkEntityType =
    (typeof OBSERVATION_LINK_ENTITY_TYPES)[number];
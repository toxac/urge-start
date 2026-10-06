
import { z } from 'zod';

import {
  OBSERVATION_TYPES,
  OBSERVATION_DOMAINS,
  OBSERVATION_FOCUS_OPTIONS,
} from '@/lib/types/observations';

const observationTypeSchema = z.enum(OBSERVATION_TYPES);

const observationDomainSchema = z.enum(OBSERVATION_DOMAINS);

const observationFocusSchema = z.string().trim().min(1).optional();

export const observationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give this observation a short title.')
    .max(120, 'Keep the title under 120 characters.'),

  content: z
    .string()
    .trim()
    .min(1, 'Describe what you observed.'),

  context: z
    .string()
    .trim()
    .max(1000, 'Keep the context under 1000 characters.')
    .optional(),

  observed_at: z
    .string()
    .datetime()
    .optional(),

  type: observationTypeSchema.optional(),

  domain: observationDomainSchema.optional(),

  focus: observationFocusSchema,

  source_node_key: z
    .string()
    .trim()
    .min(1)
    .optional(),
});

export type ObservationFormValues = z.infer<typeof observationSchema>;
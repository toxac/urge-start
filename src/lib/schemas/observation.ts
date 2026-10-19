
import { z } from 'zod';

import {
  OBSERVATION_TYPES,
  OBSERVATION_DOMAINS,
} from '@/lib/types/observations';

import type { ProblemDetails } from '@/lib/types/observations';

const observationTypeSchema = z.enum(OBSERVATION_TYPES);
const observationDomainSchema = z.enum(OBSERVATION_DOMAINS);

const nullableText = (maxLength = 2000) =>
  z.string().trim().max(maxLength).nullable().optional();

const qualificationAnswerSchema = z
  .enum(['yes', 'not_sure', 'no'])
  .nullable()
  .optional();

export const problemDetailsSchema: z.ZodType<ProblemDetails> = z.object({
  is_existing: z.boolean().nullable().optional(),
  who: nullableText(),
  where: nullableText(),
  when: nullableText(),
  can_reach: z.boolean().nullable().optional(),
  workaround: nullableText(),
  why_unsolved: nullableText(),
  current_option: nullableText(),
  understands: qualificationAnswerSchema,
  cares: qualificationAnswerSchema,
  can_solve: qualificationAnswerSchema,
});

export const observationSchema = z.object({
  // Present when editing an existing observation.
  observation_id: z.string().uuid().optional(),

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
    .nullable()
    .optional(),

  observed_at: z.string().datetime().nullable().optional(),

  type: observationTypeSchema.nullable().optional(),
  domain: observationDomainSchema.nullable().optional(),

  focus: z.string().trim().min(1).nullable().optional(),

  source_node_key: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional(),

  notes: z
    .array(z.string().trim().min(1).max(2000))
    .optional(),

  // Private Storage object path, not a public URL.
  image_url: z.string().trim().min(1).max(1000).nullable().optional(),

  problem_details: problemDetailsSchema.optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ObservationFormValues = z.infer<typeof observationSchema>;

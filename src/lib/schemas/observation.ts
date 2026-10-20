
import { z } from 'zod';

import {
  OBSERVATION_TYPES,
  OBSERVATION_DOMAINS,
  OBSERVATION_FOCUS_OPTIONS,
} from '@/lib/types/observations';

import type { ProblemDetails } from '@/lib/types/observations';

// -----------------------------------------------------------------------------
// Base schemas
// -----------------------------------------------------------------------------

const observationTypeSchema = z.enum(OBSERVATION_TYPES);
const observationDomainSchema = z.enum(OBSERVATION_DOMAINS);

const problemFocusSchema = z.enum(
  OBSERVATION_FOCUS_OPTIONS.problem,
);

const nullableText = (maxLength = 2000) =>
  z.string().trim().max(maxLength).nullable().optional();

const qualificationAnswerSchema = z
  .enum(['yes', 'not_sure', 'no'])
  .nullable()
  .optional();

// -----------------------------------------------------------------------------
// Problem details
// Stored in user_observations.problem_details (JSONB)
// -----------------------------------------------------------------------------

export const problemDetailsSchema: z.ZodType<ProblemDetails> = z.object({
  is_existing: z.boolean().nullable().optional(),

  // Who experiences the problem, where and when?
  who: nullableText(),
  where: nullableText(),
  when: nullableText(),

  // Access and current behaviour
  can_reach: z.boolean().nullable().optional(),
  workaround: nullableText(),
  current_option: nullableText(),

  // Problem characteristics
  cost: nullableText(),
  frequency: nullableText(),
  why_unsolved: nullableText(),

  // Qualification answers
  understands: qualificationAnswerSchema,
  cares: qualificationAnswerSchema,
  can_solve: qualificationAnswerSchema,
});

// -----------------------------------------------------------------------------
// Observation schema
// -----------------------------------------------------------------------------

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

  // Kept flexible for non-problem observations.
  // Problem observations are validated by the refinement below.
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
  image_url: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .nullable()
    .optional(),

  problem_details: problemDetailsSchema.optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
});

// -----------------------------------------------------------------------------
// Validated schema
// -----------------------------------------------------------------------------

export const validatedObservationSchema =
  observationSchema.superRefine((data, ctx) => {
    if (data.domain !== 'problem' || !data.focus) {
      return;
    }

    const result = problemFocusSchema.safeParse(data.focus);

    if (!result.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['focus'],
        message:
          'Choose one of the four problem observation focus types.',
      });
    }
  });

export type ObservationFormValues = z.infer<
  typeof validatedObservationSchema
>;


import { z } from 'zod';

import { problemDetailsSchema } from '@/lib/schemas/observation';

export const userOpportunitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'An opportunity title is required.')
    .max(200),

  description: z.string().trim().max(10000).nullable().optional(),
  problem: z.string().trim().max(10000).nullable().optional(),
  customer: z.string().trim().max(2000).nullable().optional(),
  hypothesis: z.string().trim().max(10000).nullable().optional(),

  problem_details: problemDetailsSchema.optional(),
  problem_observation_source_id: z.string().uuid().nullable().optional(),

  status: z.enum(['added', 'testing', 'archived']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UserOpportunityInput = z.infer<
  typeof userOpportunitySchema
>;

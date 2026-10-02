
import { z } from 'zod';

export const userOpportunitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'An opportunity title is required.')
    .max(200),

  description: z
    .string()
    .trim()
    .max(10000)
    .nullable()
    .optional(),

  problem: z
    .string()
    .trim()
    .max(10000)
    .nullable()
    .optional(),

  customer: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),

  hypothesis: z
    .string()
    .trim()
    .max(10000)
    .nullable()
    .optional(),

  status: z
    .enum(['added', 'shortlisted', 'testing'])
    .optional(),

  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
});

export type UserOpportunityInput = z.infer<
  typeof userOpportunitySchema
>;

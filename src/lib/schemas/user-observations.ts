
import { z } from 'zod';

export const userObservationSchema = z.object({
  title: z.string().trim().min(1, 'A title is required.').max(200),
  content: z.string().trim().min(1, 'Observation content is required.').max(10000),
  type: z.string().trim().min(1).optional(),
  domain: z.string().nullable().optional(),
  focus: z.string().nullable().optional(),
  observed_at: z.string().datetime().nullable().optional(),
  source_node_key: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UserObservationInput = z.infer<
  typeof userObservationSchema
>;

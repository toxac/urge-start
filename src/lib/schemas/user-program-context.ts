
import { z } from 'zod';

const jsonObjectSchema = z.record(
  z.string(),
  z.unknown(),
);

export const userProgramContextSchema = z.object({
  motivations: jsonObjectSchema.optional(),
  desired_future: jsonObjectSchema.optional(),
  perceived_barriers: jsonObjectSchema.optional(),
  fears: jsonObjectSchema.optional(),
  experience: jsonObjectSchema.optional(),
  capabilities: jsonObjectSchema.optional(),
  resources: jsonObjectSchema.optional(),
  network_context: jsonObjectSchema.optional(),
  constraints: jsonObjectSchema.optional(),
  quit_conditions: jsonObjectSchema.optional(),
  age_group: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
});

export type UserProgramContextInput = z.infer<
  typeof userProgramContextSchema
>;

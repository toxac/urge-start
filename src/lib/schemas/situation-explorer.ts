
import { z } from 'zod';

export const situationExplorerSchema = z.object({
  situation: z
    .string()
    .trim()
    .min(1, 'Tell us a little about what brought you here.')
    .max(10000, 'Your response must be 10,000 characters or fewer.'),
});

export type SituationExplorerPayload = z.infer<
  typeof situationExplorerSchema
>;

import type { Json, Tables, TablesInsert, TablesUpdate } from '@/database.types';
import type { ProblemDetails } from '@/lib/types/observations';

export type UserOpportunityRow = Tables<'user_opportunities'>;

export type UserOpportunity = Omit<
  UserOpportunityRow,
  'problem_details'
> & {
  problem_details: ProblemDetails;
};

export type UserOpportunityInsert = Omit<
  TablesInsert<'user_opportunities'>,
  'problem_details'
> & {
  problem_details?: ProblemDetails;
};

export type UserOpportunityUpdate = Omit<
  TablesUpdate<'user_opportunities'>,
  'problem_details'
> & {
  problem_details?: ProblemDetails;
};

export type UserOpportunityStatus =
  UserOpportunityRow['status'];

export type UserOpportunityMetadata = Record<string, Json>;
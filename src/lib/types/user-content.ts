
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserContent = Tables<'user_content'>;

export type UserContentInsert = TablesInsert<'user_content'>;

export type UserContentUpdate = TablesUpdate<'user_content'>;

/**
 * What the post relates to in the Urge journey.
 * Nullable in the database for general community posts.
 */
export type UserContentCategory =
  | 'introduction'
  | 'opportunity'
  | 'test'
  | 'planning'
  | 'build'
  | 'launch'
  | 'operate';

/**
 * Why the member is posting.
 */
export type UserContentIntent =
  | 'insight'
  | 'experiment'
  | 'question'
  | 'reflection'
  | 'milestone';

export type UserContentStatus = UserContent['status'];

export type UserContentMetadata = Json;

/**
 * Input for creating content.
 * user_id is supplied by the trusted server-side action.
 */
export type CreateUserContentInput = Omit<
  UserContentInsert,
  'user_id'
>;

/**
 * Input for updating content.
 * Ownership must be enforced server-side and by RLS.
 */
export type UpdateUserContentInput = Omit<
  UserContentUpdate,
  'user_id'
>;

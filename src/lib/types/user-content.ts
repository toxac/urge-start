
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserContent = Tables<'user_content'>;

export type UserContentInsert = TablesInsert<'user_content'>;

export type UserContentUpdate = TablesUpdate<'user_content'>;

export type UserContentCategory =
  | 'introduction'
  | 'opportunity'
  | 'test'
  | 'planning'
  | 'build'
  | 'launch'
  | 'operate';

export type UserContentIntent =
  | 'insight'
  | 'experiment'
  | 'question'
  | 'reflection'
  | 'milestone';

export type UserContentStatus =
  | 'draft'
  | 'published'
  | 'hidden'
  | 'archived';

export type UserContentMetadata = Json;

export type CreateUserContentInput = Omit<
  UserContentInsert,
  'user_id' | 'status' | 'published_at'
> & {
  status?: 'draft' | 'published';
  category?: UserContentCategory | null;
  post_intent?: UserContentIntent | null;
};

export type UpdateUserContentInput = Omit<
  UserContentUpdate,
  'user_id'
> & {
  category?: UserContentCategory | null;
  post_intent?: UserContentIntent | null;
};

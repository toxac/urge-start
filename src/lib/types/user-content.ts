import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserContent = Tables<'user_content'>;

export type UserContentInsert = TablesInsert<'user_content'>;

export type UserContentUpdate = TablesUpdate<'user_content'>;

export type UserContentType =
  | 'introduction'
  | 'opportunity'
  | 'test'
  | 'planning'
  | 'build'
  | 'launch'
  | 'operate';

export type UserContentStatus = UserContent['status'];

export type UserContentMetadata = Json;

export type CreateUserContentInput = Omit<
  UserContentInsert,
  'user_id' | 'content_type'
> & {
  content_type: UserContentType;
};

export type UpdateUserContentInput = Omit<
  UserContentUpdate,
  'user_id' | 'content_type'
> & {
  content_type?: UserContentType;
};
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserContact = Tables<'user_contacts'>;

export type UserContactInsert = TablesInsert<'user_contacts'>;

export type UserContactUpdate = TablesUpdate<'user_contacts'>;

export type UserContactRelationships = UserContact['relationships'];

export type UserContactDetails = UserContact['contact_details'];

export type CreateUserContactInput = Omit<
  UserContactInsert,
  'user_id'
>;

export type UpdateUserContactInput = Omit<
  UserContactUpdate,
  'user_id'
>;

export type UserContactRelationship =
  | 'mentor'
  | 'industry'
  | 'feedback'
  | 'introduction'
  | 'practical_help'
  | 'learning'
  | 'challenge'
  | 'accountability';
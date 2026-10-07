import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/database.types';

export type UserContact = Tables<'user_contacts'>;

export type UserContactInsert = TablesInsert<'user_contacts'>;

export type UserContactUpdate = TablesUpdate<'user_contacts'>;

export type UserContactStatus =
  | 'pending'
  | 'invited'
  | 'accepted'
  | 'declined';

export type UserContactRelationship =
  | 'mentor'
  | 'industry'
  | 'feedback'
  | 'introduction'
  | 'practical_help'
  | 'learning'
  | 'challenge'
  | 'accountability';

export type UserContactDetails =
  UserContact['contact_details'];

export type CreateUserContactInput = Omit<
  UserContactInsert,
  'user_id' | 'status'
> & {
  status?: UserContactStatus;
};

export type UpdateUserContactInput = Omit<
  UserContactUpdate,
  'user_id'
> & {
  status?: UserContactStatus;
};
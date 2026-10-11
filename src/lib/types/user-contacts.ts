
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from '@/database.types';

/**
 * General-purpose roles a person can have in the user's network.
 * A contact may have more than one role.
 */
export const USER_CONTACT_ROLES = [
  'connection',
  'squad',
  'tester',
  'lead',
  'customer',
  'partner',
] as const;

export type UserContactRole = (typeof USER_CONTACT_ROLES)[number];

/**
 * Invitation lifecycle.
 *
 * not_invited: No invitation has been prepared.
 * prepared: Invitation details have been prepared, but not sent.
 * sent: Invitation has actually been sent.
 * accepted: Invitation has been accepted.
 * declined: Invitation has been declined.
 */
export const USER_CONTACT_STATUSES = [
  'not_invited',
  'prepared',
  'sent',
  'accepted',
  'declined',
] as const;

export type UserContactStatus = (typeof USER_CONTACT_STATUSES)[number];

/**
 * Personas used by the Urge SquadBuilder.
 * These are distinct from the contact's general-purpose roles.
 */
export const SQUAD_PERSONAS = [
  'believer',
  'challenger',
  'guide',
  'doer',
  'connector',
] as const;

export type SquadPersona = (typeof SQUAD_PERSONAS)[number];

export type SquadRoleContext = {
  persona?: SquadPersona;
  persona_label?: string;
  notes?: string;
};

/**
 * Context is organised by the contact's roles.
 * Not every role needs context immediately.
 */
export type UserContactContext = {
  squad?: SquadRoleContext;
  [key: string]: Json | undefined;
};

/**
 * Additional contact methods and invitation information.
 * Email belongs in the dedicated email column instead.
 */
export type UserContactDetails = {
  mobile?: string;
  linkedin?: string;
  website?: string;
  invitation_token?: string | null;
  invitation_message?: string;
  invitation_accepted_at?: string;
  [key: string]: Json | undefined;
};

type GeneratedUserContact = Tables<'user_contacts'>;
type GeneratedUserContactInsert = TablesInsert<'user_contacts'>;
type GeneratedUserContactUpdate = TablesUpdate<'user_contacts'>;

export type UserContact = Omit<
  GeneratedUserContact,
  'roles' | 'status' | 'context' | 'contact_details'
> & {
  roles: UserContactRole[];
  status: UserContactStatus;
  context: UserContactContext | null;
  contact_details: UserContactDetails;
};

export type UserContactInsert = Omit<
  GeneratedUserContactInsert,
  'roles' | 'status' | 'context' | 'contact_details'
> & {
  roles?: UserContactRole[];
  status?: UserContactStatus;
  context?: UserContactContext | null;
  contact_details?: UserContactDetails;
};

export type UserContactUpdate = Omit<
  GeneratedUserContactUpdate,
  'roles' | 'status' | 'context' | 'contact_details'
> & {
  roles?: UserContactRole[];
  status?: UserContactStatus;
  context?: UserContactContext | null;
  contact_details?: UserContactDetails;
};

export type CreateUserContactInput = Omit<
  UserContactInsert,
  'user_id'
>;

export type UpdateUserContactInput = Omit<
  UserContactUpdate,
  'user_id'
>;

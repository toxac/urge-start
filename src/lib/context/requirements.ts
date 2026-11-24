export type ContextResource =
  | 'resources'
  | 'observations'
  | 'opportunities'
  | 'contacts'
  | 'experiments'
  | 'user_experiments'
  | 'projects'
  | 'offers'
  | 'builds';

export const missionContextRequirements: Record<string, ContextResource[]> = {
  'mission-1': ['resources', 'observations'],
  'mission-2': ['resources', 'observations', 'opportunities', 'projects'],
  'mission-3': [
    'resources',
    'observations',
    'opportunities',
    'contacts',
    'experiments',
    'user_experiments',
    'projects',
  ],
  'mission-4': [
    'projects',
    'offers',
    'builds',
    'opportunities',
    'observations',
    'contacts',
    'experiments',
    'user_experiments',
    'resources',
  ],
  'mission-5': [
    'projects',
    'offers',
    'builds',
    'opportunities',
    'observations',
    'experiments',
    'user_experiments',
    'resources',
  ],
  'mission-6': ['projects', 'offers', 'builds', 'resources'],
};

export function getMissionContextRequirements(
  missionKey: string,
): ContextResource[] {
  return missionContextRequirements[missionKey] ?? ['resources'];
}
export type ContextResource =
  | 'contacts'
  | 'observations'
  | 'opportunities'
  | 'projects'
  | 'offers'
  | 'experiments'
  | 'user_experiments'
  | 'resources';


export const missionContextRequirements: Record<string, ContextResource[]> = {
  'mission-1': ['contacts', 'resources'],
  'mission-2': ['observations', 'opportunities', 'projects', 'resources'],
  'mission-3': [
    'projects',
    'opportunities',
    'observations',
    'contacts',
    'experiments',
    'user_experiments',
    'resources',
  ],
  'mission-4': ['projects', 'offers', 'observations', 'resources'],
  'mission-5': ['projects', 'observations', 'contacts', 'resources'],
  'mission-6': ['projects', 'observations', 'resources'],
};

export function getMissionRequirements(missionKey: string): ContextResource[] {
  return missionContextRequirements[missionKey] || [];
}
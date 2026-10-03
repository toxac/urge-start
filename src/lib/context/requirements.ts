export type ContextResource = 'contacts' | 'observations' | 'projects' | 'offers' | 'resources';

export const missionContextRequirements: Record<string, ContextResource[]> = {
  'mission-1': ['contacts', 'resources'],
  'mission-2': ['observations', 'projects', 'resources'],
  'mission-3': ['projects', 'observations', 'offers', 'contacts', 'resources'],
  'mission-4': ['projects', 'offers', 'observations', 'resources'],
  'mission-5': ['projects', 'observations', 'contacts', 'resources'],
  'mission-6': ['projects', 'observations', 'resources'],
};

export function getMissionRequirements(missionKey: string): ContextResource[] {
  return missionContextRequirements[missionKey] || [];
}
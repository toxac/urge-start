export type ContextResource = 'contacts' | 'observations' | 'projects' | 'offers' | 'resources';

export const missionContextRequirements: Record<string, ContextResource[]> = {
  'mission-1': ['contacts'],
  'mission-2': ['observations', 'projects'],
  'mission-3': ['projects', 'observations', 'offers', 'contacts'],
  'mission-4': ['projects', 'offers', 'observations'],
  'mission-5': ['projects', 'observations', 'contacts'],
  'mission-6': ['projects', 'observations'],
};

export function getMissionRequirements(missionKey: string): ContextResource[] {
  return missionContextRequirements[missionKey] || [];
}
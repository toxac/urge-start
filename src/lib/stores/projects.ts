import { atom } from 'nanostores';
import type { Tables } from '@/database.types';

export type UserProject = Tables<'user_projects'>;

export interface ProjectsState {
  isHydrated: boolean;
  activeProject: UserProject | null;
}

export const $projects = atom<ProjectsState>({
  isHydrated: false,
  activeProject: null,
});

export const projectsActions = {
  hydrate: (activeProject: UserProject | null) => {
    $projects.set({ isHydrated: true, activeProject });
  },
  setActive: (project: UserProject) => {
    $projects.set({ isHydrated: true, activeProject: project });
  },
};
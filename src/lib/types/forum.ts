
import type { Tables } from '@/database.types';

// Database-derived types

export type ForumPost = Tables<'forum_posts'>;

// Domain types

export type ForumStream =
  | 'for-you'
  | 'introductions'
  | 'insight'
  | 'experiment'
  | 'question'
  | 'reflection'
  | 'milestone';

export type ForumIntent =
  | 'insight'
  | 'experiment'
  | 'question'
  | 'reflection'
  | 'milestone';

export type ForumCategory =
  | 'introduction'
  | 'opportunity'
  | 'test'
  | 'planning'
  | 'build'
  | 'launch'
  | 'operate';

export type ForumReactionType =
  | 'helpful'
  | 'experienced_this'
  | 'interesting'
  | 'courage';

export type ForumResponseType =
  | 'experience'
  | 'question'
  | 'perspective'
  | 'suggestion'
  | 'answer';

export type ForumSort = 'latest' | 'discussed';

// Display labels

export const intentLabels: Record<ForumIntent, string> = {
  insight: 'Insight',
  experiment: 'Experiment',
  question: 'Question',
  reflection: 'Reflection',
  milestone: 'Milestone',
};

export const categoryLabels: Record<ForumCategory, string> = {
  introduction: 'Introduction',
  opportunity: 'Opportunity',
  test: 'Testing an idea',
  planning: 'Planning',
  build: 'Building',
  launch: 'Launch',
  operate: 'Operations',
};

// Intent badge styles

export const intentStyles: Record<ForumIntent, string> = {
  insight: 'bg-amber-50 text-amber-800',
  experiment: 'bg-sky-50 text-sky-800',
  question: 'bg-violet-50 text-violet-800',
  reflection: 'bg-rose-50 text-rose-800',
  milestone: 'bg-emerald-50 text-emerald-800',
};

import { atom } from 'nanostores';
import { Database } from '@/database.types';


export type NodeResource = Database['public']['Tables']['program_node_resources']['Row'];

export const $nodeResources = atom<NodeResource[]>([]);
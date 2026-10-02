// src/lib/progress/manager.ts
import { submitNodeCompletion } from '@/actions/progress';
import { progressActions } from '@/lib/stores/progress';
import { programStateActions } from '@/lib/stores/program-state';

/**
 * Handles the complete lifecycle of submitting a node.
 * 1. Calls server action to mutate DB.
 * 2. On success, updates Nanostores to reflect new state immediately.
 */
export async function completeProgramNode(nodeKey: string, payload: Record<string, any> = {}) {
  try {
    // 1. Mutate Database
    const result = await submitNodeCompletion(nodeKey, payload);

    if (result.success) {
      // 2. Mutate Stores
      progressActions.addCompletion(result.completedNodeKey, payload);
      
      if (result.nextNodeKey) {
        programStateActions.setCurrentNode(result.nextNodeKey);
      }
      
      return { success: true, nextNodeKey: result.nextNodeKey };
    }
    
    return { success: false, error: 'Unknown error occurred during completion.' };
  } catch (error: any) {
    console.error('Node completion failed:', error);
    return { success: false, error: error.message };
  }
}
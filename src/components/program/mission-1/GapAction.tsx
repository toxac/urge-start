'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { $userContext } from '@/lib/stores/user-context';

import { generateGapTasks } from '@/actions/responses/mission1';
import { saveUserTasks } from '@/actions/tasks';

interface Task {
  title: string;
  description: string;
}

export function GapAction({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const { userContext } = useStore($userContext);
  const saved = progress.payload ?? {};

  const [generatedTasks, setGeneratedTasks] = useState<Task[]>(
    Array.isArray(saved.generatedTasks) ? saved.generatedTasks : []
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    Array.isArray(saved.selectedIndices) ? saved.selectedIndices : []
  );
  
  const [isGenerating, setIsGenerating] = useState(generatedTasks.length === 0);
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchTasks() {
      if (hasFetchedRef.current || generatedTasks.length > 0 || !userContext) return;
      hasFetchedRef.current = true;
      setIsGenerating(true);

      try {
        const assetData = {
          resources: userContext.resources || {},
          networks: userContext.network_context || [],
          capabilities: userContext.capabilities || {},
          experience: userContext.experience || {},
        };

        const tasks = await generateGapTasks(assetData, nodeKey);
        setGeneratedTasks(tasks);
      } catch (err) {
        console.error('[GAP TASKS ERROR]', err);
        // Fallback tasks if AI fails
        setGeneratedTasks([
          { title: "Define your one-sentence problem", description: "Write down the exact problem you want to solve in one sentence without using jargon." },
          { title: "Identify your first test subject", description: "Pick one person from your network who might experience this problem." },
          { title: "Audit your schedule", description: "Block off 2 hours in your calendar this week specifically dedicated to this." }
        ]);
      } finally {
        setIsGenerating(false);
      }
    }

    fetchTasks();
  }, [userContext, generatedTasks.length, nodeKey]);

  const toggleTask = (index: number) => {
    if (isCommitted) return;
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  async function handleSaveTasks() {
    if (selectedIndices.length === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const selectedTasksToSave = selectedIndices.map(index => ({
        title: generatedTasks[index].title,
        description: generatedTasks[index].description,
        source_node_key: nodeKey
      }));

      // Write to the universal user_tasks table
      await saveUserTasks(selectedTasksToSave);
      
      setIsCommitted(true);
    } catch (err: any) {
      console.error('[SAVE TASKS]', err);
      setError('Something went wrong saving your tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    await onComplete({
      generatedTasks,
      selectedIndices,
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-10">
      
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Turn leverage into action."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Based on your inventory, here are three immediate ways to deploy your leverage. Select the ones you are actually willing to do this week.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Formulating tactical actions...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {generatedTasks.map((task, idx) => {
              const isSelected = selectedIndices.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleTask(idx)}
                  disabled={isCommitted}
                  className={`group relative flex items-start justify-between gap-6 rounded-2xl border p-6 text-left transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                  } ${isCommitted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="space-y-2">
                    <h3 className={`font-heading text-xl font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                      {task.title}
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                  
                  {!isCommitted && (
                    <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isGenerating && generatedTasks.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl space-y-8 pt-4 duration-700">
          
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!isCommitted ? (
            <div className="flex items-center justify-end border-t border-border pt-8">
              <Button
                onClick={handleSaveTasks}
                disabled={selectedIndices.length === 0 || isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving tasks...</>
                ) : (
                  `Lock in ${selectedIndices.length} task${selectedIndices.length === 1 ? '' : 's'}`
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-8 border-t border-border pt-8">
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">Tasks added to your queue.</h3>
                <p className="text-lg leading-8 text-muted-foreground">
                  You don't need a massive strategy yet. You just need to execute these specific actions to start moving the needle.
                </p>
              </div>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="h-12 gap-2 rounded-full px-8 text-base"
              >
                {isSubmitting ? 'Finalizing Quest...' : 'Complete Quest 2'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
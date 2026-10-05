'use client';

import { ArrowRight } from 'lucide-react';
import { useStore } from '@nanostores/react';

import { Button } from '@/components/ui/button';
import { $programState } from '@/lib/stores/program-state';
import { getMissionForNode } from '@/program/index';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function StandardSetupFrame({ onComplete, node, nodeKey }: NodeComponentProps) {
  const { currentNodeKey } = useStore($programState);
  
  const mission = getMissionForNode(currentNodeKey!);
  const currentQuest = mission?.quests.find(q => 
    q.nodes.some(n => n.key === currentNodeKey)
  );

  // Prioritize the specific node description, fallback to the quest description
  const descriptionText = node.description || currentQuest?.description;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700 pb-16">
      
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
          {node.title}
        </h1>
        
        {descriptionText && (
          <p className="text-xl leading-relaxed text-muted-foreground">
            {descriptionText}
          </p>
        )}
      </div>

      <div className="pt-4">
        <Button 
          onClick={() => onComplete({ completed: true })} 
          className="h-12 gap-2 rounded-full px-8 text-base shadow-sm"
        >
          Begin Investigation
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

    </div>
  );
}
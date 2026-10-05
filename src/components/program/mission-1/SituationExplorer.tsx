'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';

import { $nodeResources } from '@/lib/stores/resources';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeSituation } from '@/actions/responses/mission1';
import { saveObservation } from '@/actions/observations';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

export function SituationExplorer({ progress, onComplete, nodeKey, node }: NodeComponentProps) {
  const resources = useStore($nodeResources);
  const briefingVideo = resources.find(r => r.node_key === nodeKey && r.role === 'briefing_video');

  const saved = progress.payload ?? {};
  
  const [situation, setSituation] = useState(typeof saved.situation === 'string' ? saved.situation : '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState<{ acknowledgment: string, hasIdea: boolean, extractedIdea: string | null } | null>(
    saved.analysis ? saved.analysis : null
  );
  
  const [editableIdea, setEditableIdea] = useState('');
  const [showIdeaInput, setShowIdeaInput] = useState(false);
  const [isSavingIdea, setIsSavingIdea] = useState(false);
  const [ideaConfirmed, setIdeaConfirmed] = useState(!!saved.ideaConfirmed);

  useEffect(() => {
    if (!saved.situation) {
      const draft = localStorage.getItem(`urge_draft_${nodeKey}`);
      if (draft) setSituation(draft);
    }
  }, [nodeKey, saved.situation]);

  const handleSituationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSituation(val);
    localStorage.setItem(`urge_draft_${nodeKey}`, val);
  };

  const canAnalyze = situation.trim().length >= 10;

  async function handleAnalyze() {
    if (!canAnalyze || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      await saveObservation({
        title: 'Initial Starting Point',
        content: situation.trim(),
        domain: 'reflection',
        focus: 'personal',
        source_node_key: nodeKey,
      });

      const result = await analyzeSituation(situation.trim(), nodeKey);
      setAnalysis(result);
      
      if (result.hasIdea && result.extractedIdea) {
        setEditableIdea(result.extractedIdea);
      }
    } catch (err: any) {
      console.error('[SITUATION EXPLORER]', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleConfirmIdea(skip: boolean = false) {
    if (!skip && editableIdea.trim().length > 0) {
      setIsSavingIdea(true);
      try {
        await saveObservation({
          title: 'Initial Idea',
          content: editableIdea.trim(),
          domain: 'problem',
          focus: 'personal',
          source_node_key: nodeKey,
        });
      } catch (err) {
        console.error('Failed to save idea', err);
      } finally {
        setIsSavingIdea(false);
      }
    }
    setIdeaConfirmed(true);
  }

  async function handleComplete() {
    localStorage.removeItem(`urge_draft_${nodeKey}`);
    await onComplete({
      situation: situation.trim(),
      analysis,
      ideaConfirmed: true,
      completed: true,
    });
  }

  return (
    <div className="w-full space-y-12 pb-16">
      
      {/* ---------------- CINEMATIC HEADER ---------------- */}
      <div className="w-full space-y-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {node.title || "Where are you right now?"}
        </h1>
        
        {briefingVideo && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-xl mt-8">
            <iframe 
              src={briefingVideo.url} 
              className="h-full w-full border-0" 
              allowFullScreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
      </div>

      {/* ---------------- PHASE 1: INPUT ---------------- */}
      <div className="w-full space-y-6 pt-6 border-t border-border/50">
        <p className="w-full text-lg leading-8 text-muted-foreground">
          There is no right starting point. Maybe you already have a specific concept in mind. Maybe you just know you want to build something. Tell us exactly what brought you here today.
        </p>

        <div className="w-full space-y-4 pt-4">
          <Textarea
            value={situation}
            onChange={handleSituationChange}
            placeholder="I've been thinking about starting something because..."
            className="min-h-[160px] w-full resize-none text-lg leading-8 shadow-sm"
            disabled={isAnalyzing || analysis !== null}
          />
        </div>

        {!analysis && (
          <div className="flex w-full justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="h-12 gap-2 rounded-full px-8 text-base shadow-md"
            >
              {isAnalyzing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Understanding...</>
              ) : (
                <>Lock it in <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        )}
        
        {error && <p className="w-full text-sm leading-6 text-destructive">{error}</p>}
      </div>

      {/* ---------------- PHASE 2: VERIFICATION ---------------- */}
      {analysis && !ideaConfirmed && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 space-y-8 border-t border-border pt-10 duration-700">
          <p className="w-full text-xl leading-8 text-foreground font-medium">
            {analysis.acknowledgment}
          </p>
          
          <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-6">
            {analysis.hasIdea ? (
              <>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary shrink-0" />
                  <p className="text-base leading-7 text-foreground">
                    It sounds like you already have the seed of an idea. We want to park this in your profile for Mission 2. Does this capture it accurately? You can edit it below before we save it.
                  </p>
                </div>
                <Textarea
                  value={editableIdea}
                  onChange={(e) => setEditableIdea(e.target.value)}
                  className="min-h-[100px] w-full resize-none bg-background text-base"
                  disabled={isSavingIdea}
                />
                <div className="flex w-full justify-end">
                  <Button onClick={() => handleConfirmIdea(false)} disabled={isSavingIdea} className="gap-2 shadow-sm">
                    {isSavingIdea ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save to Profile
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 w-full">
                  <Sparkles className="mt-1 h-5 w-5 text-primary shrink-0" />
                  <div className="space-y-4 w-full">
                    <p className="text-base leading-7 text-foreground">
                      From your response, it doesn't seem like you are driven by a specific idea or problem yet. Have you been thinking about one?
                    </p>
                    
                    {!showIdeaInput ? (
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowIdeaInput(true)} className="bg-background">
                          Yes, I have an idea
                        </Button>
                        <Button variant="secondary" onClick={() => handleConfirmIdea(true)}>
                          No, I'm just exploring
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-2">
                        <Textarea
                          value={editableIdea}
                          onChange={(e) => setEditableIdea(e.target.value)}
                          placeholder="Briefly describe the idea or problem..."
                          className="min-h-[100px] w-full resize-none bg-background text-base"
                          disabled={isSavingIdea}
                        />
                        <div className="flex w-full justify-end gap-3">
                          <Button variant="ghost" onClick={() => handleConfirmIdea(true)} disabled={isSavingIdea}>
                            Skip for now
                          </Button>
                          <Button onClick={() => handleConfirmIdea(false)} disabled={isSavingIdea || editableIdea.trim().length === 0} className="gap-2 shadow-sm">
                            {isSavingIdea ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save to Profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------------- PHASE 3: TRANSITION ---------------- */}
      {ideaConfirmed && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 space-y-8 border-t border-border pt-10 duration-700">
          <div className="w-full space-y-2">
            <p className="text-xl leading-8 text-muted-foreground">
              {analysis?.acknowledgment}
            </p>
            <p className="font-heading text-2xl font-semibold text-foreground pt-4">
              Let's discover what has kept you from starting.
            </p>
          </div>

          <div className="flex w-full justify-end pt-4">
            <Button onClick={handleComplete} className="h-12 gap-2 rounded-full px-8 text-base shadow-md">
              Begin Mission 1
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
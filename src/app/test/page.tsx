// src/app/test/page.tsx
'use client';

import { useState } from 'react';
import {
  ReflectiveOptionGrid,
  type ReflectiveItem,
  type ReflectiveOptionPreset,
} from '@/components/program/helpers/ReflectiveOptionGrid';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const mockPresets: ReflectiveOptionPreset[] = [
  {
    id: 'money',
    title: 'I think I need more money.',
    description: 'I keep thinking I need more financial security or resources before I can begin.',
    reflectionPrompt: 'When has needing more money stopped you from taking a step?',
    placeholder: 'I have held back because I thought I needed...',
  },
  {
    id: 'time',
    title: "I don't have enough time.",
    description: 'My current life already feels full, and starting something feels impossible to fit in.',
    reflectionPrompt: 'What do you actually find yourself waiting for before you make time to start?',
    placeholder: 'I keep telling myself I will start when...',
  },
  {
    id: 'clarity',
    title: "I don't know where to start.",
    description: 'There are too many possibilities, so I keep thinking about starting instead of taking a first step.',
    reflectionPrompt: 'When you think about starting, where does the uncertainty actually stop you?',
    placeholder: "I get stuck because I don't know...",
  },
  {
    id: 'judgment',
    title: "I'm worried about what people will think.",
    description: 'Being seen trying, failing, or looking inexperienced makes starting uncomfortable.',
    reflectionPrompt: 'What are you afraid people might see, say, or think if you try?',
    placeholder: 'I imagine people might...',
  },
];

export default function TestReflectiveGridPage() {
  const [submittedData, setSubmittedData] = useState<ReflectiveItem[] | null>(null);
  const [testKey, setTestKey] = useState(0);

  // Mock submission handler: simulates network latency and prints output
  async function handleMockSubmit(items: ReflectiveItem[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittedData(items);
    console.log('[TEST SUBMIT RESULT]:', items);
  }

  function handleReset() {
    setSubmittedData(null);
    setTestKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Test Control Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Test Harness
            </span>
            <h1 className="font-heading text-xl font-bold">
              ReflectiveOptionGrid Interactive Sandbox
            </h1>
          </div>

          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Sandbox
          </Button>
        </div>

        {/* Component Sandbox */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-10 shadow-sm">
          <ReflectiveOptionGrid
            key={testKey}
            title="What has been stopping you?"
            introParagraphs={[
              'You probably have a few reasons for not starting. Some may be practical. Others may be harder to admit.',
              'Choose any statements that feel familiar, or add your own in your own words. Click any card to write a reflection.',
            ]}
            options={mockPresets}
            entityLabel="barrier"
            primaryBadgeLabel="Biggest barrier"
            customPromptLabel="What barrier is stopping you?"
            customPromptPlaceholder="e.g. My partner isn't convinced yet / I cannot afford to lose health coverage..."
            onSubmit={handleMockSubmit}
          />
        </div>

        {/* Live Payload Inspector */}
        {submittedData && (
          <div className="rounded-2xl border border-primary/40 bg-primary/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Emitted Submission Payload
              </h2>
              <span className="text-xs text-muted-foreground">
                {submittedData.length} item(s) submitted
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {submittedData.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 text-sm space-y-2 ${
                    item.isPrimary
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{item.title}</span>
                    {item.isPrimary && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    &ldquo;{item.reflection}&rdquo;
                  </p>
                  <div className="flex gap-2 pt-1 text-[10px] text-muted-foreground">
                    <span>ID: <code className="font-mono">{item.id}</code></span>
                    <span>•</span>
                    <span>Custom: {item.isCustom ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ))}
            </div>

            <pre className="overflow-x-auto rounded-xl bg-muted/60 p-4 font-mono text-xs text-foreground">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
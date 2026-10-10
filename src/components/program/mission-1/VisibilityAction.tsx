'use client';

import { useState } from 'react';
import { ArrowRight,  Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { createUserContent } from '@/actions/user-content';

export function VisibilityAction({
    node,
    nodeKey,
    progress,
    onComplete,
}: NodeComponentProps) {
    const saved = progress.payload ?? {};

    const [body, setBody] = useState(
        typeof saved.body === 'string' ? saved.body : ''
    );

    const [step, setStep] = useState<'write' | 'published' | 'done'>(
        saved.completed
            ? 'done'
            : saved.published
                ? 'published'
                : 'write'
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canPublish = body.trim().length >= 20;

    async function handlePublish() {
        if (!canPublish || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await createUserContent({
                title: 'My Urge introduction',
                category: 'introduction',
                body: body.trim(),
                status: 'published',
                source_type: 'program_node',
                metadata: {
                    mission: 1,
                    quest: 3,
                    node_key: nodeKey,
                },
            });

            setStep('published');
        } catch (err) {
            console.error(err);
            setError('We could not publish your introduction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleComplete() {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onComplete({
                body: body.trim(),
                published: true,
                completed: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (step === 'done') {
        return (
            <div className="w-full max-w-3xl space-y-8">
                <div className="space-y-4">
                    <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        YOU ARE IN THE ROOM
                    </p>

                    <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                        You showed up.
                    </h2>

                    <p className="text-lg leading-8 text-muted-foreground">
                        You did not wait until you had a finished business or a polished
                        story. You let people see you starting.
                    </p>
                </div>

                <Button
                    onClick={() => onComplete({
                        body: body.trim(),
                        published: true,
                        completed: true,
                    })}
                    disabled={isSubmitting}
                    className="h-12 gap-2 rounded-full px-8 text-base"
                >
                    Continue
                    <ArrowRight className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    if (step === 'published') {
        return (
            <div className="w-full max-w-3xl space-y-10">
                <div className="space-y-4">
                    <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        YOU MADE YOURSELF VISIBLE
                    </p>

                    <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                        Your introduction is out there.
                    </h2>

                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                        <p className="whitespace-pre-wrap text-lg leading-8 text-foreground">
                            “{body}”
                        </p>
                    </div>

                    <p className="text-lg leading-8 text-muted-foreground">
                        That might have felt easy. It might have felt uncomfortable.
                        Either way, you just took a step that required you to be seen
                        before everything was ready.
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="h-12 gap-2 rounded-full px-8 text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl space-y-10">
            <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    YOUR FIRST STEP
                </p>

                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Let people see you starting.
                </h2>

                <p className="text-lg leading-8 text-muted-foreground">
                    You do not need a finished business, polished idea, or impressive
                    story. Introduce yourself to the Urge community as you are right
                    now.
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="space-y-5">
                    <div>
                        <p className="font-medium text-foreground">
                            You could tell people:
                        </p>

                        <ul className="mt-3 space-y-2 text-muted-foreground">
                            <li>Who you are</li>
                            <li>What brought you to Urge</li>
                            <li>What you're curious about or thinking about</li>
                            <li>What you hope to figure out</li>
                        </ul>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Do not write a pitch. Do not try to sound impressive. Just let
                        people know who is here.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <label
                    htmlFor="introduction"
                    className="text-lg font-medium text-foreground"
                >
                    Your introduction
                </label>

                <Textarea
                    id="introduction"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Hi, I'm..."
                    className="min-h-[220px] resize-none text-lg leading-8"
                    disabled={isSubmitting}
                />

                <p className="text-sm text-muted-foreground">
                    This will be shared with the Urge community.
                </p>
            </div>

            {error && (
                <p className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="flex justify-end">
                <Button
                    onClick={handlePublish}
                    disabled={!canPublish || isSubmitting}
                    className="h-12 gap-2 rounded-full px-8 text-base"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            Introduce myself
                            <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
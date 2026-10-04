'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Mail, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NodeComponentProps } from '@/components/program/componentRegistry';
import { inviteSquad } from '@/actions/contacts';

export function SquadBuilder({ node, nodeKey, progress, onComplete }: NodeComponentProps) {
  const saved = progress.payload ?? {};
  
  const [emails, setEmails] = useState<string[]>(
    Array.isArray(saved.emails) ? saved.emails : ['']
  );
  const [message, setMessage] = useState(
    typeof saved.message === 'string' ? saved.message : "I'm starting a new project and could use some honest feedback as I build it. Would you be up for being in my corner?"
  );
  
  const [isCommitted, setIsCommitted] = useState(saved.completed === true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmails = emails.filter(e => e.trim().includes('@'));
  const canSubmit = validEmails.length > 0 && message.trim().length > 10;

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    if (emails.length < 3) setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length ? newEmails : ['']);
  };

  async function handleSend() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await inviteSquad(validEmails, message.trim(), nodeKey);
      setIsCommitted(true);
    } catch (err: any) {
      setError('Something went wrong sending the invites.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onComplete({ emails: validEmails, message: message.trim(), completed: true });
  }

  return (
    <div className="w-full space-y-10">
      <div className="space-y-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {node.title || "Assemble your squad."}
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {node.description || "Building in isolation is a trap. Pick 1 to 3 people you trust to give you brutally honest feedback, not just blind support. We will email them on your behalf."}
        </p>
      </div>

      {!isCommitted ? (
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Who is in your corner? (Max 3)
            </label>
            <div className="space-y-3">
              {emails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                      className="h-12 pl-10 text-base"
                    />
                  </div>
                  {emails.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeEmailField(idx)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              {emails.length < 3 && (
                <Button variant="outline" onClick={addEmailField} className="h-10 gap-2 border-dashed">
                  <Plus className="h-4 w-4" /> Add another
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              The Ask
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none text-lg leading-8"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!canSubmit || isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</> : 'Send Invites'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 max-w-3xl space-y-8 duration-700">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <h3 className="font-heading text-2xl font-medium text-foreground">Invites Sent.</h3>
            <p className="pt-2 text-lg leading-8 text-muted-foreground">
              You've officially pulled other people into your orbit. The social pressure is a feature, not a bug.
            </p>
          </div>
          <Button onClick={handleComplete} disabled={isSubmitting} className="h-12 gap-2 rounded-full px-8 text-base">
            {isSubmitting ? 'Moving forward...' : 'Continue'}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
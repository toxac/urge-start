'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserOpportunities } from '@/actions/opportunities';
import { createUserContact } from '@/actions/contacts';
import { saveUserTasks } from '@/actions/tasks';
import {
  getOpportunityInteractions,
  saveOpportunityInteraction,
  getInterviewContacts,
} from '@/actions/customer-interactions';

import type {CustomerInteraction} from '@/lib/types/interactions';
import type { UserOpportunity } from '@/lib/types/opportunities';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

type ContactOption = { id: string; name: string };

export function CustomerConversations({
  nodeKey,
  node,
  progress,
  onComplete,
}: NodeComponentProps) {
  const [opps, setOpps] = useState<UserOpportunity[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selected, setSelected] = useState('');
  const [rows, setRows] = useState<CustomerInteraction[]>([]);
  const [notes, setNotes] = useState('');
  const [contactId, setContactId] = useState('');
  const [newContact, setNewContact] = useState('');
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function loadNotes(id: string) {
    if (!id) {
      setRows([]);
      return;
    }
    try {
      setRows(await getOpportunityInteractions(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notes.');
    }
  }

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchUserOpportunities(),
      (async () => {
        // Fetch contacts through the authenticated action; see add-contact below
        // if no existing list is available.
        return getInterviewContacts();
      })(),
    ])
      .then(([o, c]) => {
        if (!alive) return;
        setOpps(o);
        setContacts(c.map((x) => ({ id: x.id, name: x.name })));
        setSelected(o[0]?.id ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Could not load data.');
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    void loadNotes(selected);
  }, [selected]);

  const opportunity = opps.find((o) => o.id === selected);

  async function addContact() {
    if (!newContact.trim()) return;
    setSaving(true);
    setError('');
    try {
      const r = await createUserContact({
        name: newContact.trim(),
        roles: ['customer'],
        status: 'not_invited',
        organization: null,
        email: null,
        metadata: { source: 'mission-2-quest-2' },
      });
      setContacts((old) => [...old, { id: r.contact.id, name: r.contact.name }]);
      setContactId(r.contact.id);
      setNewContact('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!selected || !notes.trim()) return;
    setSaving(true);
    setError('');
    try {
      const r = await saveOpportunityInteraction({
        opportunityId: selected,
        contactId: contactId || null,
        notes,
      });
      setRows((old) => [r, ...old]);
      setNotes('');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save note.');
    } finally {
      setSaving(false);
    }
  }

  async function saveTask() {
    if (!task.trim() || !selected) return;
    setSaving(true);
    setError('');
    try {
      await saveUserTasks([
        {
          title: task.trim(),
          task_type: 'venture',
          source_node_key: nodeKey,
          contact_id: contactId || undefined,
          metadata: { opportunity_id: selected, source: 'mission-2-quest-2' },
        },
      ]);
      setTask('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading opportunities…
      </div>
    );

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{node.title}</h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {!opps.length ? (
        <p className="rounded-xl border p-5 text-muted-foreground">
          No saved opportunities yet. Return to Quest 1 to choose a problem.
        </p>
      ) : (
        <>
          <div className="max-w-3xl space-y-2">
            <label className="text-sm font-medium">Opportunity</label>
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border bg-background p-3"
            >
              {opps.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {opportunity && (
            <section className="max-w-3xl space-y-4 rounded-2xl border p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Conversation guide
              </p>
              <h2 className="text-xl font-semibold">{opportunity.title}</h2>
              <p className="leading-7 text-muted-foreground">
                Explore how people experience{' '}
                <strong className="text-foreground">
                  {opportunity.problem || opportunity.description || opportunity.title}
                </strong>
                . Ask naturally and follow their story.
              </p>
              {[
                'Tell me about the last time this happened.',
                'How do you handle it today?',
                'What is the hardest part?',
                'What have you already tried?',
                'What am I missing that matters to you?',
              ].map((q) => (
                <p key={q} className="rounded-lg bg-muted/40 p-3">
                  “{q}”
                </p>
              ))}
              <p className="text-sm text-muted-foreground">
                Optional prompts, not a fixed questionnaire. You can have the conversation
                offline and return later.
              </p>
            </section>
          )}

          <section className="max-w-3xl space-y-4 rounded-2xl border p-5">
            <h2 className="font-semibold">
              Conversation notes{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </h2>

            <label className="block text-sm">Contact, if you want to save one</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full rounded-lg border bg-background p-2.5"
            >
              <option value="">No contact linked</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Add contact name"
                className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2"
              />
              <Button
                variant="outline"
                onClick={addContact}
                disabled={saving || !newContact.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>

            <textarea
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              placeholder="What did they say? What stood out?"
              className="w-full rounded-lg border bg-background p-3 leading-6"
            />

            <div className="flex justify-end">
              <Button onClick={saveNote} disabled={saving || !notes.trim()}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save note
              </Button>
            </div>

            {saved && (
              <p className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                Saved.
              </p>
            )}

            {rows.map((r) => (
              <article key={r.id} className="rounded-lg bg-muted/40 p-4">
                <p className="whitespace-pre-wrap">{r.notes}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(r.interaction_at).toLocaleDateString()}
                </p>
              </article>
            ))}
          </section>

          <section className="max-w-3xl space-y-3 rounded-xl border p-4">
            <label className="text-sm font-medium">
              Follow-up task{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Something you want to remember to do"
                className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2"
              />
              <Button variant="outline" onClick={saveTask} disabled={saving || !task.trim()}>
                Add task
              </Button>
            </div>
          </section>
        </>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={() => onComplete({ completed: true })} className="rounded-full px-6">
          Continue to reflection <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import { extractCustomerPersonas } from '@/actions/responses/mission4';
import type {
  ExtractedCustomerPersona,
  Mission4ContextSummary,
  ObservedUserProfileInput,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

function escapeCsvCell(value: string): string {
  const clean = value.replace(/\r?\n/g, ' ').trim();
  if (clean.includes(',') || clean.includes('"')) {
    return `"${clean.replace(/"/g, '""')}"`;
  }
  return clean;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      if (ch === '\r') i++;
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

export function CustomerPersonas({
  node,
  nodeKey,
  onComplete,
}: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [profiles, setProfiles] = useState<ObservedUserProfileInput[]>([]);
  const [personas, setPersonas] = useState<ExtractedCustomerPersona[]>([]);
  const [painsRemoved, setPainsRemoved] = useState<string[]>([]);
  const [gainsCreated, setGainsCreated] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMission4ContextSummary()
      .then((data) => {
        if (!alive) return;
        setContext(data);
        const proj = data.project ?? activeProject;
        if (proj) {
          projectsActions.upsertProject(proj);
          if (Array.isArray(proj.metadata?.observedProfiles)) {
            setProfiles(proj.metadata.observedProfiles);
          }
          if (Array.isArray(proj.metadata?.personas)) {
            setPersonas(proj.metadata.personas);
          }
          if (Array.isArray(proj.metadata?.painsRemoved)) {
            setPainsRemoved(proj.metadata.painsRemoved);
          }
          if (Array.isArray(proj.metadata?.gainsCreated)) {
            setGainsCreated(proj.metadata.gainsCreated);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const project = context?.project ?? activeProject;

  function handleDownloadTemplate() {
    const header = [
      'person_or_group',
      'situation',
      'biggest_pain',
      'current_workaround',
      'desired_gain',
    ];

    const warmLeads = context?.m3WarmLeads ?? [];
    const quotes = context?.m3Quotes ?? [];

    const seedRows: string[][] = [];

    if (warmLeads.length > 0) {
      warmLeads.slice(0, 4).forEach((lead, idx) => {
        seedRows.push([
          lead.name,
          lead.action_taken,
          quotes[idx] ?? 'Describe what frustrates or slows them down',
          'How they handle this today',
          'What a great result looks like to them',
        ]);
      });
    } else {
      seedRows.push(
        [
          'Example: Riya (Independent Cafe Owner)',
          'Closing shift at 10 PM after 12 hours on her feet',
          'Runs out of milk/beans mid-week or wastes money over-ordering',
          'Counts stock on a paper clipboard and texts suppliers manually',
          'Knows what to reorder in under 2 minutes before locking up',
        ],
        [
          'Person or group 2',
          'When/where the problem hits',
          'Their biggest pain or cost',
          'What they do today instead',
          'What gain they want most',
        ],
      );
    }

    const csvContent = [header, ...seedRows]
      .map((r) => r.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-observations-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        setError(
          'The uploaded CSV appears empty. Fill in at least one row below the header and upload again.',
        );
        return;
      }

      const dataRows = rows.slice(1).filter((r) => {
        const first = (r[0] ?? '').toLowerCase();
        return (
          r.some((cell) => cell.length > 0) &&
          !first.startsWith('example:') &&
          first !== 'person or group 2'
        );
      });

      if (dataRows.length === 0) {
        setError(
          'Replace the example rows with at least 1 real person or customer group you observed.',
        );
        return;
      }

      const parsedProfiles: ObservedUserProfileInput[] = dataRows.map(
        (r, idx) => ({
          id: `obs_profile_${idx + 1}`,
          label: r[0] || `Person ${idx + 1}`,
          situation: r[1] || '',
          painExperienced: r[2] || '',
          currentWorkaround: r[3] || '',
          desiredOutcome: r[4] || '',
        }),
      );

      setProfiles(parsedProfiles);
      await runPersonaExtraction(parsedProfiles, false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not read that CSV file.',
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function runPersonaExtraction(
    targetProfiles: ObservedUserProfileInput[],
    regenerate: boolean,
  ) {
    if (extracting) return;
    setExtracting(true);
    setError(null);

    try {
      const extracted = await extractCustomerPersonas({
        projectTitle: project?.title ?? 'My Project',
        problemStatement:
          context?.m3ProblemStatement || project?.description || '',
        profiles: targetProfiles,
        m3Quotes: context?.m3Quotes ?? [],
        nodeKey,
        regenerate,
      });

      setPersonas(extracted.personas);
      setPainsRemoved(extracted.painsRemoved);
      setGainsCreated(extracted.gainsCreated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not extract customer personas.',
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveAndContinue() {
    if (saving || !project) return;
    if (personas.length === 0) {
      setError(
        'Upload your completed customer sheet first so we can extract your customer personas and pains/gains.',
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedProject = await updateUserProjectMetadata(project.id, {
        observedProfiles: profiles,
        personas,
        painsRemoved,
        gainsCreated,
      });

      projectsActions.upsertProject(updatedProject);

      await onComplete({
        completed: true,
        personasCount: personas.length,
        painsRemoved,
        gainsCreated,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save customer personas.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your Mission 3 customer notes…
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {node.title}
        </h1>
        <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
          {node.description}
        </p>
      </div>

      {/* Step 1: Download Template & Guide */}
      <div className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Step 1 · Fill Out Your Observation Sheet
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Download the template, fill 2–5 rows in Google Sheets or Excel, and
              upload CSV
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="rounded-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV template
          </Button>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 text-sm">
          <p className="font-semibold text-foreground">
            How to fill each column (keep it short and concrete):
          </p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>
              • <strong className="text-foreground">person_or_group:</strong>{' '}
              Who they are (we pre-filled names from your Mission 3 warm list if
              available).
            </li>
            <li>
              • <strong className="text-foreground">situation:</strong> When or
              where the problem hits them.
            </li>
            <li>
              • <strong className="text-foreground">biggest_pain:</strong> What
              frustrates them or costs them time/money.
            </li>
            <li>
              • <strong className="text-foreground">current_workaround:</strong>{' '}
              What they do today instead.
            </li>
            <li>
              • <strong className="text-foreground">desired_gain:</strong> The
              exact result or relief they wish they had.
            </li>
          </ul>
        </div>

        {/* Upload Zone */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-border p-4">
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              Step 2 · Upload your completed CSV
            </p>
            <p className="text-xs text-muted-foreground">
              In Google Sheets: File → Download → Comma Separated Values (.csv)
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleFileUpload(e)}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting || saving}
              className="rounded-full"
            >
              {extracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reading &amp; extracting personas…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {profiles.length > 0 ? 'Upload updated CSV' : 'Upload CSV'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Parsed CSV Preview */}
        {profiles.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Read {profiles.length} row{profiles.length === 1 ? '' : 's'} from
              your sheet
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Person / Group</th>
                    <th className="px-3 py-2 font-semibold">Biggest Pain</th>
                    <th className="px-3 py-2 font-semibold">Desired Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profiles.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-medium text-foreground">
                        {row.label}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.painExperienced}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.desiredOutcome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Personas & Pains/Gains */}
      {personas.length > 0 && (
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-bold">
                Who you&apos;re building for (edit anything that feels off)
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {personas.map((persona, idx) => (
              <div
                key={persona.id}
                className="space-y-3 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Customer Persona {idx + 1}
                  </span>
                </div>

                <input
                  type="text"
                  value={persona.name}
                  onChange={(e) =>
                    setPersonas((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, name: e.target.value } : p,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-base font-bold"
                />

                <textarea
                  rows={2}
                  value={persona.summary}
                  onChange={(e) =>
                    setPersonas((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, summary: e.target.value } : p,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs leading-5 text-muted-foreground"
                />

                <div className="space-y-1.5 text-xs">
                  <p>
                    <strong className="text-foreground">Core pain: </strong>
                    <span className="text-muted-foreground">
                      {persona.corePain}
                    </span>
                  </p>
                  <p>
                    <strong className="text-foreground">Desired gain: </strong>
                    <span className="text-muted-foreground">
                      {persona.desiredGain}
                    </span>
                  </p>
                  {persona.currentAlternative && (
                    <p>
                      <strong className="text-foreground">
                        Current alternative:{' '}
                      </strong>
                      <span className="text-muted-foreground">
                        {persona.currentAlternative}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Consolidated Pains & Gains */}
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Pains your v1 offer should remove
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {painsRemoved.map((pain, i) => (
                  <li key={i}>• {pain}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Gains your v1 offer should create
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {gainsCreated.map((gain, i) => (
                  <li key={i}>• {gain}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="flex max-w-3xl justify-end pt-4">
        <Button
          type="button"
          onClick={() => void handleSaveAndContinue()}
          disabled={saving || extracting || personas.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Make the ruthless cut
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
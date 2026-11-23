'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { $activeProject, projectsActions } from '@/lib/stores/projects';
import {
  fetchMission4ContextSummary,
  updateUserProjectMetadata,
} from '@/actions/projects';
import type {
  CostBucket,
  CostConfidence,
  EconomicsLineItem,
  Mission4ContextSummary,
  ProjectEconomics,
} from '@/lib/types/projects';
import type { NodeComponentProps } from '@/components/program/componentRegistry';

const UNIVERSAL_COSTS_ROWS: string[][] = [
  ['Cost_Type', 'Item', 'Amount', 'Confidence', 'Notes'],
  [
    'Setup',
    'Initial tools, equipment, or product samples',
    '250',
    'Estimate',
    'One-time before first paying customer',
  ],
  [
    'Setup',
    'Domain, basic registration, or landing page setup',
    '50',
    'Confirmed',
    'One-time setup',
  ],
  [
    'Fixed',
    'Software, hosting, or store subscription',
    '40',
    'Confirmed',
    'Repeats every month even at 0 sales',
  ],
  [
    'Fixed',
    'Rent, utilities, insurance, or base marketing',
    '100',
    'Estimate',
    'Repeats every month',
  ],
  [
    'Variable',
    'Materials, wholesale cost, or API usage per sale',
    '15',
    'Estimate',
    'Spent only when you make 1 sale',
  ],
  [
    'Variable',
    'Packaging, shipping, or delivery travel per sale',
    '5',
    'Estimate',
    'Spent only when you make 1 sale',
  ],
  [
    'Variable',
    'Payment gateway / platform fee (~2.5-3%)',
    '2',
    'Confirmed',
    'Stripe / Razorpay / marketplace fee per sale',
  ],
  [
    'Time',
    'Hands-on delivery + prep/admin hours per sale',
    '2.5',
    'Estimate',
    'Enter HOURS per customer/order (not money)',
  ],
];

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

function normalizeBucket(rawType: string, rawItem: string): CostBucket {
  const combined = `${rawType} ${rawItem}`.toLowerCase();
  if (combined.includes('time') || combined.includes('hour')) return 'time';
  if (
    combined.includes('setup') ||
    combined.includes('one-time') ||
    combined.includes('onetime') ||
    combined.includes('initial')
  ) {
    return 'setup';
  }
  if (
    combined.includes('fixed') ||
    combined.includes('monthly') ||
    combined.includes('rent') ||
    combined.includes('subscription')
  ) {
    return 'fixed';
  }
  return 'variable';
}

function parseLeadingNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const match = raw.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

export function CostsLedger({ node, onComplete }: NodeComponentProps) {
  const activeProject = useStore($activeProject);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [context, setContext] = useState<Mission4ContextSummary | null>(null);
  const [currency, setCurrency] = useState<string>('₹');
  const [lineItems, setLineItems] = useState<EconomicsLineItem[]>([]);
  const [loading, setLoading] = useState(true);
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
          if (proj.metadata?.economics) {
            setLineItems(proj.metadata.economics.lineItems ?? []);
            if (proj.metadata.economics.currency) {
              setCurrency(proj.metadata.economics.currency);
            }
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

  const summary = lineItems.reduce(
    (acc, item) => {
      if (item.bucket === 'setup') acc.setup += item.amount;
      else if (item.bucket === 'fixed') acc.fixed += item.amount;
      else if (item.bucket === 'variable') acc.variable += item.amount;
      else if (item.bucket === 'time') acc.hours += item.amount;

      if (item.confidence === 'estimate' && item.amount > 0) {
        acc.estimates.push(item.item);
      }
      return acc;
    },
    {
      setup: 0,
      fixed: 0,
      variable: 0,
      hours: 0,
      estimates: [] as string[],
    },
  );

  function handleDownloadTemplate() {
    const csvContent = UNIVERSAL_COSTS_ROWS.map((row) =>
      row.map(escapeCsvCell).join(','),
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-costs-worksheet.csv';
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
        throw new Error(
          'Your CSV looks empty. Add at least one cost row below the header and upload again.',
        );
      }

      const parsed: EconomicsLineItem[] = rows
        .slice(1)
        .filter((r) => r[0] || r[1])
        .map((r, idx) => {
          const rawType = r[0] ?? 'Variable';
          const rawItem = r[1] || r[0] || `Cost item ${idx + 1}`;
          const amount = Number((r[2] ?? '0').replace(/[^0-9.-]+/g, '')) || 0;
          const rawConf = (r[3] ?? '').toLowerCase();
          const confidence: CostConfidence = rawConf.includes('confirm')
            ? 'confirmed'
            : 'estimate';

          return {
            id: `cost_${idx + 1}`,
            bucket: normalizeBucket(rawType, rawItem),
            item: rawItem,
            amount,
            confidence,
            notes: r[4] || undefined,
          };
        });

      if (parsed.length === 0) {
        throw new Error('Could not find any valid cost rows in that CSV.');
      }

      setLineItems(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not parse that CSV file.',
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveAndContinue() {
    if (saving || !project) return;
    if (lineItems.length === 0) {
      setError('Upload your completed costs worksheet first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const existing = project.metadata?.economics;
      const targetIncome = parseLeadingNumber(
        context?.m1Constraints?.incomeGoal,
        existing?.targetMonthlyIncome ?? 50000,
      );
      const weeklyHours = parseLeadingNumber(
        context?.m1Constraints?.weeklyHours,
        existing?.availableWeeklyHours ?? 10,
      );

      const pricePerUnit = existing?.pricePerUnit ?? 0;
      const cacPerUnit = existing?.cacPerUnit ?? 0;
      const margin = pricePerUnit - summary.variable - cacPerUnit;
      const marginPercent =
        pricePerUnit > 0 ? Math.round((margin / pricePerUnit) * 100) : 0;
      const breakEven = margin > 0 ? Math.ceil(summary.fixed / margin) : 0;
      const setupPayback = margin > 0 ? Math.ceil(summary.setup / margin) : 0;
      const unitsForIncome =
        margin > 0 ? Math.ceil((summary.fixed + targetIncome) / margin) : 0;
      const weeklyHoursAtGoal =
        unitsForIncome > 0 && summary.hours > 0
          ? Number(((unitsForIncome * summary.hours) / 4.33).toFixed(1))
          : 0;

      const updatedEconomics: ProjectEconomics = {
        businessType: project.metadata?.businessType ?? 'side_hustle',
        currency,
        oneTimeSetupCosts: summary.setup,
        monthlyFixedCosts: summary.fixed,
        directCostPerUnit: summary.variable,
        cacPerUnit,
        hoursPerUnit: summary.hours,
        pricePerUnit,
        pricingApproach: existing?.pricingApproach,
        pricingRationale: existing?.pricingRationale,
        customerValueSavedMonthly: existing?.customerValueSavedMonthly,
        targetMonthlyIncome: targetIncome,
        availableWeeklyHours: weeklyHours,
        marginPerUnit: margin,
        marginPercent,
        breakEvenUnitsPerMonth: breakEven,
        setupPaybackUnits: setupPayback,
        unitsForIncomeGoal: unitsForIncome,
        weeklyHoursAtIncomeGoal: weeklyHoursAtGoal,
        projectedMonthlyUnits: existing?.projectedMonthlyUnits,
        lineItems,
        uncertainNotes:
          summary.estimates.length > 0
            ? `Estimated items to verify: ${summary.estimates.join(', ')}`
            : undefined,
        paymentModel: existing?.paymentModel,
        uploadedAt: new Date().toISOString(),
      };

      const updatedProject = await updateUserProjectMetadata(project.id, {
        economics: updatedEconomics,
      });
      projectsActions.upsertProject(updatedProject);

      await onComplete({
        completed: true,
        costSummary: summary,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your cost list.',
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Preparing your costs worksheet…
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

      {/* Step 1: Download & Guide */}
      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Step 1 · Universal Costs Worksheet
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Download the template, list all costs in Google Sheets or Excel,
              and upload CSV
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="rounded-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download costs CSV
          </Button>
        </div>

        {/* 4 Bucket Guide */}
        <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-xs sm:grid-cols-2">
          <div>
            <p className="font-bold text-foreground">1. Setup (One-time)</p>
            <p className="mt-0.5 text-muted-foreground">
              Tools, initial samples, domain, or equipment bought once before
              your first sale.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground">
              2. Fixed (Every month)
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Software, rent, utilities, or subscriptions you pay even if you
              make 0 sales.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground">
              3. Variable (Per sale)
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Materials, shipping, API usage, or payment gateway fees (~2.5–3%)
              spent per order.
            </p>
          </div>
          <div>
            <p className="font-bold text-foreground">
              4. Time (Hours per sale)
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Hands-on delivery + prep/admin hours per client or order (enter
              hours, not money).
            </p>
          </div>
        </div>

        {/* Currency + Upload */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-semibold"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>

            <div className="text-sm">
              <p className="font-semibold text-foreground">
                Step 2 · Upload completed CSV
              </p>
              <p className="text-xs text-muted-foreground">
                Delete rows that don&apos;t apply and add your own.
              </p>
            </div>
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
              disabled={saving}
              className="rounded-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {lineItems.length > 0 ? 'Upload updated CSV' : 'Upload CSV'}
            </Button>
          </div>
        </div>

        {/* Parsed Totals */}
        {lineItems.length > 0 && (
          <div className="space-y-4 pt-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Read {lineItems.length} cost items from your sheet
            </p>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">One-Time Setup</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {currency}
                  {summary.setup.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Monthly Fixed</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {currency}
                  {summary.fixed.toLocaleString()}/mo
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Variable / Sale
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {currency}
                  {summary.variable.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Hours / Sale
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {summary.hours} hrs
                </p>
              </div>
            </div>

            {summary.estimates.length > 0 && (
              <p className="text-xs text-amber-700">
                <strong>Marked as Estimate ({summary.estimates.length}):</strong>{' '}
                {summary.estimates.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

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
          disabled={saving || lineItems.length === 0}
          className="h-12 rounded-full px-8 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Look at what one sale costs
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
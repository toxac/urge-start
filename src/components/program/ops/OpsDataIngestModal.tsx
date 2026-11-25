'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  Plug,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ingestOpsExpenses,
  ingestOpsSales,
  ingestOpsTraffic,
} from '@/actions/ops';
import { opsActions } from '@/lib/stores/ops';
import type {
  OpsExpenseCategory,
  OpsTrafficChannelType,
} from '@/lib/types/ops';

type IngestTab = 'sales' | 'traffic' | 'expenses';

type OpsDataIngestModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  currency: string;
};

const CSV_TEMPLATES: Record<
  IngestTab,
  { filename: string; headers: string[]; sampleRow: string[] }
> = {
  sales: {
    filename: 'urge-sales-template.csv',
    headers: [
      'order_date',
      'customer_name',
      'customer_segment',
      'acquisition_channel',
      'gross_amount',
      'refund_amount',
      'direct_cost',
      'hours_spent',
      'outcome_delivered',
      'is_repeat',
      'notes',
    ],
    sampleRow: [
      new Date().toISOString().slice(0, 10),
      'Ananya Rao',
      'Cafe',
      'WhatsApp Direct',
      '3500',
      '0',
      '200',
      '2.5',
      'true',
      'false',
      'Loved the 1-page cost breakdown',
    ],
  },
  traffic: {
    filename: 'urge-traffic-campaigns-template.csv',
    headers: [
      'period_start',
      'channel_type',
      'channel_name',
      'campaign_name',
      'impressions_or_footfall',
      'visits_or_engagements',
      'inquiries_or_leads',
      'spend',
    ],
    sampleRow: [
      new Date().toISOString().slice(0, 10),
      'social',
      'Instagram',
      'Cafe Cost Leak Reel #1',
      '1800',
      '95',
      '7',
      '0',
    ],
  },
  expenses: {
    filename: 'urge-expenses-template.csv',
    headers: ['expense_date', 'category', 'item', 'amount'],
    sampleRow: [
      new Date().toISOString().slice(0, 10),
      'tools',
      'Domain & workspace subscription',
      '1200',
    ],
  },
};

function parseSimpleCsv(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? '';
    });
    rows.push(record);
  }
  return rows;
}

export function OpsDataIngestModal({
  open,
  onClose,
  projectId,
  currency,
}: OpsDataIngestModalProps) {
  const [tab, setTab] = useState<IngestTab>('sales');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Sales form
  const today = new Date().toISOString().slice(0, 10);
  const [orderDate, setOrderDate] = useState(today);
  const [customerName, setCustomerName] = useState('');
  const [customerSegment, setCustomerSegment] = useState('');
  const [acqChannel, setAcqChannel] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [isRepeat, setIsRepeat] = useState(false);
  const [outcomeDelivered, setOutcomeDelivered] = useState(true);
  const [saleNote, setSaleNote] = useState('');

  // Manual Traffic form
  const [periodStart, setPeriodStart] = useState(today);
  const [channelType, setChannelType] =
    useState<OpsTrafficChannelType>('website');
  const [channelName, setChannelName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [impressions, setImpressions] = useState('');
  const [visits, setVisits] = useState('');
  const [inquiries, setInquiries] = useState('');
  const [spend, setSpend] = useState('0');

  // Manual Expense form
  const [expenseDate, setExpenseDate] = useState(today);
  const [expenseCategory, setExpenseCategory] =
    useState<OpsExpenseCategory>('fixed');
  const [expenseItem, setExpenseItem] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  if (!open) return null;

  function handleDownloadTemplate(targetTab: IngestTab) {
    const tpl = CSV_TEMPLATES[targetTab];
    const content = [tpl.headers.join(','), tpl.sampleRow.join(',')].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tpl.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    targetTab: IngestTab,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const text = await file.text();
      const parsed = parseSimpleCsv(text);
      if (parsed.length === 0) {
        throw new Error('CSV file appears empty or missing data rows.');
      }

      if (targetTab === 'sales') {
        const inserted = await ingestOpsSales(
          projectId,
          parsed.map((r) => ({
            order_date: r.order_date || today,
            customer_name: r.customer_name || null,
            customer_segment: r.customer_segment || null,
            acquisition_channel: r.acquisition_channel || null,
            gross_amount: Number(r.gross_amount) || 0,
            refund_amount: Number(r.refund_amount) || 0,
            direct_cost: Number(r.direct_cost) || 0,
            hours_spent: Number(r.hours_spent) || 0,
            outcome_delivered:
              r.outcome_delivered?.toLowerCase() !== 'false',
            is_repeat: r.is_repeat?.toLowerCase() === 'true',
            source: 'csv',
            notes: r.notes || null,
          })),
        );
        opsActions.prependSales(inserted);
        setSuccessMsg(`Imported ${inserted.length} sales rows.`);
      } else if (targetTab === 'traffic') {
        const inserted = await ingestOpsTraffic(
          projectId,
          parsed.map((r) => ({
            period_start: r.period_start || today,
            channel_type: (r.channel_type as OpsTrafficChannelType) || 'website',
            channel_name: r.channel_name || 'Direct',
            campaign_name: r.campaign_name || null,
            impressions_or_footfall: Number(r.impressions_or_footfall) || 0,
            visits_or_engagements: Number(r.visits_or_engagements) || 0,
            inquiries_or_leads: Number(r.inquiries_or_leads) || 0,
            spend: Number(r.spend) || 0,
            source: 'csv',
          })),
        );
        opsActions.prependTraffic(inserted);
        setSuccessMsg(`Imported ${inserted.length} traffic & campaign rows.`);
      } else {
        const inserted = await ingestOpsExpenses(
          projectId,
          parsed.map((r) => ({
            expense_date: r.expense_date || today,
            category: (r.category as OpsExpenseCategory) || 'other',
            item: r.item || 'Operating expense',
            amount: Number(r.amount) || 0,
            source: 'csv',
          })),
        );
        opsActions.prependExpenses(inserted);
        setSuccessMsg(`Imported ${inserted.length} expense rows.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import CSV.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  }

  async function handleSaveManualSale(e: React.FormEvent) {
    e.preventDefault();
    if (!grossAmount || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const inserted = await ingestOpsSales(projectId, [
        {
          order_date: orderDate,
          customer_name: customerName || null,
          customer_segment: customerSegment || null,
          acquisition_channel: acqChannel || null,
          gross_amount: Number(grossAmount) || 0,
          hours_spent: Number(hoursSpent) || 0,
          outcome_delivered: outcomeDelivered,
          is_repeat: isRepeat,
          source: 'manual',
          notes: saleNote || null,
        },
      ]);
      opsActions.prependSales(inserted);
      setCustomerName('');
      setGrossAmount('');
      setHoursSpent('');
      setSaleNote('');
      setSuccessMsg('Sale & customer delivery logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save sale.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveManualTraffic(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const inserted = await ingestOpsTraffic(projectId, [
        {
          period_start: periodStart,
          channel_type: channelType,
          channel_name: channelName.trim(),
          campaign_name: campaignName.trim() || null,
          impressions_or_footfall: Number(impressions) || 0,
          visits_or_engagements: Number(visits) || 0,
          inquiries_or_leads: Number(inquiries) || 0,
          spend: Number(spend) || 0,
          source: 'manual',
        },
      ]);
      opsActions.prependTraffic(inserted);
      setChannelName('');
      setCampaignName('');
      setImpressions('');
      setVisits('');
      setInquiries('');
      setSpend('0');
      setSuccessMsg('Traffic & campaign batch logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save traffic.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveManualExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseItem.trim() || !expenseAmount || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const inserted = await ingestOpsExpenses(projectId, [
        {
          expense_date: expenseDate,
          category: expenseCategory,
          item: expenseItem.trim(),
          amount: Number(expenseAmount) || 0,
          source: 'manual',
        },
      ]);
      opsActions.prependExpenses(inserted);
      setExpenseItem('');
      setExpenseAmount('');
      setSuccessMsg('Operating expense logged.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Update Operating Data
            </h2>
            <p className="text-xs text-muted-foreground">
              Sync connected tools, upload a CSV template, or log entries
              manually.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Connected Integrations Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Plug className="h-3.5 w-3.5 text-primary" />
            <span>Integrations:</span>
            <span className="rounded-full bg-background px-2.5 py-0.5 text-muted-foreground">
              Shopify / Razorpay / GA4 (CSV fallback active)
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 border-b border-border pb-3">
          {(
            [
              ['sales', '1. Sales & Customers'],
              ['traffic', '2. Traffic & Campaigns'],
              ['expenses', '3. Expenses'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CSV Template Download & Upload Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              Bulk upload via standard CSV template
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate(tab)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Template .csv
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={(e) => void handleCsvUpload(e, tab)}
                disabled={saving}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Manual Forms per Tab */}
        {tab === 'sales' && (
          <form
            onSubmit={(e) => void handleSaveManualSale(e)}
            className="mt-5 space-y-4 text-sm"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold">Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  placeholder="3500"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Delivery Hours Spent
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  placeholder="2.5"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Third Wave Cafe"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Segment</label>
                <input
                  type="text"
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  placeholder="e.g. Cafe / Bakery"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Channel Source
                </label>
                <input
                  type="text"
                  value={acqChannel}
                  onChange={(e) => setAcqChannel(e.target.value)}
                  placeholder="e.g. WhatsApp / Walk-in"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-xs">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={outcomeDelivered}
                  onChange={(e) => setOutcomeDelivered(e.target.checked)}
                />
                Customer achieved promised v1 outcome
              </label>
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={isRepeat}
                  onChange={(e) => setIsRepeat(e.target.checked)}
                />
                Repeat / renewal order
              </label>
            </div>

            <input
              type="text"
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="Customer feedback, win, or friction note..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />

            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Log Sale Entry
            </Button>
          </form>
        )}

        {tab === 'traffic' && (
          <form
            onSubmit={(e) => void handleSaveManualTraffic(e)}
            className="mt-5 space-y-4 text-sm"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold">Week / Date</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Type</label>
                <select
                  value={channelType}
                  onChange={(e) =>
                    setChannelType(e.target.value as OpsTrafficChannelType)
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="website">Website Traffic</option>
                  <option value="store_footfall">Store Footfall</option>
                  <option value="social">Social Media</option>
                  <option value="paid_campaign">Paid Campaign</option>
                  <option value="direct_outreach">Direct Outreach</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Instagram / Website"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold">
                  Views / Footfall
                </label>
                <input
                  type="number"
                  min={0}
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Visits / Clicks
                </label>
                <input
                  type="number"
                  min={0}
                  value={visits}
                  onChange={(e) => setVisits(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary">
                  Inquiries / Leads
                </label>
                <input
                  type="number"
                  min={0}
                  value={inquiries}
                  onChange={(e) => setInquiries(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-primary/40 bg-background px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Spend ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={spend}
                  onChange={(e) => setSpend(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Campaign or post label (optional)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />

            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Log Traffic &amp; Campaign
            </Button>
          </form>
        )}

        {tab === 'expenses' && (
          <form
            onSubmit={(e) => void handleSaveManualExpense(e)}
            className="mt-5 space-y-4 text-sm"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold">Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) =>
                    setExpenseCategory(e.target.value as OpsExpenseCategory)
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="fixed">Fixed Overhead</option>
                  <option value="variable">Variable / Delivery</option>
                  <option value="marketing">Marketing</option>
                  <option value="tools">Software &amp; Tools</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="1200"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <input
              type="text"
              required
              value={expenseItem}
              onChange={(e) => setExpenseItem(e.target.value)}
              placeholder="What was this expense for?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />

            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Log Expense
            </Button>
          </form>
        )}

        {successMsg && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Check className="h-4 w-4" />
            {successMsg}
          </p>
        )}
        {error && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
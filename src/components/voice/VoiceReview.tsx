"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, Trash2, Target, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DraftCard } from "./DraftCard";
import {
  templateDraft,
  VOICE_TEMPLATES,
  type BudgetCommand,
  type ParseContext,
  type VoiceDraft,
} from "@/lib/voice/parse";
import { createTransaction } from "@/lib/queries/transactions";
import { upsertBudgetByKey } from "@/lib/queries/budgets";
import { formatMoney } from "@/lib/format";
import type { Category, Person } from "@/lib/types";

/**
 * Editable confirmation screen. Shows every parsed transaction and budget
 * command, lets the user fix or delete each, quick-add more from category
 * templates, and applies them all — transactions to Supabase tagged
 * `source: "voice"`, budget commands via an upsert.
 */
export function VoiceReview({
  initialDrafts,
  initialBudgets,
  ctx,
  categories,
  people,
  createdByPersonId,
  onBack,
  onSaved,
}: {
  initialDrafts: VoiceDraft[];
  initialBudgets: BudgetCommand[];
  ctx: ParseContext;
  categories: Category[];
  people: Person[];
  createdByPersonId: string | null;
  onBack: () => void;
  onSaved: (count: number) => void;
}) {
  const [drafts, setDrafts] = useState<VoiceDraft[]>(initialDrafts);
  const [budgets, setBudgets] = useState<BudgetCommand[]>(initialBudgets);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function patch(id: string, p: Partial<VoiceDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? recompute({ ...d, ...p }) : d))
    );
  }
  function remove(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }
  function addTemplate(categoryName: string) {
    setDrafts((prev) => [...prev, templateDraft(categoryName, ctx)]);
  }

  function patchBudget(id: string, p: Partial<BudgetCommand>) {
    setBudgets((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, ...p, unresolved: p.categoryId === undefined ? b.unresolved : p.categoryId ? [] : ["category"] }
          : b
      )
    );
  }
  function removeBudget(id: string) {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }

  const totalItems = drafts.length + budgets.length;
  const invalidCount = useMemo(
    () =>
      drafts.filter((d) => !isValidDraft(d)).length +
      budgets.filter((b) => !isValidBudget(b)).length,
    [drafts, budgets]
  );

  async function handleSave() {
    if (totalItems === 0 || invalidCount > 0) return;
    setSaving(true);
    setError("");
    try {
      for (const d of drafts) {
        await createTransaction({
          occurred_on: d.date,
          amount: d.amount as number,
          category_id: d.categoryId as string,
          person_id: d.personId as string,
          payment_method: d.paymentMethod,
          type: d.type,
          note: d.note,
          source: "voice",
          raw_capture_text: d.rawText || null,
          created_by_person_id: createdByPersonId,
        });
      }
      for (const b of budgets) {
        await upsertBudgetByKey({
          category_id: b.categoryId as string,
          person_id: b.personId,
          monthly_amount: b.monthlyAmount,
        });
      }
      onSaved(totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 self-start text-[15px] font-medium text-ios-blue"
      >
        <ChevronLeft size={18} /> Back to mic
      </button>

      {totalItems === 0 && (
        <p className="py-8 text-center text-[15px] text-ios-label-secondary">
          Nothing to review. Add one from a template below.
        </p>
      )}

      {drafts.map((d, i) => (
        <DraftCard
          key={d.id}
          draft={d}
          index={i}
          categories={categories}
          people={people}
          onChange={(p) => patch(d.id, p)}
          onRemove={() => remove(d.id)}
        />
      ))}

      {budgets.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[12px] font-medium uppercase tracking-wide text-ios-label-secondary">
            Budget updates
          </div>
          {budgets.map((b) => (
            <BudgetCommandCard
              key={b.id}
              command={b}
              categories={categories}
              people={people}
              onChange={(p) => patchBudget(b.id, p)}
              onRemove={() => removeBudget(b.id)}
            />
          ))}
        </div>
      )}

      {/* Templates / quick-add */}
      <div>
        <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ios-label-secondary">
          Add from template
        </div>
        <div className="flex flex-wrap gap-2">
          {VOICE_TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => addTemplate(t.categoryName)}
              className="flex items-center gap-1 rounded-full bg-ios-fill px-3 py-1.5 text-[13px] font-medium text-ios-blue active:opacity-70"
            >
              <Plus size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[13px] text-ios-red">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || totalItems === 0 || invalidCount > 0}
        className="w-full rounded-xl bg-ios-blue px-4 py-3 text-[16px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
      >
        {saving
          ? "Saving…"
          : invalidCount > 0
            ? `Complete ${invalidCount} item${invalidCount === 1 ? "" : "s"}`
            : `Save ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}

function BudgetCommandCard({
  command,
  categories,
  people,
  onChange,
  onRemove,
}: {
  command: BudgetCommand;
  categories: Category[];
  people: Person[];
  onChange: (patch: Partial<BudgetCommand>) => void;
  onRemove: () => void;
}) {
  const budgetable = categories.filter((c) => c.treat_as !== "income");
  const missingCategory = !command.categoryId;
  const [amountText, setAmountText] = useState(
    command.monthlyAmount ? String(round2(command.monthlyAmount)) : ""
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-blue/15 text-ios-blue">
            <Target size={15} />
          </div>
          <div className="text-[14px] font-semibold text-ios-label">
            Set budget
            {command.rawText && (
              <span className="block text-[12px] font-normal text-ios-label-secondary">
                &ldquo;{command.rawText}&rdquo;
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove budget update"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ios-fill text-ios-red active:opacity-70"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Category
            {missingCategory && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-ios-red">
                <AlertCircle size={11} /> pick
              </span>
            )}
          </label>
          <select
            value={command.categoryId ?? ""}
            onChange={(e) => {
              const cat = categories.find((c) => c.id === e.target.value);
              onChange({ categoryId: e.target.value || null, categoryName: cat?.name ?? "" });
            }}
            className={
              "w-full rounded-lg border bg-ios-bg px-2 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue " +
              (missingCategory ? "border-ios-red" : "border-ios-separator")
            }
          >
            <option value="">Choose…</option>
            {budgetable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
            Monthly (AED)
          </label>
          <input
            inputMode="decimal"
            value={amountText}
            onChange={(e) => {
              setAmountText(e.target.value);
              const n = parseFloat(e.target.value);
              onChange({ monthlyAmount: Number.isNaN(n) ? 0 : n });
            }}
            className="w-full rounded-lg border border-ios-separator bg-ios-bg px-2 py-2 text-[14px] text-ios-label outline-none focus:border-ios-blue"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[12px] font-medium text-ios-label-secondary">
          Applies to
        </label>
        <div className="flex flex-wrap gap-1.5">
          <ScopeChip
            active={command.personId === null}
            label="Shared"
            onClick={() => onChange({ personId: null, personName: null })}
          />
          {people.map((p) => (
            <ScopeChip
              key={p.id}
              active={command.personId === p.id}
              label={p.name}
              onClick={() => onChange({ personId: p.id, personName: p.name })}
            />
          ))}
        </div>
      </div>

      {command.period === "annual" && (
        <p className="mt-2 text-[12px] text-ios-label-tertiary">
          Spoken as annual — stored as {formatMoney(round2(command.monthlyAmount))}/month.
        </p>
      )}
    </Card>
  );
}

function ScopeChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-3 py-1.5 text-[14px] font-medium " +
        (active ? "bg-ios-blue text-white" : "bg-ios-fill text-ios-label")
      }
    >
      {label}
    </button>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isValidDraft(d: VoiceDraft): boolean {
  return d.amount !== null && d.amount > 0 && !!d.categoryId && !!d.personId;
}

function isValidBudget(b: BudgetCommand): boolean {
  return !!b.categoryId && b.monthlyAmount > 0;
}

/** Recompute the unresolved-field markers after an edit. */
function recompute(d: VoiceDraft): VoiceDraft {
  const unresolved: VoiceDraft["unresolved"] = [];
  if (d.amount === null || d.amount <= 0) unresolved.push("amount");
  if (!d.categoryId) unresolved.push("category");
  if (!d.personId) unresolved.push("person");
  return { ...d, unresolved };
}

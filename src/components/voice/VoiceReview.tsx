"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft } from "lucide-react";
import { DraftCard } from "./DraftCard";
import {
  templateDraft,
  VOICE_TEMPLATES,
  type ParseContext,
  type VoiceDraft,
} from "@/lib/voice/parse";
import { createTransaction } from "@/lib/queries/transactions";
import type { Category, Person } from "@/lib/types";

/**
 * Editable confirmation screen. Shows every parsed draft, lets the user fix
 * or delete each, quick-add more from category templates, and saves them all
 * to Supabase in one batch tagged `source: "voice"`.
 */
export function VoiceReview({
  initialDrafts,
  ctx,
  categories,
  people,
  createdByPersonId,
  onBack,
  onSaved,
}: {
  initialDrafts: VoiceDraft[];
  ctx: ParseContext;
  categories: Category[];
  people: Person[];
  createdByPersonId: string | null;
  onBack: () => void;
  onSaved: (count: number) => void;
}) {
  const [drafts, setDrafts] = useState<VoiceDraft[]>(initialDrafts);
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

  const invalidCount = useMemo(
    () => drafts.filter((d) => !isValid(d)).length,
    [drafts]
  );

  async function handleSave() {
    if (drafts.length === 0 || invalidCount > 0) return;
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
      onSaved(drafts.length);
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

      {drafts.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-ios-label-secondary">
          Nothing to review. Add one from a template below.
        </p>
      ) : (
        drafts.map((d, i) => (
          <DraftCard
            key={d.id}
            draft={d}
            index={i}
            categories={categories}
            people={people}
            onChange={(p) => patch(d.id, p)}
            onRemove={() => remove(d.id)}
          />
        ))
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
        disabled={saving || drafts.length === 0 || invalidCount > 0}
        className="w-full rounded-xl bg-ios-blue px-4 py-3 text-[16px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-40"
      >
        {saving
          ? "Saving…"
          : invalidCount > 0
            ? `Complete ${invalidCount} transaction${invalidCount === 1 ? "" : "s"}`
            : `Save ${drafts.length} transaction${drafts.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}

function isValid(d: VoiceDraft): boolean {
  return (
    d.amount !== null &&
    d.amount > 0 &&
    !!d.categoryId &&
    !!d.personId
  );
}

/** Recompute the unresolved-field markers after an edit. */
function recompute(d: VoiceDraft): VoiceDraft {
  const unresolved: VoiceDraft["unresolved"] = [];
  if (d.amount === null || d.amount <= 0) unresolved.push("amount");
  if (!d.categoryId) unresolved.push("category");
  if (!d.personId) unresolved.push("person");
  return { ...d, unresolved };
}

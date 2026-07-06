"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useCategories } from "@/lib/queries/categories";
import { useProfile } from "@/lib/profile-context";
import {
  parseVoiceSession,
  type BudgetCommand,
  type ParseContext,
  type VoiceDraft,
} from "@/lib/voice/parse";
import { VoiceCapture } from "./VoiceCapture";
import { VoiceReview } from "./VoiceReview";

type Phase = "capture" | "review" | "done";

/**
 * End-to-end voice workflow: speak → parse → review/edit → batch save.
 * Self-contained so it can be hosted full-screen (the /voice page) or from
 * any "Speak Transaction" entry point. Calls `onClose` when finished.
 */
export function VoiceFlow({ onClose }: { onClose: () => void }) {
  const { categories } = useCategories();
  const { people, activePerson, lastUsedMethod } = useProfile();

  const [phase, setPhase] = useState<Phase>("capture");
  const [drafts, setDrafts] = useState<VoiceDraft[]>([]);
  const [budgetCommands, setBudgetCommands] = useState<BudgetCommand[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const ctx: ParseContext = useMemo(
    () => ({
      categories,
      people,
      defaultPersonId: activePerson?.id ?? null,
      defaultMethod: lastUsedMethod,
    }),
    [categories, people, activePerson, lastUsedMethod]
  );

  function handleCaptured(text: string) {
    const { transactions, budgetCommands: budgets } = parseVoiceSession(text, ctx);
    setDrafts(transactions);
    setBudgetCommands(budgets);
    setPhase("review");
  }

  function handleSaved(count: number) {
    setSavedCount(count);
    setPhase("done");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {phase === "capture" && <VoiceCapture ctx={ctx} onSubmit={handleCaptured} />}

      {phase === "review" && (
        <VoiceReview
          initialDrafts={drafts}
          initialBudgets={budgetCommands}
          ctx={ctx}
          categories={categories}
          people={people}
          createdByPersonId={activePerson?.id ?? null}
          onBack={() => setPhase("capture")}
          onSaved={handleSaved}
        />
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ios-green/15 text-ios-green">
            <Check size={36} />
          </div>
          <p className="text-[17px] font-semibold text-ios-label">
            Saved {savedCount} item{savedCount === 1 ? "" : "s"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDrafts([]);
                setBudgetCommands([]);
                setSavedCount(0);
                setPhase("capture");
              }}
              className="rounded-xl bg-ios-fill px-4 py-2.5 text-[15px] font-semibold text-ios-blue active:opacity-70"
            >
              Add more
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-ios-blue px-4 py-2.5 text-[15px] font-semibold text-white active:opacity-70"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

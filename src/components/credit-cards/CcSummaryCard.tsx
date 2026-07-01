"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { CcMonthPoint } from "@/lib/aggregate";
import type { Person } from "@/lib/types";

export function CcSummaryCard({
  person,
  point,
  onMarkPaid,
}: {
  person: Person;
  point: CcMonthPoint | null;
  onMarkPaid: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: person.color }}
          >
            <CreditCard size={14} />
          </div>
          <h2 className="text-[15px] font-semibold text-ios-label">
            {person.name}&apos;s Card
          </h2>
        </div>
        <Link
          href={`/credit-cards?person=${person.id}`}
          className="text-[13px] font-medium text-ios-blue"
        >
          Details
        </Link>
      </div>

      {!point ? (
        <p className="text-[13px] text-ios-label-secondary">No data yet</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Carried Over" value={point.carryOver} />
            <Stat label="This Month's Spend" value={point.currentSpend} />
            <Stat label="Paid Off" value={point.paidOff} tone="green" />
            <Stat label="Balance" value={point.closing} emphasize />
          </div>
          <button
            onClick={onMarkPaid}
            className="mt-3 w-full rounded-lg bg-ios-fill px-3 py-2 text-[13px] font-medium text-ios-blue active:opacity-70"
          >
            Record payment
          </button>
        </>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone?: "green";
  emphasize?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-ios-label-secondary">{label}</div>
      <div
        className={
          "text-[15px] font-semibold " +
          (tone === "green"
            ? "text-ios-green"
            : emphasize
              ? "text-ios-blue"
              : "text-ios-label")
        }
      >
        {formatMoney(value)}
      </div>
    </div>
  );
}

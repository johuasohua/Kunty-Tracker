"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import type { Person } from "@/lib/types";
import type { TransactionFilters } from "@/lib/queries/transactions";

// --- month helpers -------------------------------------------------------

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelShort(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function monthStart(monthStr: string): string {
  return `${monthStr}-01`;
}

function monthEnd(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, "0")}`;
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** A window of selectable months, newest first, ending at the current month. */
function monthOptions(count = 24): string[] {
  const cur = currentMonthStr();
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(shiftMonth(cur, -i));
  return out;
}

// --- generic month dropdown ---------------------------------------------

function MonthDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-ios-separator bg-ios-bg-secondary px-3 py-1.5 text-[13px] text-ios-label"
      >
        <span className="text-ios-label-secondary">{label}</span>
        {value ? monthLabelShort(value) : "—"}
        <ChevronDown size={13} className={clsx(open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-40 overflow-y-auto rounded-lg border border-ios-separator bg-ios-bg-secondary shadow-lg">
          {options.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className={clsx(
                "block w-full px-3 py-2 text-left text-[14px]",
                value === m
                  ? "bg-ios-blue font-medium text-white"
                  : "text-ios-label hover:bg-ios-fill"
              )}
            >
              {monthLabelShort(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonDropdown({
  selected,
  people,
  onChange,
}: {
  selected: string | undefined;
  people: Person[];
  onChange: (personId: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedPerson = people.find((p) => p.id === selected);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-ios-separator bg-ios-bg-secondary px-3 py-1.5 text-[13px] text-ios-label"
      >
        {selectedPerson ? selectedPerson.name : "All people"}
        <ChevronDown size={13} className={clsx(open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-ios-separator bg-ios-bg-secondary shadow-lg">
          <button
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className={clsx(
              "block w-full px-3 py-2 text-left text-[14px]",
              !selected
                ? "bg-ios-blue font-medium text-white"
                : "text-ios-label hover:bg-ios-fill"
            )}
          >
            All people
          </button>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className={clsx(
                "block w-full px-3 py-2 text-left text-[14px]",
                selected === p.id
                  ? "bg-ios-blue font-medium text-white"
                  : "text-ios-label hover:bg-ios-fill"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- presets -------------------------------------------------------------

type PresetId = "this" | "3m" | "6m" | "all";

function presetRange(id: PresetId): { from?: string; to?: string } {
  const cur = currentMonthStr();
  switch (id) {
    case "this":
      return { from: monthStart(cur), to: monthEnd(cur) };
    case "3m":
      return { from: monthStart(shiftMonth(cur, -2)), to: monthEnd(cur) };
    case "6m":
      return { from: monthStart(shiftMonth(cur, -5)), to: monthEnd(cur) };
    case "all":
      return { from: undefined, to: undefined };
  }
}

const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: "this", label: "This month" },
  { id: "3m", label: "Last 3M" },
  { id: "6m", label: "Last 6M" },
  { id: "all", label: "All time" },
];

function activePreset(filters: TransactionFilters): PresetId | null {
  if (!filters.from && !filters.to) return "all";
  for (const p of PRESETS) {
    if (p.id === "all") continue;
    const r = presetRange(p.id);
    if (r.from === filters.from && r.to === filters.to) return p.id;
  }
  return null; // custom range
}

export function QuickFilters({
  filters,
  onChange,
  people,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  people: Person[];
}) {
  const current = activePreset(filters);
  const options = monthOptions();

  const fromMonth = filters.from?.substring(0, 7);
  const toMonth = filters.to?.substring(0, 7);

  const applyPreset = (id: PresetId) => {
    const r = presetRange(id);
    onChange({ ...filters, from: r.from, to: r.to });
  };

  const handleFrom = (month: string) => {
    // Keep the range valid: never let From land after To.
    const to =
      toMonth && month > toMonth ? monthEnd(month) : filters.to ?? monthEnd(month);
    onChange({ ...filters, from: monthStart(month), to });
  };

  const handleTo = (month: string) => {
    const from =
      fromMonth && month < fromMonth ? monthStart(month) : filters.from ?? monthStart(month);
    onChange({ ...filters, from, to: monthEnd(month) });
  };

  return (
    <div className="mb-3 space-y-2">
      {/* Presets + person */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={clsx(
              "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
              current === p.id
                ? "bg-ios-blue text-white"
                : "bg-ios-fill text-ios-label active:bg-ios-fill-secondary"
            )}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto">
          <PersonDropdown
            selected={filters.personId}
            people={people}
            onChange={(personId) => onChange({ ...filters, personId })}
          />
        </div>
      </div>

      {/* Explicit range */}
      <div className="flex flex-wrap items-center gap-2">
        <MonthDropdown
          label="From"
          value={fromMonth}
          options={options}
          onChange={handleFrom}
        />
        <span className="text-ios-label-tertiary">–</span>
        <MonthDropdown
          label="To"
          value={toMonth}
          options={options}
          onChange={handleTo}
        />
        {current === null && (
          <span className="text-[12px] font-medium text-ios-blue">Custom</span>
        )}
      </div>
    </div>
  );
}

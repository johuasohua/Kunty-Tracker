"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import type { Person } from "@/lib/types";
import type { TransactionFilters } from "@/lib/queries/transactions";

function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthDateRange(monthStr: string): [string, string] {
  const [year, month] = monthStr.split("-").map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  return [from, to];
}

function getMonthsAround(centerMonth: string, count: number = 13): string[] {
  const [year, month] = centerMonth.split("-").map(Number);
  const months: string[] = [];
  const halfCount = Math.floor(count / 2);

  for (let i = -halfCount; i <= halfCount; i++) {
    let m = month + i;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    months.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  return months;
}

function MonthDropdown({
  currentMonth,
  onChange,
}: {
  currentMonth: string;
  onChange: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const months = getMonthsAround(currentMonth);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-ios-separator bg-ios-bg-secondary px-3 py-1.5 text-[14px] text-ios-label"
      >
        {getMonthLabel(currentMonth + "-01")}
        <ChevronDown size={14} className={clsx(open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-40 overflow-y-auto rounded-lg border border-ios-separator bg-ios-bg-secondary shadow-lg">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className={clsx(
                "block w-full px-3 py-2 text-left text-[14px]",
                currentMonth === m
                  ? "bg-ios-blue text-white font-medium"
                  : "text-ios-label hover:bg-ios-fill"
              )}
            >
              {getMonthLabel(m + "-01")}
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-ios-separator bg-ios-bg-secondary px-3 py-1.5 text-[14px] text-ios-label"
      >
        {selectedPerson ? selectedPerson.name : "All people"}
        <ChevronDown size={14} className={clsx(open && "rotate-180")} />
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
                ? "bg-ios-blue text-white font-medium"
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
                  ? "bg-ios-blue text-white font-medium"
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

export function QuickFilters({
  filters,
  onChange,
  people,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  people: Person[];
}) {
  const currentMonth = getMonthFromDate(new Date());
  const monthStr =
    filters.from && filters.from.startsWith(currentMonth.substring(0, 7))
      ? currentMonth.substring(0, 7)
      : filters.from?.substring(0, 7) ?? currentMonth;

  const handleMonthSelect = (month: string) => {
    const [from, to] = getMonthDateRange(month);
    onChange({ ...filters, from, to });
  };

  const handlePersonSelect = (personId: string | undefined) => {
    onChange({
      ...filters,
      personId,
    });
  };

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <MonthDropdown currentMonth={monthStr} onChange={handleMonthSelect} />
      <PersonDropdown
        selected={filters.personId}
        people={people}
        onChange={handlePersonSelect}
      />
    </div>
  );
}

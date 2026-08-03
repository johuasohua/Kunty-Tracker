"use client";

import { clsx } from "clsx";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  disabled = false,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={clsx(
        "inline-flex rounded-lg bg-ios-fill p-[2px]",
        disabled && "opacity-50",
        className
      )}
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={opt.value === value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            opt.value === value
              ? "bg-ios-bg-secondary text-ios-label shadow-sm"
              : "text-ios-label-secondary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

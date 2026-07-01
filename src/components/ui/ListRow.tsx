import { clsx } from "clsx";

export function ListRow({
  label,
  value,
  subtitle,
  icon,
  chevron = false,
  onClick,
  last = false,
  valueClassName,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  last?: boolean;
  valueClassName?: string;
}) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        !last && "border-b border-ios-separator",
        onClick && "active:bg-ios-fill"
      )}
    >
      {icon && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] text-ios-label">{label}</div>
        {subtitle && (
          <div className="truncate text-[13px] text-ios-label-secondary">
            {subtitle}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div
          className={clsx(
            "shrink-0 text-[15px] text-ios-label-secondary",
            valueClassName
          )}
        >
          {value}
        </div>
      )}
      {chevron && (
        <svg
          width="8"
          height="14"
          viewBox="0 0 8 14"
          fill="none"
          className="shrink-0 text-ios-label-tertiary"
        >
          <path
            d="M1 1L7 7L1 13"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Comp>
  );
}

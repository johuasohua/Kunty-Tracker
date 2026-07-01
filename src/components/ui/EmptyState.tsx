export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-ios-bg-secondary px-6 py-14 text-center">
      <div className="text-[17px] font-semibold text-ios-label">{title}</div>
      {subtitle && (
        <div className="max-w-xs text-[14px] text-ios-label-secondary">
          {subtitle}
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

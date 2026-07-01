import { clsx } from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-ios-bg-secondary shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GroupedSection({
  title,
  footer,
  children,
  className,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-6", className)}>
      {title && (
        <div className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary">
          {title}
        </div>
      )}
      <Card>{children}</Card>
      {footer && (
        <div className="mt-2 px-4 text-[13px] text-ios-label-secondary">
          {footer}
        </div>
      )}
    </div>
  );
}

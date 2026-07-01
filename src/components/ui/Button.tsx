import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "plain" | "destructive";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-opacity active:opacity-70 disabled:opacity-40",
        variant === "primary" && "bg-ios-blue text-white",
        variant === "secondary" && "bg-ios-fill text-ios-blue",
        variant === "plain" && "text-ios-blue",
        variant === "destructive" && "bg-ios-red text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

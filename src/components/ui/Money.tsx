import { formatMoney } from "@/lib/format";

/**
 * Renders formatMoney's "AED 1,234.56" with the currency code sized
 * relative to the digits (em-based), so it never visually outweighs the
 * number regardless of the surrounding font size — semibold uppercase
 * letters otherwise read larger than digits at the same declared size.
 *
 * `stacked` puts the currency code on its own line above the number
 * instead of inline before it.
 */
export function Money({
  value,
  className = "",
  stacked = false,
}: {
  value: number;
  className?: string;
  stacked?: boolean;
}) {
  const formatted = formatMoney(value);
  const spaceIndex = formatted.indexOf(" ");
  const currency = formatted.slice(0, spaceIndex);
  const amount = formatted.slice(spaceIndex + 1);

  if (stacked) {
    return (
      <span className={`flex flex-col ${className}`}>
        <span className="text-[0.6em] font-medium leading-tight">{currency}</span>
        {amount}
      </span>
    );
  }

  return (
    <span className={className}>
      <span className="mr-[0.2em] text-[0.7em] font-medium">{currency}</span>
      {amount}
    </span>
  );
}

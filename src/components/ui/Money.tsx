import { formatMoney } from "@/lib/format";

/**
 * Renders formatMoney's "AED 1,234.56" with the currency code sized
 * relative to the digits (em-based), so it never visually outweighs the
 * number regardless of the surrounding font size — semibold uppercase
 * letters otherwise read larger than digits at the same declared size.
 */
export function Money({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const formatted = formatMoney(value);
  const spaceIndex = formatted.indexOf(" ");
  const currency = formatted.slice(0, spaceIndex);
  const amount = formatted.slice(spaceIndex + 1);

  return (
    <span className={className}>
      <span className="mr-[0.2em] text-[0.7em] font-medium">{currency}</span>
      {amount}
    </span>
  );
}

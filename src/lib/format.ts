const currencyFormatter = new Intl.NumberFormat("en-AE", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return `AED ${currencyFormatter.format(amount)}`;
}

export function formatMoneyCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return `AED ${(amount / 1000).toFixed(1)}k`;
  }
  return formatMoney(amount);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function monthLabelShort(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short" });
}

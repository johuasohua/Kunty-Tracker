/**
 * Foreign-currency entry support for travel spend. `amount` on a transaction
 * always stays AED-denominated (so every aggregate in aggregate.ts is
 * untouched) — this just fetches the AED conversion rate for a foreign
 * currency at entry time so the original amount can be recorded alongside it.
 */

export interface CurrencyOption {
  code: string;
  label: string;
}

/** Curated shortlist — common currencies for a UAE-based household's travel. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "THB", label: "THB — Thai Baht" },
  { code: "TRY", label: "TRY — Turkish Lira" },
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
];

/**
 * Live AED rate for 1 unit of `fromCurrency`, via a free/keyless exchange
 * rate API. Throws on failure — callers should surface that so the user can
 * retry rather than silently save a wrong amount.
 */
export async function fetchAedRate(fromCurrency: string): Promise<number> {
  if (fromCurrency === "AED") return 1;

  const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
  if (!res.ok) throw new Error("Exchange rate service unavailable");

  const data = await res.json();
  const rate = data?.rates?.AED;
  if (typeof rate !== "number") {
    throw new Error(`No AED rate found for ${fromCurrency}`);
  }
  return rate;
}

import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import type { CategoryBreakdown } from "@/lib/aggregate";
import type { Person } from "@/lib/types";

export function AccountBreakdownTable({
  breakdown,
  people,
}: {
  breakdown: CategoryBreakdown[];
  people: Person[];
}) {
  const withSpend = breakdown.filter((b) => b.total !== 0);
  if (withSpend.length === 0) return null;

  const columns = people.flatMap((p) => [
    { key: `${p.id}:credit`, label: `${p.name} Credit` },
    { key: `${p.id}:debit`, label: `${p.name} Debit` },
  ]);

  return (
    <div className="mb-6">
      <div className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-ios-label-secondary md:px-0">
        Category × Account
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-ios-separator text-left text-ios-label-secondary">
              <th className="px-3 py-2">Category</th>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-2 text-right">
                  {c.label}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {withSpend.map((b) => (
              <tr key={b.category.id} className="border-b border-ios-separator last:border-0">
                <td className="px-3 py-2 text-ios-label">{b.category.name}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-right text-ios-label-secondary">
                    {b.byAccount[c.key] ? formatMoney(b.byAccount[c.key]) : "—"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-medium text-ios-label">
                  {formatMoney(b.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

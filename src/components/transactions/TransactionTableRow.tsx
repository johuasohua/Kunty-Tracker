"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatMoney } from "@/lib/format";
import { updateTransaction, deleteTransaction } from "@/lib/queries/transactions";
import type { Category, PaymentMethod, Person, Transaction } from "@/lib/types";

export function TransactionTableRow({
  transaction,
  categories,
  people,
  onChanged,
}: {
  transaction: Transaction;
  categories: Category[];
  people: Person[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(transaction.occurred_on);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [personId, setPersonId] = useState(transaction.person_id);
  const [method, setMethod] = useState<PaymentMethod>(transaction.payment_method);
  const [note, setNote] = useState(transaction.note ?? "");

  const category = categories.find((c) => c.id === transaction.category_id);
  const person = people.find((p) => p.id === transaction.person_id);
  const sign =
    category?.treat_as === "offset" || transaction.type === "income" ? 1 : -1;

  function cancel() {
    setDate(transaction.occurred_on);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.category_id);
    setPersonId(transaction.person_id);
    setMethod(transaction.payment_method);
    setNote(transaction.note ?? "");
    setEditing(false);
  }

  async function save() {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      await updateTransaction(transaction.id, {
        occurred_on: date,
        amount: parsedAmount,
        category_id: categoryId,
        person_id: personId,
        payment_method: method,
        type: cat?.treat_as === "income" ? "income" : "expense",
        note: note || null,
      });
      setEditing(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this transaction?")) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <tr className="border-b border-ios-separator bg-ios-blue/5">
        <td className="px-3 py-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-[13px]"
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-[13px]"
          >
            {categories
              .filter(
                (c) =>
                  c.name.toLowerCase() !== "mortgage" &&
                  c.name.toLowerCase() !== "offset"
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-[13px]"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-[13px]"
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-[13px]"
          />
        </td>
        <td className="px-3 py-2 text-right">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 rounded-md border border-ios-separator bg-ios-bg-secondary px-2 py-1 text-right text-[13px]"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex justify-end gap-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-green text-white"
            >
              <Check size={14} />
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-label"
            >
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group border-b border-ios-separator hover:bg-ios-fill-secondary">
      <td className="whitespace-nowrap px-3 py-2 text-[13px] text-ios-label-secondary">
        {new Date(transaction.occurred_on).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <CategoryIcon icon={category?.icon ?? null} color={category?.color ?? "#8E8E93"} size={12} />
          <span className="text-[13px] text-ios-label">{category?.name ?? "—"}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-[13px] text-ios-label-secondary">
        {person?.name ?? "—"}{" "}
        <span className="capitalize">({transaction.payment_method})</span>
      </td>
      <td className="max-w-[220px] truncate px-3 py-2 text-[13px] text-ios-label-secondary">
        {transaction.note ?? "—"}
      </td>
      <td
        className={
          "whitespace-nowrap px-3 py-2 text-right text-[13px] font-medium " +
          (sign < 0 ? "text-ios-label" : "text-ios-green")
        }
      >
        {sign < 0 ? "-" : "+"}
        {formatMoney(transaction.amount)}
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-label-secondary"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={remove}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ios-fill text-ios-red"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

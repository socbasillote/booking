import { useEffect, useRef, useState } from "react";
import {
  CircleDollarSign,
  FileText,
  RotateCcw,
  Search,
  MoreVertical,
} from "lucide-react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

type PaymentMethod =
  | "Cash"
  | "Card"
  | "GCash"
  | "Bank transfer"
  | "PayPal"
  | "PayMongo";
type Transaction = {
  type: "Charge" | "Refund";
  amount: number;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  pending?: boolean;
};
type PaymentBooking = {
  id: string;
  _id?: string;
  confirmationCode?: string;
  customer: string;
  email: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  amountPaid?: number;
  amountRefunded?: number;
  payment: "Unpaid" | "Deposit" | "Paid";
  paymentMethod: PaymentMethod;
  transactions?: Transaction[];
  createdAt?: string;
};
type LedgerStatus = "Unpaid" | "Partial" | "Paid" | "Refunded";

function collectedAmount(booking: PaymentBooking) {
  return (
    booking.amountPaid || (booking.payment === "Paid" ? booking.amount : 0)
  );
}

function ledgerStatus(booking: PaymentBooking): LedgerStatus {
  const collected = collectedAmount(booking);
  if (collected <= 0 && (booking.amountRefunded ?? 0) > 0) return "Refunded";
  if (collected >= booking.amount) return "Paid";
  if (collected > 0 || booking.payment === "Deposit") return "Partial";
  return "Unpaid";
}

function money(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value || 0);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function printInvoice(booking: PaymentBooking) {
  const collected = collectedAmount(booking);
  const invoiceWindow = window.open("", "_blank", "width=760,height=900");
  if (!invoiceWindow) return;
  invoiceWindow.document.write(`<!doctype html>
    <html><head><title>Invoice ${escapeHtml(booking.confirmationCode ?? booking.id)}</title>
    <style>
      body{font:16px/1.5 Arial,sans-serif;color:#17211c;margin:48px;max-width:720px}
      header{display:flex;justify-content:space-between;border-bottom:2px solid #176b4a;padding-bottom:20px}
      h1{font-size:28px;margin:0}small,.muted{color:#64716a}
      table{width:100%;border-collapse:collapse;margin:32px 0}
      th,td{text-align:left;padding:12px;border-bottom:1px solid #dfe6e1}
      .total{font-size:20px;font-weight:bold;text-align:right}
      @media print{body{margin:24px}}
    </style></head><body>
    <header><div><h1>Invoice</h1><div class="muted">Sidebooking</div></div>
    <div><strong>${escapeHtml(booking.confirmationCode ?? booking.id)}</strong><br/><small>${escapeHtml(booking.date)} at ${escapeHtml(booking.time)}</small></div></header>
    <p><strong>Bill to</strong><br/>${escapeHtml(booking.customer)}<br/>${escapeHtml(booking.email)}</p>
    <table><thead><tr><th>Description</th><th>Booking</th><th>Amount</th></tr></thead>
    <tbody><tr><td>${escapeHtml(booking.service)}</td><td>${escapeHtml(booking.date)} · ${escapeHtml(booking.time)}</td><td>${money(booking.amount)}</td></tr></tbody></table>
    <p class="total">Total: ${money(booking.amount)}</p><p>Collected: ${money(collected)}</p>
    <p>Balance due: ${money(Math.max(booking.amount - collected, 0))}</p>
    <p class="muted">Payment method: ${escapeHtml(booking.paymentMethod)}</p>
    <script>window.print()</script></body></html>`);
  invoiceWindow.document.close();
}

export function PaymentsPage() {
  const [bookings, setBookings] = useState<PaymentBooking[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | LedgerStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactionBooking, setTransactionBooking] =
    useState<PaymentBooking | null>(null);
  const [transactionType, setTransactionType] = useState<"Charge" | "Refund">(
    "Charge",
  );
  const [busy, setBusy] = useState(false);

  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const loadSequenceRef = useRef(0);
  const mutationSequenceRef = useRef(new Map<string, number>());
  const pendingTransactionsRef = useRef(new Set<string>());

  async function loadPayments() {
    const loadSequence = ++loadSequenceRef.current;
    const mutationSnapshot = new Map(mutationSequenceRef.current);
    setError("");

    function applyPayments(rows: Array<PaymentBooking & { _id?: string }>) {
      if (loadSequence !== loadSequenceRef.current) return;
      const incoming = rows.map((booking) => ({
        ...booking,
        id: booking.id ?? String(booking._id ?? ""),
        transactions: booking.transactions ?? [],
      }));

      setBookings((current) => {
        const currentById = new Map(
          current.map((booking) => [booking.id, booking]),
        );
        const merged = incoming.map((booking) => {
          const mutationChanged =
            (mutationSequenceRef.current.get(booking.id) ?? 0) >
              (mutationSnapshot.get(booking.id) ?? 0) ||
            pendingTransactionsRef.current.has(booking.id);
          return mutationChanged
            ? (currentById.get(booking.id) ?? booking)
            : booking;
        });

        for (const booking of current) {
          const mutationChanged =
            (mutationSequenceRef.current.get(booking.id) ?? 0) >
              (mutationSnapshot.get(booking.id) ?? 0) ||
            pendingTransactionsRef.current.has(booking.id);
          if (
            mutationChanged &&
            !incoming.some((row) => row.id === booking.id)
          ) {
            merged.push(booking);
          }
        }
        return merged;
      });
    }

    try {
      await apiRequestWithCache<{
        payments: Array<PaymentBooking & { _id?: string }>;
      }>("/bookings/payments", (cached) => {
        applyPayments(cached.payments ?? []);
        if (loadSequence === loadSequenceRef.current) setLoading(false);
      }).then((data) => applyPayments(data.payments ?? []));
    } catch (err) {
      if (loadSequence === loadSequenceRef.current) {
        setError(
          err instanceof Error ? err.message : "Unable to load payments",
        );
      }
    } finally {
      if (loadSequence === loadSequenceRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPayments(), 0);
    return () => {
      window.clearTimeout(timer);
      loadSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transactionBooking) return;
    const form = new FormData(event.currentTarget);
    const bookingId = transactionBooking.id;
    if (pendingTransactionsRef.current.has(bookingId)) return;

    const booking = bookings.find((row) => row.id === bookingId);
    if (!booking) return;

    const amount = Number(form.get("amount"));
    const method = String(form.get("method")) as PaymentMethod;
    const previousCollected = collectedAmount(booking);
    const allowedAmount =
      transactionType === "Charge"
        ? booking.amount - previousCollected
        : previousCollected;
    if (!Number.isFinite(amount) || amount <= 0 || amount > allowedAmount) {
      setError(
        transactionType === "Charge"
          ? "The charge must be greater than zero and no more than the outstanding balance."
          : "The refund must be greater than zero and no more than the amount collected.",
      );
      return;
    }

    const mutationSequence =
      (mutationSequenceRef.current.get(bookingId) ?? 0) + 1;
    mutationSequenceRef.current.set(bookingId, mutationSequence);
    pendingTransactionsRef.current.add(bookingId);
    const nextCollected =
      transactionType === "Charge"
        ? previousCollected + amount
        : previousCollected - amount;
    const nextRefunded =
      (booking.amountRefunded ?? 0) +
      (transactionType === "Refund" ? amount : 0);
    const optimisticTransaction: Transaction = {
      type: transactionType,
      amount,
      method,
      reference: `pending-${mutationSequence}`,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    const optimisticBooking: PaymentBooking = {
      ...booking,
      amountPaid: nextCollected,
      amountRefunded: nextRefunded,
      payment:
        nextCollected <= 0
          ? "Unpaid"
          : nextCollected >= booking.amount
            ? "Paid"
            : "Deposit",
      paymentMethod: method,
      transactions: [optimisticTransaction, ...(booking.transactions ?? [])],
    };

    setBusy(true);
    setError("");
    setBookings((current) =>
      current.map((row) => (row.id === bookingId ? optimisticBooking : row)),
    );
    try {
      const data = await apiRequest<{ booking: PaymentBooking }>(
        `/bookings/${bookingId}/transactions`,
        {
          method: "POST",
          body: JSON.stringify({
            type: transactionType,
            amount,
            method,
          }),
        },
      );
      if (mutationSequenceRef.current.get(bookingId) === mutationSequence) {
        setBookings((current) =>
          current.map((row) =>
            row.id === bookingId
              ? {
                  ...data.booking,
                  id: data.booking.id ?? String(data.booking._id ?? row.id),
                  transactions: data.booking.transactions ?? [],
                }
              : row,
          ),
        );
      }
      setTransactionBooking(null);
    } catch (err) {
      if (mutationSequenceRef.current.get(bookingId) === mutationSequence) {
        setBookings((current) =>
          current.map((row) => (row.id === bookingId ? booking : row)),
        );
      }
      setError(err instanceof Error ? err.message : "Unable to record payment");
    } finally {
      pendingTransactionsRef.current.delete(bookingId);
      setBusy(false);
    }
  }

  const filtered = bookings.filter((booking) => {
    const matchesQuery =
      `${booking.customer} ${booking.service} ${booking.confirmationCode ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery && (!statusFilter || ledgerStatus(booking) === statusFilter)
    );
  });

  const totalCollected = bookings.reduce(
    (total, booking) => total + collectedAmount(booking),
    0,
  );

  const totalRefunded = bookings.reduce(
    (total, booking) => total + (booking.amountRefunded ?? 0),
    0,
  );

  const outstanding = bookings.reduce(
    (total, booking) =>
      total + Math.max(booking.amount - collectedAmount(booking), 0),
    0,
  );

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Payments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Invoices, collections, refunds, and transaction status
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Collected",
            value: money(totalCollected),
            icon: CircleDollarSign,
          },
          { label: "Refunded", value: money(totalRefunded), icon: RotateCcw },
          { label: "Outstanding", value: money(outstanding), icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-0.5 text-xl font-semibold text-slate-900">
                {value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="page-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, service, or invoice"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm"
            />
          </label>

          <select
            aria-label="Filter by payment status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | LedgerStatus)
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All payment statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        {loading ? (
          <SkeletonLoader label="Loading payments">
            <div className="space-y-4 p-4" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-8 rounded bg-slate-100" />
              ))}
            </div>
          </SkeletonLoader>
        ) : (
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "Invoice / Customer",
                    "Booking",
                    "Total",
                    "Collected",
                    "Balance",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-left font-medium"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No payment records match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => {
                    const collected = collectedAmount(booking);
                    const balance = Math.max(booking.amount - collected, 0);
                    const status = ledgerStatus(booking);
                    const transactions = booking.transactions ?? [];

                    return (
                      <tr
                        key={booking.id}
                        className="border-t border-slate-200 align-top"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {booking.confirmationCode ?? booking.id}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {booking.customer} · {booking.email}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          <div>{booking.service}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {booking.date} · {booking.time}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                          {money(booking.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-emerald-800">
                          {money(collected)}
                          {(booking.amountRefunded ?? 0) > 0 && (
                            <div className="text-xs text-rose-700">
                              {money(booking.amountRefunded ?? 0)} refunded
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {money(balance)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              status === "Paid"
                                ? "bg-emerald-50 text-emerald-800"
                                : status === "Refunded"
                                  ? "bg-rose-50 text-rose-700"
                                  : status === "Partial"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div
                            ref={
                              openActionId === booking.id
                                ? actionMenuRef
                                : undefined
                            }
                            className="relative flex justify-start"
                          >
                            <button
                              type="button"
                              aria-label={`Actions for ${
                                booking.confirmationCode ?? booking.customer
                              }`}
                              aria-expanded={openActionId === booking.id}
                              onClick={() =>
                                setOpenActionId((current) =>
                                  current === booking.id ? null : booking.id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openActionId === booking.id && (
                              <div className="absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    printInvoice(booking);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <FileText
                                    size={15}
                                    className="text-slate-500"
                                  />
                                  View invoice
                                </button>

                                {balance > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      setTransactionBooking(booking);
                                      setTransactionType("Charge");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <CircleDollarSign
                                      size={15}
                                      className="text-emerald-700"
                                    />
                                    Record payment
                                  </button>
                                )}

                                {collected > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      setTransactionBooking(booking);
                                      setTransactionType("Refund");
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <RotateCcw
                                      size={15}
                                      className="text-rose-600"
                                    />
                                    Issue refund
                                  </button>
                                )}

                                <div className="my-1 border-t border-slate-100" />

                                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                                  <div className="mb-2 text-xs font-medium text-slate-500">
                                    Transactions (
                                    {transactions.length ||
                                      (booking.payment === "Paid" ? 1 : 0)}
                                    )
                                  </div>

                                  {transactions.length ? (
                                    <div className="space-y-2">
                                      {transactions.map((transaction) => (
                                        <div
                                          key={transaction.reference}
                                          className="border-l-2 border-slate-300 pl-2 text-xs text-slate-500"
                                        >
                                          <div className="font-medium text-slate-700">
                                            {transaction.type} ·{" "}
                                            {money(transaction.amount)}
                                            {transaction.pending && (
                                              <span className="ml-2 text-amber-700">
                                                Saving
                                              </span>
                                            )}
                                          </div>
                                          <div>
                                            {transaction.method} ·{" "}
                                            {new Date(
                                              transaction.createdAt,
                                            ).toLocaleString()}
                                          </div>
                                          <div className="break-all">
                                            {transaction.reference}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : booking.payment === "Paid" ? (
                                    <div className="border-l-2 border-slate-300 pl-2 text-xs text-slate-500">
                                      Existing recorded payment ·{" "}
                                      {money(booking.amount)}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-500">
                                      No transactions recorded.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {transactionBooking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={submitTransaction}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {transactionType === "Charge" ? "Record payment" : "Issue refund"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {transactionBooking.customer} ·{" "}
              {transactionBooking.confirmationCode}
            </p>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Amount
              <input
                name="amount"
                type="number"
                min="0.01"
                max={
                  transactionType === "Charge"
                    ? Math.max(
                        transactionBooking.amount -
                          collectedAmount(transactionBooking),
                        0,
                      )
                    : collectedAmount(transactionBooking)
                }
                step="0.01"
                required
                defaultValue={
                  transactionType === "Charge"
                    ? Math.max(
                        transactionBooking.amount -
                          collectedAmount(transactionBooking),
                        0,
                      )
                    : collectedAmount(transactionBooking)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              {transactionType === "Charge"
                ? "Payment method"
                : "Refund method"}

              <select
                name="method"
                defaultValue={transactionBooking.paymentMethod ?? "Cash"}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                {[
                  "Cash",
                  "Card",
                  "GCash",
                  "Bank transfer",
                  "PayPal",
                  "PayMongo",
                ].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransactionBooking(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>

              <button
                disabled={busy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy
                  ? "Saving..."
                  : transactionType === "Charge"
                    ? "Record charge"
                    : "Confirm refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

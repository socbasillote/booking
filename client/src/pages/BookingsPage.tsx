import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

type Service = {
  id: string;
  name: string;
  price?: number;
  durationMinutes?: number;
};
type Booking = {
  id: string;
  confirmationCode?: string;
  customer: string;
  email: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Completed" | "Rejected";
  payment: "Unpaid" | "Deposit" | "Paid";
  paymentMethod:
    | "Cash"
    | "Card"
    | "GCash"
    | "Bank transfer"
    | "PayPal"
    | "PayMongo";
};

export function BookingsPage() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Booking["status"]>("");
  const [paymentFilter, setPaymentFilter] = useState<"" | Booking["payment"]>(
    "",
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadData() {
    try {
      const bookingData = await apiRequest<{
        bookings: Array<Booking & { _id?: string }>;
      }>("/bookings/");
      const serviceData = await apiRequest<{ services: Service[] }>(
        "/services/",
      );
      const mapped = (bookingData.bookings ?? []).map((row) => ({
        ...row,
        id: row.id ?? String(row._id ?? ""),
      }));
      setBookings(mapped);
      setServices(serviceData.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bookings");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest<{ booking: Booking }>("/bookings/", {
        method: "POST",
        body: JSON.stringify({
          customer: String(form.get("customer")),
          email: String(form.get("email")),
          service: String(form.get("service")),
          staff: String(form.get("staff")),
          date: String(form.get("date")),
          time: String(form.get("time")),
          status: String(form.get("status")) as Booking["status"],
          payment: String(form.get("payment")) as Booking["payment"],
          paymentMethod: String(
            form.get("paymentMethod"),
          ) as Booking["paymentMethod"],
        }),
      });
      setOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    } finally {
      setBusy(false);
    }
  }

  async function patchBooking(id: string, patch: Partial<Booking>) {
    try {
      await apiRequest<{ booking: Booking }>(`/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update booking");
    }
  }

  const filtered = bookings.filter((row) => {
    const matchesQuery = `${row.customer} ${row.service} ${row.staff}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesDate = !dateFilter || row.date === dateFilter;
    const matchesStatus = !statusFilter || row.status === statusFilter;
    const matchesPayment = !paymentFilter || row.payment === paymentFilter;
    return matchesQuery && matchesDate && matchesStatus && matchesPayment;
  });

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Bookings
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 md:w-auto"
        >
          + New Booking
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="page-card overflow-hidden">
        <div className="flex min-w-0 flex-wrap gap-3 border-b border-slate-200 p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, service or staff"
            className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by date"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | Booking["status"])
            }
            aria-label="Filter by status"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value as "" | Booking["payment"])
            }
            aria-label="Filter by payment"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All payments</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Deposit">Deposit</option>
            <option value="Paid">Paid</option>
          </select>
          {(dateFilter || statusFilter || paymentFilter || query) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDateFilter("");
                setStatusFilter("");
                setPaymentFilter("");
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "Customer",
                  "Service",
                  "Staff",
                  "Date & Time",
                  "Status",
                  "Payment",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.customer}
                    <div className="text-xs font-normal text-slate-500">
                      {row.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.service}</td>
                  <td className="px-4 py-3 text-slate-600">{row.staff}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.date} · {row.time}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          row.status === "Rejected"
                            ? "bg-red-500"
                            : row.status === "Confirmed"
                              ? "bg-emerald-500"
                              : row.status === "Completed"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                        }`}
                      />
                      <select
                        value={row.status}
                        onChange={(event) =>
                          patchBooking(row.id, {
                            status: event.target.value as Booking["status"],
                          })
                        }
                        className={`rounded-lg border px-2 py-1 text-xs ${
                          row.status === "Rejected"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Completed</option>
                        <option>Rejected</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.payment}
                      onChange={(event) =>
                        patchBooking(row.id, {
                          payment: event.target.value as Booking["payment"],
                        })
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option>Unpaid</option>
                      <option>Deposit</option>
                      <option>Paid</option>
                    </select>
                    <div className="mt-1 text-xs text-slate-500">
                      {row.paymentMethod}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">New booking</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                name="customer"
                required
                placeholder="Customer name"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Customer email"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <select
                name="service"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                {services.map((service) => (
                  <option key={service.id}>{service.name}</option>
                ))}
              </select>
              <input
                name="staff"
                required
                defaultValue="Maria"
                placeholder="Staff member"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="date"
                required
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="time"
                required
                type="time"
                step="1800"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <select
                name="status"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Rejected</option>
              </select>
              <select
                name="payment"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <option>Unpaid</option>
                <option>Deposit</option>
                <option>Paid</option>
              </select>
              <select
                name="paymentMethod"
                className="rounded-xl border border-slate-200 px-3 py-2.5 sm:col-span-2"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>GCash</option>
                <option>Bank transfer</option>
                <option>PayPal</option>
                <option>PayMongo</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-white"
              >
                {busy ? "Creating..." : "Create booking"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

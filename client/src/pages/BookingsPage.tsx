import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { SkeletonBlock, SkeletonLoader } from "../components/SkeletonLoader";

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
  court?: string;
  amount?: number;
};

export function BookingsPage() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Booking["status"]>(
    () => {
      const initialStatus = params.get("status");
      return ["Confirmed", "Pending", "Completed", "Rejected"].includes(
        initialStatus ?? "",
      )
        ? (initialStatus as Booking["status"])
        : "";
    },
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const updateSequence = useRef(new Map<string, number>());

  async function loadData() {
    try {
      const bookingData = await apiRequestWithCache<{
        bookings: Array<Booking & { _id?: string }>;
      }>("/bookings", (data) => {
        setBookings(
          (data.bookings ?? []).map((row) => ({
            ...row,
            id: row.id ?? String(row._id ?? ""),
          })),
        );
        setLoading(false);
      });
      const serviceData = await apiRequestWithCache<{ services: Service[] }>(
        "/services",
        (data) => {
          setServices(data.services ?? []);
          setLoading(false);
        },
      );
      const mapped = (bookingData.bookings ?? []).map((row) => ({
        ...row,
        id: row.id ?? String(row._id ?? ""),
      }));
      setBookings(mapped);
      setServices(serviceData.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const bookingPath = editingBooking
        ? `/bookings/${editingBooking.id}`
        : "/bookings";
      await apiRequest<{ booking: Booking }>(bookingPath, {
        method: editingBooking ? "PATCH" : "POST",
        body: JSON.stringify({
          customer: String(form.get("customer")),
          email: String(form.get("email")),
          service: String(form.get("service")),
          staff: String(form.get("staff")),
          date: String(form.get("date")),
          time: String(form.get("time")),
          court: String(form.get("court")),
          status: String(form.get("status")) as Booking["status"],
        }),
      });
      setOpen(false);
      setEditingBooking(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    } finally {
      setBusy(false);
    }
  }

  async function patchBooking(id: string, value: Booking["status"]) {
    const booking = bookings.find((row) => row.id === id);
    if (!booking) return;

    const previousValue = booking.status;
    const operationKey = `${id}:status`;
    const sequence = (updateSequence.current.get(operationKey) ?? 0) + 1;
    updateSequence.current.set(operationKey, sequence);
    setError("");
    setBookings((current) =>
      current.map((row) => (row.id === id ? { ...row, status: value } : row)),
    );

    try {
      const result = await apiRequest<{ booking: Booking }>(`/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      if (updateSequence.current.get(operationKey) === sequence) {
        setBookings((current) =>
          current.map((row) =>
            row.id === id ? { ...row, status: result.booking.status } : row,
          ),
        );
      }
    } catch (err) {
      if (updateSequence.current.get(operationKey) === sequence) {
        setBookings((current) =>
          current.map((row) =>
            row.id === id ? { ...row, status: previousValue } : row,
          ),
        );
      }
      setError(err instanceof Error ? err.message : "Unable to update booking");
    }
  }

  async function removeBooking(booking: Booking) {
    if (
      !window.confirm(`Cancel reservation ${booking.confirmationCode ?? ""}?`)
    ) {
      return;
    }
    try {
      await apiRequest<{ booking: Booking }>(`/bookings/${booking.id}`, {
        method: "DELETE",
      });
      setBookings((current) => current.filter((row) => row.id !== booking.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking");
    }
  }

  const filtered = bookings.filter((row) => {
    const matchesQuery = `${row.customer} ${row.service} ${row.staff}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesDate = !dateFilter || row.date === dateFilter;
    const matchesStatus = !statusFilter || row.status === statusFilter;
    return matchesQuery && matchesDate && matchesStatus;
  });

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Reservations, schedules, and booking status
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBooking(null);
            setOpen(true);
          }}
          className=" rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
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
          {(dateFilter || statusFilter || query) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDateFilter("");
                setStatusFilter("");
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <SkeletonLoader label="Loading bookings">
            <div className="space-y-3 p-4" aria-hidden="true">
              {Array.from({ length: 5 }, (_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3 sm:grid-cols-6"
                >
                  {Array.from({ length: 6 }, (_, cell) => (
                    <SkeletonBlock key={cell} className="h-5" />
                  ))}
                </div>
              ))}
            </div>
          </SkeletonLoader>
        ) : (
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
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No reservations match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.customer}
                        <div className="text-xs font-normal text-slate-500">
                          {row.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.service}
                      </td>
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
                              void patchBooking(
                                row.id,
                                event.target.value as Booking["status"],
                              )
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBooking(row);
                              setOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                            aria-label={`Edit reservation for ${row.customer}`}
                            title="Edit reservation"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeBooking(row)}
                            className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                            aria-label={`Cancel reservation for ${row.customer}`}
                            title="Cancel reservation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">
              {editingBooking ? "Edit reservation" : "New reservation"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                name="customer"
                required
                defaultValue={editingBooking?.customer}
                placeholder="Customer name"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="email"
                type="email"
                required
                defaultValue={editingBooking?.email}
                placeholder="Customer email"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <select
                name="service"
                defaultValue={editingBooking?.service ?? services[0]?.name}
                required
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                {services.map((service) => (
                  <option key={service.id}>{service.name}</option>
                ))}
              </select>
              <input
                name="staff"
                required
                defaultValue={editingBooking?.staff ?? "Admin"}
                placeholder="Staff member"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="date"
                required
                type="date"
                defaultValue={editingBooking?.date}
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="time"
                required
                type="time"
                step="1800"
                defaultValue={editingBooking?.time}
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="court"
                required
                defaultValue={editingBooking?.court ?? "Court 1"}
                placeholder="Court or room"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <select
                name="status"
                defaultValue={editingBooking?.status ?? "Pending"}
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditingBooking(null);
                }}
                className="rounded-xl border px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-white"
              >
                {busy
                  ? editingBooking
                    ? "Saving..."
                    : "Creating..."
                  : editingBooking
                    ? "Save changes"
                    : "Create reservation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

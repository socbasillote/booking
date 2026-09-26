import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  UserRoundCheck,
} from "lucide-react";
import { apiRequest } from "../lib/api";

type Booking = {
  id: string;
  customer: string;
  email: string;
  service: string;
  amount?: number;
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
type BookingResponse = Booking & { _id?: string };
type Service = { name: string; durationMinutes?: number };

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [data, serviceData] = await Promise.all([
          apiRequest<{ bookings: BookingResponse[] }>("/bookings"),
          apiRequest<{ services: Service[] }>("/services"),
        ]);
        setBookings(
          (data.bookings ?? []).map((row) => ({
            ...row,
            id: row.id ?? row._id ?? "",
          })),
        );
        setServices(serviceData.services ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard data",
        );
      }
    }
    void loadDashboard();
    const timer = window.setInterval(() => {
      setNow(new Date());
      void loadDashboard();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const todayKey = dateKey(now);
  const todayBookings = bookings
    .filter((row) => row.date === todayKey && row.status !== "Rejected")
    .sort((first, second) => first.time.localeCompare(second.time));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const durationFor = (booking: Booking) =>
    services.find((service) => service.name === booking.service)
      ?.durationMinutes ?? 60;
  const currentBooking = todayBookings.find((booking) => {
    const [hour, minute] = booking.time.split(":").map(Number);
    const start = hour * 60 + minute;
    return start <= nowMinutes && nowMinutes < start + durationFor(booking);
  });
  const nextBooking = todayBookings.find((booking) => {
    const [hour, minute] = booking.time.split(":").map(Number);
    return hour * 60 + minute > nowMinutes;
  });
  const pendingCount = todayBookings.filter(
    (booking) => booking.status === "Pending",
  ).length;
  const currentService = currentBooking
    ? services.find((service) => service.name === currentBooking.service)
    : undefined;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Live operations ·{" "}
            {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Today at a glance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          to="/bookings?new=1"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={17} /> New booking
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <UserRoundCheck size={16} />
            In progress
          </div>
          {currentBooking ? (
            <>
              <p className="mt-3 truncate text-lg font-semibold text-slate-900">
                {currentBooking.customer}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {currentBooking.service} · {currentBooking.staff}
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                Started {formatTime(currentBooking.time)}
                {currentService?.durationMinutes
                  ? ` · ${currentService.durationMinutes} min`
                  : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No appointment in progress.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarClock size={16} />
            Next booking
          </div>
          {nextBooking ? (
            <>
              <p className="mt-3 truncate text-lg font-semibold text-slate-900">
                {nextBooking.customer}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {nextBooking.service} · {nextBooking.staff}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {formatTime(nextBooking.time)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No more bookings today.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Clock3 size={16} />
            Needs confirmation
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {pendingCount}
          </p>
          <Link
            to="/bookings?status=Pending"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Review pending bookings <CheckCircle2 size={15} />
          </Link>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="page-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Today's schedule{" "}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {todayBookings.length} bookings
              </span>
            </h2>

            <Link
              to="/calendar"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {todayBookings.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No bookings scheduled for today.
              </div>
            )}

            {todayBookings.map((booking) => (
              <div
                key={`${booking.time}-${booking.customer}`}
                className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between ${currentBooking === booking ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 shrink-0 text-sm font-semibold text-slate-500">
                    {formatTime(booking.time)}
                  </div>

                  <div>
                    <div className="font-medium text-slate-900">
                      {booking.customer}
                    </div>
                    <div className="text-sm text-slate-500">
                      {booking.service}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 md:justify-end">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {booking.staff}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 ${booking.status === "Confirmed" ? "bg-emerald-50 text-emerald-700" : booking.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            Need the bigger picture?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review booking and payment performance across a date range.
          </p>
        </div>
        <Link
          to="/reports"
          className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Open reports
        </Link>
      </div>
    </div>
  );
}

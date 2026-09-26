import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../lib/api";

type Booking = {
  id?: string;
  _id?: string;
  customer: string;
  service: string;
  staff: string;
  amount?: number;
  date: string;
  status: string;
  payment: string;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currency, setCurrency] = useState("PHP");
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const [bookingData, businessData] = await Promise.all([
          apiRequest<{ bookings: Booking[] }>("/bookings"),
          apiRequest<{ business?: { currency?: string } }>("/business"),
        ]);
        setBookings(bookingData.bookings ?? []);
        setCurrency(businessData.business?.currency ?? "PHP");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load reports");
      } finally {
        setLoading(false);
      }
    }
    void loadReports();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (period - 1));
  const startKey = dateKey(start);
  const endKey = dateKey(today);
  const rangeBookings = bookings.filter(
    (booking) =>
      booking.date >= startKey &&
      booking.date <= endKey &&
      booking.status !== "Rejected",
  );
  const paidBookings = rangeBookings.filter(
    (booking) => booking.payment === "Paid",
  );
  const paidValue = paidBookings.reduce(
    (total, booking) => total + Number(booking.amount ?? 0),
    0,
  );
  const completed = rangeBookings.filter(
    (booking) => booking.status === "Completed",
  ).length;
  const pending = rangeBookings.filter(
    (booking) => booking.status === "Pending",
  ).length;

  const daily = new Map<string, { bookings: number; paidValue: number }>();
  for (
    let cursor = new Date(start);
    cursor <= today;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    daily.set(dateKey(cursor), { bookings: 0, paidValue: 0 });
  }
  for (const booking of rangeBookings) {
    const current = daily.get(booking.date);
    if (!current) continue;
    current.bookings += 1;
    if (booking.payment === "Paid") {
      current.paidValue += Number(booking.amount ?? 0);
    }
  }
  const trend = Array.from(daily, ([date, values]) => ({
    date: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    ...values,
  }));

  const serviceTotals = new Map<string, number>();
  const staffTotals = new Map<string, number>();
  const statusTotals = new Map<string, number>();
  for (const booking of rangeBookings) {
    serviceTotals.set(
      booking.service,
      (serviceTotals.get(booking.service) ?? 0) + 1,
    );
    staffTotals.set(booking.staff, (staffTotals.get(booking.staff) ?? 0) + 1);
    statusTotals.set(
      booking.status,
      (statusTotals.get(booking.status) ?? 0) + 1,
    );
  }
  const topServices = Array.from(serviceTotals, ([name, count]) => ({
    name,
    count,
  }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 5);
  const topStaff = Array.from(staffTotals, ([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 5);
  const statusRows = Array.from(statusTotals, ([name, count]) => ({
    name,
    count,
  })).sort((first, second) => second.count - first.count);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Business performance
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Booking and payment outcomes over time.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
          aria-label="Report period"
        >
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriod(days)}
              aria-pressed={period === days}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${period === days ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {days} days
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading reports...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-sm">
            <p className="font-medium text-slate-700">
              {start.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              –{" "}
              {today.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-slate-500">
              Paid value includes bookings marked Paid; deposits are not counted
              as fully paid.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Bookings",
                value: rangeBookings.length.toLocaleString(),
              },
              { label: "Paid booking value", value: formatCurrency(paidValue) },
              { label: "Completed", value: completed.toLocaleString() },
              { label: "Pending", value: pending.toLocaleString() },
            ].map((metric) => (
              <section
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {metric.value}
                </p>
              </section>
            ))}
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">Booking volume</h2>
              <p className="mt-1 text-sm text-slate-500">
                Non-rejected bookings by day.
              </p>
            </div>
            {rangeBookings.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                No booking activity in this period.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trend}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#047857"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Paid booking value
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Value by booking date for bookings marked Paid.
              </p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar
                    dataKey="paidValue"
                    name="Paid value"
                    fill="#0f766e"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">Booking status</h2>
              <div className="mt-4 space-y-3">
                {statusRows.length ? (
                  statusRows.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{row.name}</span>
                      <span className="font-semibold text-slate-900">
                        {row.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No bookings in this period.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">Top services</h2>
              <div className="mt-4 space-y-3">
                {topServices.length ? (
                  topServices.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-slate-600">
                        {row.name}
                      </span>
                      <span className="shrink-0 font-semibold text-slate-900">
                        {row.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No service activity in this period.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">
                Bookings by staff
              </h2>
              <div className="mt-4 space-y-3">
                {topStaff.length ? (
                  topStaff.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-slate-600">
                        {row.name}
                      </span>
                      <span className="shrink-0 font-semibold text-slate-900">
                        {row.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No staff activity in this period.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

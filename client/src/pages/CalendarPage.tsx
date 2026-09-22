import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Clock3, Plus, X } from "lucide-react";
import { apiRequest } from "../lib/api";
import { addBookingNotification } from "../lib/notifications";

type Booking = {
  id: string;
  confirmationCode?: string;
  customer: string;
  email: string;
  service: string;
  staff: string;
  court?: string;
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
type Settings = {
  business?: {
    courtsCount?: number;
    disabledCourts?: string[];
    openHour?: string;
    closeHour?: string;
  } | null;
};
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultHours = Array.from({ length: 12 }, (_, i) => i + 8);
const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const mondayOf = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(
    result.getDate() - (result.getDay() === 0 ? 6 : result.getDay() - 1),
  );
  return result;
};
const hourLabel = (hour: number) =>
  `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`;
const normalize = (raw: Partial<Booking> & { _id?: string }) =>
  ({
    ...raw,
    id: raw.id ?? String(raw._id ?? ""),
    customer: raw.customer ?? "Guest",
    email: raw.email ?? "",
    service: raw.service ?? "Court booking",
    staff: raw.staff ?? "Maria",
    date: raw.date ?? keyOf(new Date()),
    time: raw.time ?? "09:00",
    status: raw.status ?? "Pending",
    payment: raw.payment ?? "Unpaid",
    paymentMethod: raw.paymentMethod ?? "PayPal",
  }) as Booking;
const bookingTone = (status: Booking["status"]) =>
  status === "Confirmed"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "Completed"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : status === "Rejected"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

export function CalendarPage() {
  const today = new Date();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(mondayOf(today));
  const [selectedDate, setSelectedDate] = useState(keyOf(today));
  const [courtCount, setCourtCount] = useState(3);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [hours, setHours] = useState(defaultHours);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [draft, setDraft] = useState({
    customer: "",
    email: "",
    service: "Court booking",
    court: "Court 1",
    date: keyOf(today),
    time: "09:00",
    status: "Pending" as Booking["status"],
    payment: "Unpaid" as Booking["payment"],
    paymentMethod: "PayPal" as Booking["paymentMethod"],
  });
  const courts = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, courtCount) },
        (_, i) => `Court ${i + 1}`,
      ),
    [courtCount],
  );
  const week = useMemo(
    () =>
      days.map((_, i) => {
        const date = new Date(anchor);
        date.setDate(anchor.getDate() + i);
        return date;
      }),
    [anchor],
  );
  const find = (date: string, court?: string, time?: string) =>
    bookings.filter(
      (item) =>
        item.date === date &&
        (!court ||
          item.court === court ||
          (!item.court && court === "Court 1")) &&
        (!time || item.time === time),
    );

  useEffect(() => {
    async function load() {
      try {
        const [bookingData, settingsData] = await Promise.all([
          apiRequest<{ bookings: Booking[] }>("/bookings/"),
          apiRequest<Settings>("/business/"),
        ]);
        setBookings((bookingData.bookings ?? []).map(normalize));
        const business = settingsData.business;
        setCourtCount(Math.max(1, Number(business?.courtsCount ?? 3)));
        setBlocked(business?.disabledCourts ?? []);
        const opening = Number((business?.openHour ?? "08:00").split(":")[0]);
        const closing = Number((business?.closeHour ?? "20:00").split(":")[0]);
        if (closing > opening)
          setHours(
            Array.from({ length: closing - opening }, (_, i) => opening + i),
          );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load calendar",
        );
      }
    }
    void load();
  }, []);

  const openForm = (date = selectedDate, time = "09:00", court = courts[0]) => {
    setDraft((current) => ({ ...current, date, time, court }));
    setShowForm(true);
  };
  const move = (direction: number) => {
    const next = new Date(anchor);

    if (view === "week") {
      next.setDate(next.getDate() + direction * 7);
      setAnchor(mondayOf(next));
    } else {
      next.setMonth(next.getMonth() + direction);
      setAnchor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const todayClick = () => {
    setSelectedDate(keyOf(today));
    setAnchor(
      view === "week"
        ? mondayOf(today)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
  };
  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ booking: Booking }>("/bookings/", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      addBookingNotification(result.booking ?? draft);
      const data = await apiRequest<{ bookings: Booking[] }>("/bookings/");
      setBookings((data.bookings ?? []).map(normalize));
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    } finally {
      setBusy(false);
    }
  };

  const month = view === "month" ? anchor : week[0];
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const total = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from(
    { length: Math.ceil((offset + total) / 7) * 7 },
    (_, i) => {
      const day = i - offset + 1;
      return day > 0 && day <= total
        ? new Date(month.getFullYear(), month.getMonth(), day)
        : null;
    },
  );
  const heading =
    view === "week"
      ? `${week[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${week[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Court operations
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Booking calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep every court moving, one hour at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={17} /> New booking
        </button>
      </header>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(["week", "month"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setView(item);
                    setSelectedDate(keyOf(today));
                    setAnchor(
                      item === "week"
                        ? mondayOf(today)
                        : new Date(today.getFullYear(), today.getMonth(), 1),
                    );
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${view === item ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={todayClick}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => move(-1)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => move(1)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="text-base font-bold text-slate-900">{heading}</h2>
          </div>
        </div>
        {view === "week" ? (
          <div className="w-full overflow-x-auto">
            <div className="w-full min-w-[1100px]">
              <div
                className="grid border-b border-slate-200 bg-slate-50"
                style={{
                  gridTemplateColumns: `72px repeat(${week.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="row-span-2 font-bold border-r border-slate-200 flex items-center justify-center">
                  Time
                </div>

                {week.map((date, i) => (
                  <div
                    key={keyOf(date)}
                    className="border-r border-slate-200 text-center"
                  >
                    <div className="p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {days[i]}
                      </div>
                      <div
                        className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${keyOf(date) === keyOf(today) ? "bg-emerald-700 text-white" : "text-slate-900"}`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    <div
                      className="grid border-t border-slate-200"
                      style={{
                        gridTemplateColumns: `repeat(${courts.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {courts.map((court) => (
                        <div
                          key={`${keyOf(date)}-${court}`}
                          className={`border-r border-slate-200 py-2 text-center text-[10px] font-bold uppercase last:border-r-0 ${blocked.includes(court) ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {court.replace("Court ", "C")}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `72px repeat(${week.length * courts.length}, minmax(0, 1fr))`,
                }}
              >
                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="border-r border-b border-slate-100 px-2 py-4 text-right text-[11px] font-semibold text-slate-400">
                      {hourLabel(hour)}
                    </div>
                    {week.flatMap((date) =>
                      courts.map((court) => {
                        const dateKey = keyOf(date);
                        const booking = find(
                          dateKey,
                          court,
                          `${String(hour).padStart(2, "0")}:00`,
                        )[0];
                        const unavailable = blocked.includes(court);
                        return (
                          <div
                            key={`${dateKey}-${court}-${hour}`}
                            className={`min-h-[60px] border-r border-b border-slate-100 p-1 ${unavailable ? "bg-slate-50" : "hover:bg-emerald-50/40"}`}
                          >
                            {unavailable ? (
                              <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-slate-300">
                                Blocked
                              </div>
                            ) : booking ? (
                              <button
                                type="button"
                                onClick={() => setDetail(booking)}
                                className={`h-full w-full rounded-lg border p-2 text-left text-[11px] ${bookingTone(booking.status)}`}
                              >
                                <strong className="block truncate">
                                  {booking.customer}
                                </strong>
                                <span className="block truncate opacity-80">
                                  {booking.service}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                aria-label={`New booking ${dateKey} ${hourLabel(hour)} ${court}`}
                                onClick={() =>
                                  openForm(
                                    dateKey,
                                    `${String(hour).padStart(2, "0")}:00`,
                                    court,
                                  )
                                }
                                className="h-full min-h-[52px] w-full rounded-lg"
                              />
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-7 border-l border-t border-slate-200">
              {days.map((day) => (
                <div
                  key={day}
                  className="border-r border-b border-slate-200 bg-slate-50 py-2 text-center text-[11px] font-bold uppercase text-slate-500"
                >
                  {day}
                </div>
              ))}
              {cells.map((date, i) =>
                !date ? (
                  <div
                    key={`blank-${i}`}
                    className="min-h-24 border-r border-b border-slate-200 bg-slate-50/50"
                  />
                ) : (
                  <button
                    type="button"
                    key={keyOf(date)}
                    onClick={() => setSelectedDate(keyOf(date))}
                    className={`min-h-24 border-r border-b border-slate-200 p-2 text-left ${selectedDate === keyOf(date) ? "bg-emerald-50 ring-2 ring-inset ring-emerald-600" : "bg-white"}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${keyOf(date) === keyOf(today) ? "bg-emerald-700 text-white" : "text-slate-700"}`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-2 flex gap-1">
                      {find(keyOf(date))
                        .slice(0, 5)
                        .map((booking) => (
                          <span
                            key={booking.id}
                            className={`h-2 w-2 rounded-full ${booking.status === "Confirmed" ? "bg-emerald-600" : booking.status === "Completed" ? "bg-sky-500" : "bg-amber-500"}`}
                          />
                        ))}
                    </div>
                  </button>
                ),
              )}
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Selected date
                  </p>
                  <h3 className="mt-1 font-bold text-slate-900">
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                      "en-US",
                      { weekday: "long", month: "long", day: "numeric" },
                    )}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openForm(selectedDate)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} /> Add booking
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {courts.map((court) => (
                  <div
                    key={court}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex justify-between text-sm font-semibold text-slate-700">
                      <span>{court}</span>
                      <span
                        className={`text-xs ${blocked.includes(court) ? "text-slate-400" : "text-emerald-700"}`}
                      >
                        {blocked.includes(court)
                          ? "Unavailable"
                          : `${find(selectedDate, court).length} booked`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-4 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">
          <span>
            <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Available
          </span>
          <span>
            <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pending
          </span>
          <span>
            <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
            Unavailable
          </span>
        </div>
      </section>
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Booking details
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {detail.customer}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setDetail(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Confirmation</span>
                <strong>{detail.confirmationCode ?? detail.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <strong>{detail.service}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Court</span>
                <strong>{detail.court ?? "Court 1"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <strong>{detail.date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock3 size={15} /> Time
                </span>
                <strong>{detail.time}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <strong
                  className={`rounded-full border px-2 py-1 text-xs ${bookingTone(detail.status)}`}
                >
                  {detail.status}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Quick booking
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  New booking
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close form"
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Customer
                <input
                  required
                  value={draft.customer}
                  onChange={(e) =>
                    setDraft({ ...draft, customer: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Email
                <input
                  required
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Service
                <input
                  required
                  value={draft.service}
                  onChange={(e) =>
                    setDraft({ ...draft, service: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Court
                <select
                  value={draft.court}
                  onChange={(e) =>
                    setDraft({ ...draft, court: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  {courts.map((court) => (
                    <option key={court} disabled={blocked.includes(court)}>
                      {court}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Date
                <input
                  required
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Time
                <select
                  value={draft.time}
                  onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  {hours.map((hour) => (
                    <option
                      key={hour}
                    >{`${String(hour).padStart(2, "0")}:00`}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Status
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as Booking["status"],
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {busy ? "Saving..." : "Save booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

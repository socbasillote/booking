import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Clock3, Plus, X } from "lucide-react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { addBookingNotification } from "../lib/notifications";
import { SkeletonBlock, SkeletonLoader } from "../components/SkeletonLoader";
import { serviceIconFor } from "../lib/serviceAppearance";

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
type CalendarService = {
  name: string;
  icon?: string;
  color?: string;
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
  const [services, setServices] = useState<CalendarService[]>([]);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(mondayOf(today));
  const [selectedDate, setSelectedDate] = useState(keyOf(today));
  const [miniMonth, setMiniMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [serviceFilter, setServiceFilter] = useState("All services");
  const [courtFilter, setCourtFilter] = useState("All courts");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [courtCount, setCourtCount] = useState(3);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [hours, setHours] = useState(defaultHours);
  const [loading, setLoading] = useState(true);
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
  const selectedDateObject = new Date(`${selectedDate}T12:00:00`);
  const calendarDates = view === "day" ? [selectedDateObject] : week;
  const serviceNames = useMemo(
    () =>
      [
        ...new Set([
          ...services.map((service) => service.name),
          ...bookings.map((booking) => booking.service),
        ]),
      ].sort((a, b) => a.localeCompare(b)),
    [bookings, services],
  );
  const visibleCourts =
    courtFilter === "All courts"
      ? courts
      : courts.filter((court) => court === courtFilter);
  const find = (date: string, court?: string) =>
    bookings.filter(
      (item) =>
        item.date === date &&
        (!court ||
          item.court === court ||
          (!item.court && court === "Court 1")) &&
        (serviceFilter === "All services" || item.service === serviceFilter) &&
        (statusFilter === "All statuses" || item.status === statusFilter) &&
        (courtFilter === "All courts" ||
          (item.court ?? "Court 1") === courtFilter),
    );
  const chooseDate = (date: Date) => {
    setSelectedDate(keyOf(date));
    setMiniMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setAnchor(
      view === "month"
        ? new Date(date.getFullYear(), date.getMonth(), 1)
        : mondayOf(date),
    );
  };

  useEffect(() => {
    async function load() {
      try {
        const [bookingData, settingsData, serviceData] = await Promise.all([
          apiRequestWithCache<{ bookings: Booking[] }>("/bookings", (data) => {
            setBookings((data.bookings ?? []).map(normalize));
            setLoading(false);
          }),
          apiRequestWithCache<Settings>("/business", (data) => {
            const business = data.business;
            setCourtCount(Math.max(1, Number(business?.courtsCount ?? 3)));
            setBlocked(business?.disabledCourts ?? []);
            const opening = Number(
              (business?.openHour ?? "08:00").split(":")[0],
            );
            const closing = Number(
              (business?.closeHour ?? "20:00").split(":")[0],
            );
            if (closing > opening)
              setHours(
                Array.from(
                  { length: closing - opening },
                  (_, i) => opening + i,
                ),
              );
            setLoading(false);
          }),
          apiRequestWithCache<{ services: CalendarService[] }>(
            "/services",
            (data) => setServices(data.services ?? []),
          ),
        ]);
        setBookings((bookingData.bookings ?? []).map(normalize));
        setServices(serviceData.services ?? []);
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
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const openForm = (date = selectedDate, time = "09:00", court = courts[0]) => {
    setDraft((current) => ({ ...current, date, time, court }));
    setShowForm(true);
  };
  const move = (direction: number) => {
    if (view === "day") {
      const next = new Date(selectedDateObject);
      next.setDate(next.getDate() + direction);
      chooseDate(next);
      return;
    }

    const next = new Date(anchor);

    if (view === "week") {
      next.setDate(next.getDate() + direction * 7);
      setAnchor(mondayOf(next));
      const selected = new Date(selectedDateObject);
      selected.setDate(selected.getDate() + direction * 7);
      chooseDate(selected);
    } else {
      next.setMonth(next.getMonth() + direction);
      setAnchor(new Date(next.getFullYear(), next.getMonth(), 1));
      chooseDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const todayClick = () => {
    chooseDate(today);
    setAnchor(
      view === "week"
        ? mondayOf(today)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
  };
  const miniMonthCells = Array.from(
    {
      length:
        Math.ceil(
          (((new Date(
            miniMonth.getFullYear(),
            miniMonth.getMonth(),
            1,
          ).getDay() +
            6) %
            7) +
            new Date(
              miniMonth.getFullYear(),
              miniMonth.getMonth() + 1,
              0,
            ).getDate()) /
            7,
        ) * 7,
    },
    (_, index) => {
      const firstDay = new Date(
        miniMonth.getFullYear(),
        miniMonth.getMonth(),
        1,
      );
      const day = index - ((firstDay.getDay() + 6) % 7) + 1;
      const totalDays = new Date(
        miniMonth.getFullYear(),
        miniMonth.getMonth() + 1,
        0,
      ).getDate();
      return day > 0 && day <= totalDays
        ? new Date(miniMonth.getFullYear(), miniMonth.getMonth(), day)
        : null;
    },
  );
  const selectedDayBookings = find(selectedDate).sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ booking: Booking }>("/bookings", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      addBookingNotification(result.booking ?? draft);
      const data = await apiRequest<{ bookings: Booking[] }>("/bookings");
      setBookings((data.bookings ?? []).map(normalize));
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    } finally {
      setBusy(false);
    }
  };

  const month =
    view === "month" ? anchor : view === "day" ? selectedDateObject : week[0];
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
    view === "day"
      ? selectedDateObject.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : view === "week"
        ? `${week[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${week[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });

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
            Manage court bookings across your week.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={17} /> Quick Book
        </button>
      </header>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <SkeletonLoader label="Loading calendar">
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex gap-2">
                  <SkeletonBlock className="h-9 w-24" />
                  <SkeletonBlock className="h-9 w-20" />
                  <SkeletonBlock className="ml-auto h-9 w-40" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, day) => (
                    <div
                      key={day}
                      className="space-y-2 rounded-lg border border-slate-200 p-2"
                    >
                      <SkeletonBlock className="h-4 w-1/2" />
                      <SkeletonBlock className="h-8 w-8 rounded-full" />
                      <SkeletonBlock className="h-20 w-full" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }, (_, court) => (
                    <SkeletonBlock key={court} className="h-8" />
                  ))}
                </div>
              </div>
            </SkeletonLoader>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={todayClick}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Today
                  </button>
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {(["day", "week", "month"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setView(item);
                          const selected = new Date(`${selectedDate}T12:00:00`);
                          setAnchor(
                            item === "week"
                              ? mondayOf(selected)
                              : new Date(
                                  selected.getFullYear(),
                                  selected.getMonth(),
                                  1,
                                ),
                          );
                        }}
                        aria-pressed={view === item}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize transition sm:px-3 sm:text-sm ${view === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      aria-label="Previous period"
                      onClick={() => move(-1)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next period"
                      onClick={() => move(1)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <h2 className="min-w-0 text-sm font-semibold text-slate-900 sm:text-base">
                    {heading}
                  </h2>
                  {view === "day" && (
                    <input
                      type="date"
                      aria-label="Choose calendar date"
                      value={selectedDate}
                      onChange={(event) => {
                        if (event.target.value)
                          chooseDate(
                            new Date(`${event.target.value}T12:00:00`),
                          );
                      }}
                      className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
                    />
                  )}
                </div>
              </div>
              {view !== "month" ? (
                <div className="overflow-x-auto">
                  <div
                    className={
                      view === "day" ? "min-w-[420px]" : "min-w-[1040px]"
                    }
                  >
                    <div
                      className="grid border-b border-slate-200 bg-slate-50"
                      style={{
                        gridTemplateColumns: `132px repeat(${calendarDates.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className="flex items-center px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Courts
                      </div>
                      {calendarDates.map((date) => {
                        const dateKey = keyOf(date);
                        const isToday = dateKey === keyOf(today);
                        const isSelected = dateKey === selectedDate;
                        return (
                          <button
                            type="button"
                            key={dateKey}
                            onClick={() => chooseDate(date)}
                            aria-label={`Select ${date.toLocaleDateString("en-US", { dateStyle: "full" })}`}
                            className={`border-l border-slate-200 px-3 py-3 text-left transition hover:bg-white ${isSelected ? "bg-emerald-50/70" : ""}`}
                          >
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <span
                              className={`mt-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-bold ${isToday ? "bg-emerald-700 text-white" : isSelected ? "bg-emerald-100 text-emerald-900" : "text-slate-900"}`}
                            >
                              {date.getDate()}
                            </span>
                            <span className="ml-2 text-[10px] text-slate-400">
                              {find(dateKey).length} bookings
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {visibleCourts.map((court) => {
                      const unavailable = blocked.includes(court);
                      const weekCount = calendarDates.reduce(
                        (totalCount, date) =>
                          totalCount + find(keyOf(date), court).length,
                        0,
                      );
                      return (
                        <div
                          key={court}
                          className="grid border-b border-slate-200 last:border-b-0"
                          style={{
                            gridTemplateColumns: `132px repeat(${calendarDates.length}, minmax(0, 1fr))`,
                          }}
                        >
                          <div className="sticky left-0 z-10 flex min-h-36 flex-col justify-center border-r border-slate-200 bg-white px-4 py-3">
                            <span className="text-sm font-semibold text-slate-900">
                              {court}
                            </span>
                            <span
                              className={`mt-1 text-xs ${unavailable ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {unavailable
                                ? "Unavailable"
                                : `${weekCount} bookings`}
                            </span>
                          </div>
                          {calendarDates.map((date) => {
                            const dateKey = keyOf(date);
                            const cellBookings = find(dateKey, court).sort(
                              (firstBooking, secondBooking) =>
                                firstBooking.time.localeCompare(
                                  secondBooking.time,
                                ),
                            );
                            return (
                              <div
                                key={`${court}-${dateKey}`}
                                className={`min-h-36 space-y-2 border-l border-slate-200 p-2 ${dateKey === selectedDate ? "bg-emerald-50/30" : "bg-white"} ${unavailable ? "bg-slate-50" : ""}`}
                              >
                                {unavailable ? (
                                  <div className="flex min-h-28 items-center justify-center text-xs font-medium text-slate-400">
                                    Court closed
                                  </div>
                                ) : (
                                  <>
                                    {cellBookings.map((booking) => {
                                      const service = services.find(
                                        (item) => item.name === booking.service,
                                      );
                                      const ServiceIcon = serviceIconFor(
                                        service?.icon,
                                      );
                                      const serviceColor =
                                        service?.color ?? "#059669";
                                      return (
                                        <button
                                          type="button"
                                          key={booking.id}
                                          onClick={() => setDetail(booking)}
                                          className="block w-full rounded-lg border border-slate-200 border-l-[3px] bg-white p-2.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                                          style={{
                                            borderLeftColor: serviceColor,
                                          }}
                                        >
                                          <span className="flex items-center justify-between gap-1">
                                            <span className="flex items-center gap-1 text-[11px] font-semibold tabular-nums text-slate-500">
                                              <Clock3 size={12} />{" "}
                                              {booking.time}
                                            </span>
                                            <span
                                              className={`truncate rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${bookingTone(booking.status)}`}
                                            >
                                              {booking.status}
                                            </span>
                                          </span>
                                          <strong className="mt-1.5 block truncate text-xs font-semibold text-slate-900">
                                            {booking.customer}
                                          </strong>
                                          <span
                                            className="mt-1 flex min-w-0 items-center gap-1 truncate text-[11px] font-medium"
                                            style={{ color: serviceColor }}
                                          >
                                            <ServiceIcon
                                              size={12}
                                              className="shrink-0"
                                            />
                                            <span className="truncate">
                                              {booking.service}
                                            </span>
                                          </span>
                                        </button>
                                      );
                                    })}
                                    <button
                                      type="button"
                                      aria-label={`Quick book ${court} on ${dateKey}`}
                                      onClick={() =>
                                        openForm(
                                          dateKey,
                                          `${String(hours[0] ?? 9).padStart(2, "0")}:00`,
                                          court,
                                        )
                                      }
                                      className="flex min-h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 text-[11px] font-medium text-slate-400 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-700"
                                    >
                                      <Plus size={13} /> Add booking
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {visibleCourts.length === 0 && (
                      <div className="p-10 text-center text-sm text-slate-500">
                        No courts match this filter.
                      </div>
                    )}
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
                          onClick={() => chooseDate(date)}
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
                              .map((booking) => {
                                const service = services.find(
                                  (item) => item.name === booking.service,
                                );
                                const ServiceIcon = serviceIconFor(
                                  service?.icon,
                                );
                                return (
                                  <span
                                    key={booking.id}
                                    title={booking.service}
                                  >
                                    <ServiceIcon
                                      size={13}
                                      style={{
                                        color: service?.color ?? "#059669",
                                      }}
                                    />
                                  </span>
                                );
                              })}
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
                          {new Date(
                            `${selectedDate}T12:00:00`,
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
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
            </>
          )}
        </section>
        <aside className="space-y-4 2xl:sticky 2xl:top-24">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {miniMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex">
                <button
                  type="button"
                  aria-label="Previous month in mini calendar"
                  onClick={() =>
                    setMiniMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() - 1,
                          1,
                        ),
                    )
                  }
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next month in mini calendar"
                  onClick={() =>
                    setMiniMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() + 1,
                          1,
                        ),
                    )
                  }
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {days.map((day) => (
                <span
                  key={day}
                  className="py-1 text-[10px] font-semibold uppercase text-slate-400"
                >
                  {day.slice(0, 2)}
                </span>
              ))}
              {miniMonthCells.map((date, index) =>
                date ? (
                  <button
                    key={keyOf(date)}
                    type="button"
                    onClick={() => chooseDate(date)}
                    aria-label={date.toLocaleDateString("en-US", {
                      dateStyle: "full",
                    })}
                    className={`mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-full text-xs transition ${keyOf(date) === keyOf(today) ? "bg-emerald-700 font-bold text-white" : keyOf(date) === selectedDate ? "bg-emerald-100 font-bold text-emerald-900 ring-1 ring-emerald-600" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <span key={`mini-blank-${index}`} className="h-8" />
                ),
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Filters
            </h2>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                Service
                <select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600"
                >
                  <option>All services</option>
                  {serviceNames.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Court
                <select
                  value={courtFilter}
                  onChange={(event) => setCourtFilter(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600"
                >
                  <option>All courts</option>
                  {courts.map((court) => (
                    <option key={court}>{court}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600"
                >
                  <option>All statuses</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Rejected</option>
                </select>
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Selected day
              </p>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">
                {selectedDateObject.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
            </div>
            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {selectedDayBookings.length ? (
                selectedDayBookings.map((booking) => {
                  const service = services.find(
                    (item) => item.name === booking.service,
                  );
                  const ServiceIcon = serviceIconFor(service?.icon);
                  const serviceColor = service?.color ?? "#059669";
                  return (
                    <button
                      type="button"
                      key={booking.id}
                      onClick={() => setDetail(booking)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-slate-500">
                        {booking.time}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-900">
                          {booking.customer}
                        </span>
                        <span
                          className="mt-1 flex items-center gap-1 truncate text-[11px]"
                          style={{ color: serviceColor }}
                        >
                          <ServiceIcon size={12} />
                          {booking.service}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-400">
                          {booking.court ?? "Court 1"}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${bookingTone(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-4 py-6 text-center text-xs text-slate-500">
                  No bookings match these filters.
                </p>
              )}
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Court availability
              </p>
              <div className="space-y-1.5">
                {courts.map((court) => {
                  const isUnavailable = blocked.includes(court);
                  const bookingCount = bookings.filter(
                    (booking) =>
                      booking.date === selectedDate &&
                      (booking.court ?? "Court 1") === court &&
                      booking.status !== "Rejected",
                  ).length;
                  return (
                    <div
                      key={court}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600">{court}</span>
                      <span
                        className={
                          isUnavailable
                            ? "text-slate-400"
                            : bookingCount
                              ? "text-amber-700"
                              : "text-emerald-700"
                        }
                      >
                        {isUnavailable
                          ? "Unavailable"
                          : bookingCount
                            ? `${bookingCount} booked`
                            : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </aside>
      </div>
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

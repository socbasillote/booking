import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CalendarOff,
  Clock3,
  DoorOpen,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof days)[number];
type BusinessHours = {
  day: Day;
  open: boolean;
  startTime: string;
  endTime: string;
};
type StaffHours = {
  staffId: string;
  staffName: string;
  days: Day[];
  startTime: string;
  endTime: string;
};
type ExceptionType =
  | "Holiday"
  | "Vacation"
  | "Blocked date"
  | "Unavailable period";
type AvailabilityException = {
  id: string;
  title: string;
  type: ExceptionType;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
};
type Resource = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  enabled: boolean;
};
type Availability = {
  businessHours: BusinessHours[];
  staffHours: StaffHours[];
  exceptions: AvailabilityException[];
  rules: {
    minAdvanceHours: number;
    maxAdvanceDays: number;
    cancellationCutoffHours: number;
    bookingIntervalMinutes: number;
    bufferMinutes: number;
  };
  resources: Resource[];
};
type BusinessRecord = {
  name: string;
  slug: string;
  currency?: string;
  description?: string;
  timezone?: string;
  openHour?: string;
  closeHour?: string;
  slotsPerHour?: number;
  slotIntervalMinutes?: number;
  isOpen24Hours?: boolean;
  courtsCount?: number;
  disabledCourts?: string[];
  settings?: {
    booking?: { availability?: Availability; [key: string]: unknown };
    [key: string]: unknown;
  };
};
type TeamMember = { id: string; name: string; role: string };

const defaultAvailability: Availability = {
  businessHours: days.map((day, index) => ({
    day,
    open: index < 6,
    startTime: "09:00",
    endTime: "17:00",
  })),
  staffHours: [],
  exceptions: [],
  rules: {
    minAdvanceHours: 2,
    maxAdvanceDays: 90,
    cancellationCutoffHours: 24,
    bookingIntervalMinutes: 30,
    bufferMinutes: 0,
  },
  resources: [
    {
      id: "default-court-1",
      name: "Court 1",
      type: "Court",
      quantity: 1,
      enabled: true,
    },
  ],
};
const sectionClass =
  "overflow-hidden rounded-xl border border-slate-200 bg-white";
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600";

function normalizeAvailability(
  value?: Partial<Availability>,
  business?: BusinessRecord | null,
): Availability {
  const resources = value?.resources ?? [];
  const hasCourtResources = resources.some(
    (resource) => resource.type.toLowerCase() === "court",
  );
  const legacyCourtCount = Math.max(1, Number(business?.courtsCount ?? 1));
  const courtResources = hasCourtResources
    ? []
    : Array.from({ length: legacyCourtCount }, (_, index) => {
        const name = `Court ${index + 1}`;
        return {
          id: `legacy-court-${index + 1}`,
          name,
          type: "Court",
          quantity: 1,
          enabled: !(business?.disabledCourts ?? []).includes(name),
        };
      });
  const legacyHours = days.map((day) => ({
    day,
    open: true,
    startTime: business?.openHour ?? "08:00",
    endTime: business?.closeHour ?? "20:00",
  }));
  return {
    ...defaultAvailability,
    ...value,
    businessHours: days.map(
      (day) =>
        value?.businessHours?.find((entry) => entry.day === day) ??
        legacyHours.find((entry) => entry.day === day)!,
    ),
    staffHours: value?.staffHours ?? [],
    exceptions: value?.exceptions ?? [],
    rules: {
      ...defaultAvailability.rules,
      bookingIntervalMinutes:
        business?.slotIntervalMinutes ??
        defaultAvailability.rules.bookingIntervalMinutes,
      ...value?.rules,
    },
    resources: [...resources, ...courtResources],
  };
}

export function AvailabilityPage() {
  const [availability, setAvailability] = useState(defaultAvailability);
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [exceptionDraft, setExceptionDraft] = useState({
    title: "",
    type: "Holiday" as ExceptionType,
    date: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    allDay: true,
  });
  const [resourceDraft, setResourceDraft] = useState({
    name: "",
    type: "Room",
    quantity: 1,
  });

  useEffect(() => {
    async function load() {
      try {
        const [businessData, teamData] = await Promise.all([
          apiRequest<{ business: BusinessRecord | null }>("/business"),
          apiRequest<{ users: TeamMember[] }>("/team"),
        ]);
        setBusiness(businessData.business);
        const saved = businessData.business?.settings?.booking?.availability;
        const result = normalizeAvailability(saved, businessData.business);
        const staff = (teamData.users ?? []).filter(
          (member) => member.role !== "owner",
        );
        result.staffHours = staff.map(
          (member) =>
            result.staffHours.find((entry) => entry.staffId === member.id) ?? {
              staffId: member.id,
              staffName: member.name,
              days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
              startTime: "09:00",
              endTime: "17:00",
            },
        );
        setAvailability(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load availability",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function updateDay(day: Day, changes: Partial<BusinessHours>) {
    setAvailability((current) => ({
      ...current,
      businessHours: current.businessHours.map((entry) =>
        entry.day === day ? { ...entry, ...changes } : entry,
      ),
    }));
  }

  function updateStaff(staffId: string, changes: Partial<StaffHours>) {
    setAvailability((current) => ({
      ...current,
      staffHours: current.staffHours.map((entry) =>
        entry.staffId === staffId ? { ...entry, ...changes } : entry,
      ),
    }));
  }

  function addException() {
    if (!exceptionDraft.title.trim() || !exceptionDraft.date) return;
    setAvailability((current) => ({
      ...current,
      exceptions: [
        ...current.exceptions,
        { ...exceptionDraft, id: crypto.randomUUID() },
      ],
    }));
    setExceptionDraft((current) => ({
      ...current,
      title: "",
      date: "",
      endDate: "",
    }));
  }

  function addResource() {
    setAvailability((current) => ({
      ...current,
      resources: [
        ...current.resources,
        { ...resourceDraft, id: crypto.randomUUID(), enabled: true },
      ],
    }));
    setResourceDraft({ name: "", type: "Room", quantity: 1 });
  }

  function removeResource(resourceId: string) {
    setAvailability((current) => {
      const resource = current.resources.find(
        (entry) => entry.id === resourceId,
      );
      const remainingCourts = current.resources.filter(
        (entry) =>
          entry.id !== resourceId && entry.type.toLowerCase() === "court",
      );
      if (
        resource?.type.toLowerCase() === "court" &&
        remainingCourts.length === 0
      ) {
        setMessage("Keep at least one court resource for online bookings.");
        return current;
      }
      return {
        ...current,
        resources: current.resources.filter((entry) => entry.id !== resourceId),
      };
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!business) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const openDay = availability.businessHours.find((entry) => entry.open);
      const courtResources = availability.resources.filter(
        (resource) => resource.type.toLowerCase() === "court",
      );
      const disabledCourts = courtResources
        .filter((resource) => !resource.enabled)
        .map((resource) => resource.name.trim());
      await apiRequest<{ business: BusinessRecord }>("/business", {
        method: "PUT",
        body: JSON.stringify({
          name: business.name,
          slug: business.slug,
          currency: business.currency ?? "PHP",
          description: business.description ?? "",
          timezone: business.timezone ?? "Asia/Manila",
          openHour: openDay?.startTime ?? business.openHour ?? "09:00",
          closeHour: openDay?.endTime ?? business.closeHour ?? "17:00",
          slotsPerHour: business.slotsPerHour ?? 2,
          slotIntervalMinutes: availability.rules.bookingIntervalMinutes,
          isOpen24Hours: business.isOpen24Hours ?? false,
          courtsCount: Math.max(1, courtResources.length),
          disabledCourts,
          settings: { booking: { availability } },
        }),
      });
      setMessage("Availability settings saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save availability",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Booking setup
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Set the times and conditions customers can book.
          </p>
        </div>
        <Link
          to="/calendar"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CalendarDays size={16} /> View calendar
        </Link>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-emerald-950">
          <strong>Calendar shows what is scheduled.</strong> Availability
          controls when bookings are allowed.
        </p>
        <Link
          to="/calendar"
          className="shrink-0 text-sm font-semibold text-emerald-800 hover:underline"
        >
          Open Calendar
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading availability...
        </div>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <section className={sectionClass}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <DoorOpen size={19} className="mt-0.5 text-emerald-700" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Business hours
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Set the regular opening window for each day.
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {availability.businessHours.map((entry) => (
                <div
                  key={entry.day}
                  className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[4rem_6rem_1fr_1fr] sm:px-5"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {entry.day}
                  </span>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={entry.open}
                      onChange={(event) =>
                        updateDay(entry.day, { open: event.target.checked })
                      }
                      className="h-4 w-4 accent-emerald-700"
                    />
                    Open
                  </label>
                  <label className="text-xs font-medium text-slate-500">
                    Opens
                    <input
                      aria-label={`${entry.day} opening time`}
                      type="time"
                      disabled={!entry.open}
                      value={entry.startTime}
                      onChange={(event) =>
                        updateDay(entry.day, { startTime: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-500">
                    Closes
                    <input
                      aria-label={`${entry.day} closing time`}
                      type="time"
                      disabled={!entry.open}
                      value={entry.endTime}
                      onChange={(event) =>
                        updateDay(entry.day, { endTime: event.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <Users size={19} className="mt-0.5 text-emerald-700" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Staff availability
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Set working days and hours for each team member.
                  </p>
                </div>
              </div>
            </div>
            {availability.staffHours.length === 0 ? (
              <p className="px-5 py-5 text-sm text-slate-500">
                No staff members to configure yet. Add your team in Team
                settings.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {availability.staffHours.map((entry) => (
                  <div
                    key={entry.staffId}
                    className="space-y-3 px-4 py-4 sm:px-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <span className="text-sm font-semibold text-slate-800">
                        {entry.staffName}
                      </span>
                      <div className="flex flex-wrap gap-x-3 gap-y-2">
                        {days.map((day) => (
                          <label
                            key={day}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                          >
                            <input
                              type="checkbox"
                              checked={entry.days.includes(day)}
                              onChange={(event) =>
                                updateStaff(entry.staffId, {
                                  days: event.target.checked
                                    ? [...entry.days, day]
                                    : entry.days.filter(
                                        (value) => value !== day,
                                      ),
                                })
                              }
                              className="h-3.5 w-3.5 accent-emerald-700"
                            />
                            {day}
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 lg:w-56">
                        <input
                          aria-label={`${entry.staffName} start time`}
                          type="time"
                          value={entry.startTime}
                          onChange={(event) =>
                            updateStaff(entry.staffId, {
                              startTime: event.target.value,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                        />
                        <input
                          aria-label={`${entry.staffName} end time`}
                          type="time"
                          value={entry.endTime}
                          onChange={(event) =>
                            updateStaff(entry.staffId, {
                              endTime: event.target.value,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={sectionClass}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <CalendarOff size={19} className="mt-0.5 text-emerald-700" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Time off & exceptions
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Add holidays, vacations, blocked dates, or unavailable
                    periods.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {availability.exceptions.length > 0 && (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {availability.exceptions.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {entry.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {entry.type} · {entry.date}
                          {entry.endDate ? ` – ${entry.endDate}` : ""}
                          {entry.allDay
                            ? " · All day"
                            : ` · ${entry.startTime}–${entry.endTime}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAvailability((current) => ({
                            ...current,
                            exceptions: current.exceptions.filter(
                              (item) => item.id !== entry.id,
                            ),
                          }))
                        }
                        aria-label={`Remove ${entry.title}`}
                        className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                <label className="text-xs font-medium text-slate-500 lg:col-span-2">
                  Name
                  <input
                    value={exceptionDraft.title}
                    onChange={(event) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        title: event.target.value,
                      })
                    }
                    placeholder="e.g. Annual maintenance"
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Type
                  <select
                    value={exceptionDraft.type}
                    onChange={(event) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        type: event.target.value as ExceptionType,
                      })
                    }
                    className={fieldClass}
                  >
                    <option>Holiday</option>
                    <option>Vacation</option>
                    <option>Blocked date</option>
                    <option>Unavailable period</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Date
                  <input
                    type="date"
                    value={exceptionDraft.date}
                    onChange={(event) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        date: event.target.value,
                      })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Through
                  <input
                    type="date"
                    min={exceptionDraft.date || undefined}
                    value={exceptionDraft.endDate}
                    onChange={(event) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        endDate: event.target.value,
                      })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={exceptionDraft.allDay}
                    onChange={(event) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        allDay: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-emerald-700"
                  />
                  All day
                </label>
                <button
                  type="button"
                  disabled={
                    !exceptionDraft.title.trim() || !exceptionDraft.date
                  }
                  onClick={addException}
                  className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>
              {!exceptionDraft.allDay && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-500">
                    From
                    <input
                      type="time"
                      value={exceptionDraft.startTime}
                      onChange={(event) =>
                        setExceptionDraft({
                          ...exceptionDraft,
                          startTime: event.target.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-500">
                    To
                    <input
                      type="time"
                      value={exceptionDraft.endTime}
                      onChange={(event) =>
                        setExceptionDraft({
                          ...exceptionDraft,
                          endTime: event.target.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
              )}
            </div>
          </section>

          <section className={sectionClass}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <SlidersHorizontal
                  size={19}
                  className="mt-0.5 text-emerald-700"
                />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Booking rules
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Control lead time, booking horizon, cancellations, and slot
                    spacing.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
              {(
                [
                  ["minAdvanceHours", "Minimum advance booking", "hours", 0],
                  ["maxAdvanceDays", "Maximum booking window", "days", 1],
                  [
                    "cancellationCutoffHours",
                    "Cancellation cutoff",
                    "hours",
                    0,
                  ],
                  ["bookingIntervalMinutes", "Booking interval", "minutes", 5],
                  ["bufferMinutes", "Buffer between bookings", "minutes", 0],
                ] as const
              ).map(([key, label, unit, min]) => (
                <label key={key} className="text-sm font-medium text-slate-700">
                  {label}
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min={min}
                      value={availability.rules[key]}
                      onChange={(event) =>
                        setAvailability((current) => ({
                          ...current,
                          rules: {
                            ...current.rules,
                            [key]: Math.max(min, Number(event.target.value)),
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-16 text-sm outline-none focus:border-emerald-600"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {unit}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <Clock3 size={19} className="mt-0.5 text-emerald-700" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Resources{" "}
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      Optional
                    </span>
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Track bookable rooms, equipment, courts, or other capacity.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {availability.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="grid items-center gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_7rem_auto_auto]"
                >
                  <input
                    aria-label="Resource name"
                    value={resource.name}
                    onChange={(event) =>
                      setAvailability((current) => ({
                        ...current,
                        resources: current.resources.map((item) =>
                          item.id === resource.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Resource type"
                    value={resource.type}
                    onChange={(event) =>
                      setAvailability((current) => ({
                        ...current,
                        resources: current.resources.map((item) =>
                          item.id === resource.id
                            ? { ...item, type: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Resource quantity"
                    type="number"
                    min={1}
                    value={resource.quantity}
                    onChange={(event) =>
                      setAvailability((current) => ({
                        ...current,
                        resources: current.resources.map((item) =>
                          item.id === resource.id
                            ? {
                                ...item,
                                quantity: Math.max(
                                  1,
                                  Number(event.target.value),
                                ),
                              }
                            : item,
                        ),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={resource.enabled}
                      onChange={(event) =>
                        setAvailability((current) => ({
                          ...current,
                          resources: current.resources.map((item) =>
                            item.id === resource.id
                              ? { ...item, enabled: event.target.checked }
                              : item,
                          ),
                        }))
                      }
                      className="h-4 w-4 accent-emerald-700"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    aria-label={`Remove ${resource.name}`}
                    onClick={() => removeResource(resource.id)}
                    className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_7rem_auto]">
                <input
                  aria-label="New resource name"
                  value={resourceDraft.name}
                  onChange={(event) =>
                    setResourceDraft({
                      ...resourceDraft,
                      name: event.target.value,
                    })
                  }
                  placeholder="Resource name"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
                <select
                  aria-label="Resource type"
                  value={resourceDraft.type}
                  onChange={(event) =>
                    setResourceDraft({
                      ...resourceDraft,
                      type: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option>Room</option>
                  <option>Equipment</option>
                  <option>Court</option>
                  <option>Other</option>
                </select>
                <input
                  aria-label="Resource quantity"
                  type="number"
                  min={1}
                  value={resourceDraft.quantity}
                  onChange={(event) =>
                    setResourceDraft({
                      ...resourceDraft,
                      quantity: Math.max(1, Number(event.target.value)),
                    })
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  disabled={!resourceDraft.name.trim()}
                  onClick={addResource}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Plus size={15} />
                  Add resource
                </button>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" className="text-sm text-slate-600">
              {message}
            </p>
            <button
              type="submit"
              disabled={saving || !business}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save availability"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

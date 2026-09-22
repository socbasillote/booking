import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { addBookingNotification } from "../lib/notifications";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

type BusinessService = {
  id: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  description?: string;
};

type BookingEntry = {
  date: string;
  time: string;
  court?: string;
};

type BusinessData = {
  business: {
    name: string;
    description?: string;
    openHour?: string;
    closeHour?: string;
    slotsPerHour?: number;
    slotIntervalMinutes?: number;
    isOpen24Hours?: boolean;
    courtsCount?: number;
    disabledCourts?: string[];
  };
  services: BusinessService[];
  bookings?: BookingEntry[];
};

type Confirmation = {
  booking: { confirmationCode: string; status: string };
  qr?: string;
  emailDelivered?: boolean;
  checkoutUrl?: string;
};

type ChosenSlot = {
  date: string;
  court: string;
  time: string;
};

const isValidBookingTime = (
  value: string,
  slotIntervalMinutes = 30,
  openHour = "00:00",
) => {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return false;

  const selectedMinutes = minutesFromTime(value);
  const startMinutes = minutesFromTime(openHour);
  return (
    selectedMinutes >= startMinutes &&
    (selectedMinutes - startMinutes) % slotIntervalMinutes === 0
  );
};

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getSlots(
  openHour = "08:00",
  closeHour = "20:00",
  slotIntervalMinutes = 30,
) {
  const start = minutesFromTime(openHour);
  const end = minutesFromTime(closeHour);
  const interval = Math.max(15, Number(slotIntervalMinutes) || 30);
  const slots: string[] = [];

  for (let minute = start; minute < end; minute += interval) {
    const hour = Math.floor(minute / 60) % 24;
    const minuteOfHour = minute % 60;
    slots.push(
      `${String(hour).padStart(2, "0")}:${String(minuteOfHour).padStart(2, "0")}`,
    );
  }

  return slots;
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateOptions(daysAhead = 45) {
  const dates: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    dates.push(dateKeyFromDate(next));
  }

  return dates;
}

export function PublicBookingPage() {
  const { slug = "maria-studio" } = useParams();
  const [data, setData] = useState<BusinessData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCourt, setSelectedCourt] = useState<string>("Court 1");
  const [selectedSlots, setSelectedSlots] = useState<ChosenSlot[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("PayMongo");
  const [courtPage, setCourtPage] = useState(0);
  const bookingFormRef = useRef<HTMLFormElement | null>(null);
  const dateScrollerRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartScrollLeft = useRef(0);
  const dragThreshold = 8;
  const isDraggingDatesRef = useRef(false);

  const courtsCount = Math.max(1, Number(data?.business?.courtsCount ?? 3));
  const disabledCourtSet = new Set(data?.business?.disabledCourts ?? []);
  const allCourtNames = Array.from(
    { length: courtsCount },
    (_, index) => `Court ${index + 1}`,
  );
  const availableCourtNames = allCourtNames.filter(
    (court) => !disabledCourtSet.has(court),
  );
  const activeCourt = availableCourtNames.includes(selectedCourt)
    ? selectedCourt
    : (availableCourtNames[0] ?? "Court 1");

  const slotIntervalMinutes = Number(data?.business?.slotIntervalMinutes ?? 30);
  const allSlots = getSlots(
    data?.business?.openHour ?? "08:00",
    data?.business?.closeHour ?? "20:00",
    slotIntervalMinutes,
  );

  function isDateFullyBooked(date: string) {
    const dayBookings = (data?.bookings ?? []).filter(
      (entry) => entry.date === date,
    );
    return (
      allSlots.length > 0 &&
      allSlots.every((slot) => dayBookings.some((entry) => entry.time === slot))
    );
  }

  function chooseDate(date: string) {
    const nextCourt = availableCourtNames[0] ?? "Court 1";

    setSelectedDate(date);
    setSelectedSlots([]);
    setSelectedCourt(nextCourt);
    setCourtPage(0);
  }

  function continueToDetails() {
    setError("");

    if (!selectedDate) {
      setError("Choose a date first.");
      return;
    }

    if (selectedSlots.length === 0) {
      setError("Choose at least one time slot to continue.");
      return;
    }

    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToPayment() {
    setError("");

    const form = bookingFormRef.current;
    if (!form) return;

    const detailFields = ["customer", "email", "phone", "paymentMethod"];

    const detailsAreValid = detailFields.every((name) => {
      const field = form.elements.namedItem(name);

      return field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
        ? field.checkValidity()
        : false;
    });

    if (!detailsAreValid) {
      form.reportValidity();
      return;
    }

    setActiveStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    apiRequest<BusinessData>(`/public/${slug}`)
      .then((payload) => {
        setData(payload);
        const firstAvailable =
          getDateOptions(45)[0] ?? dateKeyFromDate(new Date());
        const allowedCourtNames = Array.from(
          { length: Math.max(1, Number(payload.business?.courtsCount ?? 3)) },
          (_, index) => `Court ${index + 1}`,
        ).filter(
          (court) => !(payload.business?.disabledCourts ?? []).includes(court),
        );
        setSelectedDate(firstAvailable);
        setSelectedCourt(allowedCourtNames[0] ?? "Court 1");
        setSelectedSlots([]);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Booking page unavailable",
        ),
      );
  }, [slug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      const date = selectedDate || String(form.get("date") ?? "");
      if (!selectedDate || !date) {
        throw new Error("Choose a booking date first.");
      }
      if (selectedSlots.length === 0) {
        throw new Error("Choose at least one time slot.");
      }

      selectedSlots.forEach((slot) => {
        if (disabledCourtSet.has(slot.court)) {
          throw new Error(`Court ${slot.court} is currently unavailable.`);
        }

        if (
          !isValidBookingTime(
            slot.time,
            slotIntervalMinutes,
            data?.business?.openHour ?? "08:00",
          )
        ) {
          throw new Error(
            `Choose booking times in ${slotIntervalMinutes}-minute steps.`,
          );
        }
      });

      const selectedPaymentMethod = String(
        form.get("paymentMethod") ?? paymentMethod,
      );
      const payment =
        selectedPaymentMethod === "PayMongo" ? "Unpaid" : "Unpaid";

      const payload = {
        customer: String(form.get("customer")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        service: String(data?.services[0]?.name ?? "Court booking"),
        staff: "Maria",
        date,
        slots: selectedSlots.map((slot) => ({
          court: slot.court,
          time: slot.time,
        })),
        payment,
        paymentMethod: selectedPaymentMethod,
      };

      const next = await apiRequest<Confirmation>(`/public/${slug}/bookings`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      addBookingNotification({
        customer: payload.customer,
        date,
        time: selectedSlots[0]?.time,
      });
      if (next.checkoutUrl) {
        window.location.assign(next.checkoutUrl);
        return;
      }
      setConfirmation(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef6ed] p-4">
        <div className="w-full max-w-md rounded-4xl border border-emerald-900/10 bg-white p-8 text-center shadow-sm">
          <div className="mb-7 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
            {["Date & Time, Court", "Details", "Payment"].map(
              (label, index) => (
                <span key={label} className="flex items-center gap-2">
                  {index > 0 && <span className="text-emerald-300">→</span>}
                  <span className="flex items-center gap-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300 text-emerald-950">
                      ✓
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </span>
              ),
            )}
          </div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lime-200 text-emerald-800">
            ✓
          </div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
            Booking received
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {confirmation.booking.status === "Pending"
              ? "Your booking is awaiting admin approval. We will email you once it is approved."
              : "Your booking is confirmed. Your confirmation details are below."}
          </p>
          <img
            src={confirmation.qr}
            alt="Booking confirmation QR code"
            className="mx-auto mt-5 h-48 w-48 rounded-2xl border border-emerald-900/10 bg-white p-2"
          />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Code:{" "}
            <strong className="text-slate-950">
              {confirmation.booking.confirmationCode}
            </strong>
          </p>
          {!confirmation.emailDelivered && (
            <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
              Email delivery is not configured yet. Save this QR code for your
              appointment.
            </p>
          )}
          <button
            onClick={() => {
              setConfirmation(null);
              setActiveStep(1);
              setError("");
            }}
            className="mt-6 rounded-2xl border border-emerald-900/20 bg-white px-5 py-2.5 text-sm font-black text-slate-900 transition hover:bg-emerald-950 hover:text-white"
          >
            Make another booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef6ed] text-slate-900">
      <HeaderComponent />

      <main className="bg-[#eef6ed]">
        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-8 text-center">
            <div className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
              Court booking
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-slate-950">
              Reserve your court
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500">
              Pick your date and time first, then choose an available court.
            </p>
          </div>

          <div className="mb-5 rounded-3xl border border-emerald-900/10 bg-white px-4 py-4 shadow-sm shadow-emerald-900/5 sm:px-6">
            <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]">
              {[
                [1, "Date, Time & Court"],
                [2, "Details"],
                [3, "Payment"],
              ].map(([step, label]) => {
                const stepNumber = Number(step);
                const complete = stepNumber < activeStep;
                const current = stepNumber === activeStep;

                return (
                  <div
                    key={stepNumber}
                    className={`flex min-w-0 items-center gap-2 ${
                      current || complete
                        ? "text-emerald-950"
                        : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                        complete
                          ? "bg-lime-300 text-emerald-950"
                          : current
                            ? "bg-emerald-950 text-lime-300"
                            : "border border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {complete ? "✓" : stepNumber}
                    </span>

                    <span className="hidden truncate sm:inline">{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden="true">
              {[1, 2].map((step) => (
                <span
                  key={step}
                  className={`h-1 rounded-full ${
                    activeStep > step
                      ? "bg-lime-300"
                      : activeStep === step
                        ? "bg-emerald-950"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <form
            ref={bookingFormRef}
            onSubmit={submit}
            className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-sm shadow-emerald-900/10"
          >
            {/* =========================================================
        STEP 1 — DATE, TIME, & COURT
    ========================================================= */}
            <div
              hidden={activeStep !== 1}
              className="border-b border-emerald-900/10 p-5 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-black text-lime-300">
                  1
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                        Step 1 · Date, Time, & Court
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">
                        Choose your date and time
                      </h3>
                    </div>

                    {selectedDate && (
                      <span className="rounded-full bg-emerald-950 px-4 py-2 text-xs font-black text-lime-300">
                        {new Date(
                          `${selectedDate}T00:00:00`,
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div
                    ref={dateScrollerRef}
                    onPointerDown={(
                      event: React.PointerEvent<HTMLDivElement>,
                    ) => {
                      const target = event.target as HTMLElement | null;
                      if (target?.closest("button")) return;

                      const el = dateScrollerRef.current;
                      if (!el) return;

                      dragStartX.current = event.clientX;
                      dragStartScrollLeft.current = el.scrollLeft;
                      isDraggingDatesRef.current = false;
                      el.setPointerCapture(event.pointerId);
                      el.style.cursor = "grabbing";
                    }}
                    onPointerMove={(event) => {
                      if (dragStartX.current === null) return;

                      const el = dateScrollerRef.current;
                      if (!el) return;

                      const delta = event.clientX - dragStartX.current;
                      if (Math.abs(delta) > dragThreshold) {
                        isDraggingDatesRef.current = true;
                        el.scrollLeft = dragStartScrollLeft.current - delta;
                      }
                    }}
                    onPointerUp={() => {
                      dragStartX.current = null;
                      isDraggingDatesRef.current = false;
                      if (dateScrollerRef.current) {
                        dateScrollerRef.current.style.cursor = "grab";
                      }
                    }}
                    onPointerLeave={() => {
                      dragStartX.current = null;
                      isDraggingDatesRef.current = false;
                      if (dateScrollerRef.current) {
                        dateScrollerRef.current.style.cursor = "grab";
                      }
                    }}
                    onPointerCancel={() => {
                      dragStartX.current = null;
                      isDraggingDatesRef.current = false;
                      if (dateScrollerRef.current) {
                        dateScrollerRef.current.style.cursor = "grab";
                      }
                    }}
                    className="mt-5 flex cursor-grab gap-2 overflow-x-auto pb-2 scroll-smooth"
                  >
                    {getDateOptions(45).map((date) => {
                      const booked = isDateFullyBooked(date);
                      const isActive = selectedDate === date;

                      const display = new Date(
                        `${date}T00:00:00`,
                      ).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                      const [weekday, monthDay] = display.split(",");

                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={booked}
                          onClick={() => chooseDate(date)}
                          className={`min-w-[110px] shrink-0 rounded-2xl border px-3 py-3 text-center transition ${
                            isActive
                              ? "border-emerald-950 bg-emerald-950 text-lime-300 shadow-md"
                              : "border-emerald-900/10 bg-[#eef6ed] text-slate-700 hover:border-emerald-950 hover:bg-lime-50"
                          } ${booked ? "cursor-not-allowed opacity-35" : ""}`}
                        >
                          <span className="block text-[10px] font-black uppercase tracking-wider">
                            {weekday}
                          </span>

                          <span className="mt-1 block text-sm font-black">
                            {monthDay}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="hidden"
                    name="date"
                    value={selectedDate}
                    required
                  />
                </div>
              </div>
            </div>

            {/* =========================================================
        STEP 1 — COURT & TIME
    ========================================================= */}
            <div
              hidden={activeStep !== 1}
              className={`border-b border-emerald-900/10 bg-[#fbfdf9] p-5 sm:p-7 ${
                !selectedDate ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                      Available courts & times
                    </h3>
                  </div>

                  <span className="rounded-full bg-[#eef6ed] px-4 py-2 text-xs font-black text-slate-600">
                    {availableCourtNames.length} available
                  </span>
                </div>

                {!selectedDate ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-emerald-900/15 bg-[#eef6ed] px-4 py-5 text-center">
                    <p className="text-sm font-bold text-slate-500">
                      Select a date first.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 
                Replace these with state:
                const [courtPage, setCourtPage] = useState(0)
              */}
                    {(() => {
                      const courtsPerPage = 4;
                      const totalPages = Math.ceil(
                        allCourtNames.length / courtsPerPage,
                      );

                      const currentPage = Math.min(
                        courtPage,
                        Math.max(0, totalPages - 1),
                      );

                      const visibleCourts = allCourtNames.slice(
                        currentPage * courtsPerPage,
                        currentPage * courtsPerPage + courtsPerPage,
                      );

                      return (
                        <>
                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleCourts.map((court) => {
                              const isDisabled = disabledCourtSet.has(court);
                              const isSelected =
                                !isDisabled && activeCourt === court;

                              if (isDisabled) {
                                return (
                                  <div
                                    key={court}
                                    className="rounded-3xl border border-slate-200 bg-slate-100 p-4 opacity-70"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                          Court
                                        </p>
                                        <h4 className="mt-1 text-lg font-black text-slate-500">
                                          {court}
                                        </h4>
                                      </div>

                                      <span className="rounded-full bg-slate-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-700">
                                        Off
                                      </span>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-200/80 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                                      Under maintenance
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={court}
                                  className={`rounded-3xl border p-4 transition ${
                                    isSelected
                                      ? "border-emerald-950 bg-emerald-950 shadow-md"
                                      : "border-emerald-900/10 bg-[#eef6ed]"
                                  }`}
                                >
                                  {/* Court header */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p
                                        className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                          isSelected
                                            ? "text-lime-300"
                                            : "text-emerald-700"
                                        }`}
                                      >
                                        Court
                                      </p>

                                      <h4
                                        className={`mt-1 text-lg font-black ${
                                          isSelected
                                            ? "text-white"
                                            : "text-slate-950"
                                        }`}
                                      >
                                        {court}
                                      </h4>
                                    </div>

                                    {isSelected && (
                                      <div className="rounded-full bg-lime-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-950">
                                        Selected
                                      </div>
                                    )}
                                  </div>

                                  {/* Time slots */}
                                  <div className="relative mt-4">
                                    {/* Scrollable time area */}
                                    <div
                                      className="
              court-time-scroll max-h-[24rem] overflow-y-auto overscroll-contain pr-1
            "
                                    >
                                      <div className="space-y-2">
                                        {allSlots.map((slot) => {
                                          const isBooked = (
                                            data?.bookings ?? []
                                          ).some(
                                            (entry) =>
                                              entry.date === selectedDate &&
                                              entry.time === slot &&
                                              entry.court === court,
                                          );

                                          const exists = selectedSlots.some(
                                            (entry) =>
                                              entry.date === selectedDate &&
                                              entry.court === court &&
                                              entry.time === slot,
                                          );

                                          return (
                                            <button
                                              key={`${court}-${slot}`}
                                              type="button"
                                              disabled={isBooked}
                                              onClick={() => {
                                                setSelectedCourt(court);

                                                const nextSlot = {
                                                  date: selectedDate,
                                                  court,
                                                  time: slot,
                                                };

                                                setSelectedSlots((current) => {
                                                  const found = current.some(
                                                    (entry) =>
                                                      entry.date ===
                                                        selectedDate &&
                                                      entry.court === court &&
                                                      entry.time === slot,
                                                  );

                                                  if (found) {
                                                    return current.filter(
                                                      (entry) =>
                                                        !(
                                                          entry.date ===
                                                            selectedDate &&
                                                          entry.court ===
                                                            court &&
                                                          entry.time === slot
                                                        ),
                                                    );
                                                  }

                                                  return [...current, nextSlot];
                                                });
                                              }}
                                              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-black transition ${
                                                exists
                                                  ? "border-lime-300 bg-lime-300 text-emerald-950"
                                                  : isSelected
                                                    ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                                                    : "border-emerald-900/10 bg-white text-slate-700 hover:border-emerald-950 hover:bg-lime-50"
                                              } ${
                                                isBooked
                                                  ? "cursor-not-allowed opacity-35 line-through"
                                                  : ""
                                              }`}
                                            >
                                              <span>{slot}</span>

                                              <span className="text-[9px] uppercase tracking-wider opacity-60">
                                                {isBooked
                                                  ? "Booked"
                                                  : exists
                                                    ? "Added"
                                                    : "Available"}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Bottom fade indicates more times below */}
                                    {allSlots.length > 8 && (
                                      <div
                                        className={`pointer-events-none absolute bottom-0 left-0 right-1 h-10 rounded-b-2xl bg-gradient-to-t ${
                                          isSelected
                                            ? "from-emerald-950 to-transparent"
                                            : "from-[#eef6ed] to-transparent"
                                        }`}
                                      />
                                    )}
                                  </div>

                                  {/* Scroll hint */}
                                  {allSlots.length > 8 && (
                                    <div
                                      className={`mt-2 text-center text-[9px] font-black uppercase tracking-[0.16em] ${
                                        isSelected
                                          ? "text-lime-300/70"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      Scroll for more times ↓
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination only when 5+ courts */}
                          {allCourtNames.length >= 5 && (
                            <div className="mt-5 flex items-center justify-between border-t border-emerald-900/10 pt-4">
                              <button
                                type="button"
                                disabled={currentPage === 0}
                                onClick={() =>
                                  setCourtPage((page) => Math.max(0, page - 1))
                                }
                                className="rounded-xl border border-emerald-900/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                ← Previous
                              </button>

                              <div className="flex items-center gap-2">
                                {Array.from(
                                  { length: totalPages },
                                  (_, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => setCourtPage(index)}
                                      className={`h-8 min-w-8 rounded-full px-2 text-xs font-black transition ${
                                        currentPage === index
                                          ? "bg-emerald-950 text-lime-300"
                                          : "bg-[#eef6ed] text-slate-600 hover:bg-lime-50"
                                      }`}
                                    >
                                      {index + 1}
                                    </button>
                                  ),
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={currentPage === totalPages - 1}
                                onClick={() =>
                                  setCourtPage((page) =>
                                    Math.min(totalPages - 1, page + 1),
                                  )
                                }
                                className="rounded-xl border border-emerald-900/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                <input
                  type="hidden"
                  name="court"
                  value={activeCourt}
                  required
                />

                <div className="sticky bottom-3 z-10 mt-5 rounded-3xl border border-emerald-900/10 bg-[#eef6ed]/95 p-4 shadow-lg shadow-emerald-950/10 backdrop-blur sm:static sm:bg-[#eef6ed] sm:shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        Booking summary
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {selectedDate
                          ? new Date(
                              `${selectedDate}T00:00:00`,
                            ).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })
                          : "Choose a date"}
                      </p>
                    </div>
                    <span className="text-right text-xs font-black text-slate-500">
                      {selectedSlots.length} slot
                      {selectedSlots.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSlots.length > 0 ? (
                      selectedSlots.map((entry) => (
                        <span
                          key={`${entry.date}-${entry.court}-${entry.time}`}
                          className="rounded-full bg-emerald-950 px-3 py-1.5 text-xs font-black text-lime-300"
                        >
                          {entry.court} · {entry.time}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-slate-500">
                        Select a time below to continue.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={continueToDetails}
                  disabled={!selectedDate || selectedSlots.length === 0}
                  className="mt-6 w-full rounded-2xl bg-emerald-950 px-4 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-lime-300 transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to details
                </button>
              </div>
            </div>

            {/* =========================================================
        STEP 2 — DETAILS
    ========================================================= */}
            <div
              className="border-b border-emerald-900/10 p-5 sm:p-7"
              hidden={activeStep !== 2}
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-black text-lime-300">
                  2
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step 2 · Details
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Your booking details
                  </h3>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Tell us who the booking is for.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Booking summary
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {selectedDate
                    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                        undefined,
                        { weekday: "long", month: "long", day: "numeric" },
                      )
                    : "Date not selected"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSlots.map((entry) => (
                    <span
                      key={`${entry.date}-${entry.court}-${entry.time}`}
                      className="rounded-full bg-emerald-950 px-3 py-1.5 text-xs font-black text-lime-300"
                    >
                      {entry.court} · {entry.time}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Full name
                  <input
                    name="customer"
                    required
                    minLength={2}
                    className="mt-2 w-full rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700"
                  />
                </label>

                <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Email for confirmation
                  <input
                    name="email"
                    required
                    type="email"
                    className="mt-2 w-full rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700"
                  />
                </label>

                <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Phone number
                  <input
                    name="phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    placeholder="+63 917 123 4567"
                    className="mt-2 w-full rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700"
                  />
                </label>

                <label className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                  Payment method
                  <select
                    name="paymentMethod"
                    required
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700"
                  >
                    <option value="PayMongo">PayMongo online checkout</option>
                    <option value="Cash">Pay at the club</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-emerald-900/10 bg-[#eef6ed] px-4 py-3">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Booking total
                </span>
                <span className="text-lg font-black text-emerald-950">
                  PHP{" "}
                  {(
                    (data?.services[0]?.price ?? 0) * selectedSlots.length
                  ).toLocaleString()}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-lime-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={continueToPayment}
                  className="rounded-2xl bg-emerald-950 px-4 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-lime-300 transition hover:bg-slate-950"
                >
                  Continue to payment
                </button>
              </div>
            </div>

            {/* =========================================================
        STEP 3 — PAYMENT
    ========================================================= */}
            <div className="bg-[#eef6ed] p-5 sm:p-7" hidden={activeStep !== 3}>
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-black text-lime-300">
                  3
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step 3 · Payment
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Choose how you will pay
                  </h3>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-900/10 bg-white px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Total amount
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-950">
                  PHP{" "}
                  {(
                    (data?.services[0]?.price ?? 0) * selectedSlots.length
                  ).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSlots.length} court time
                  {selectedSlots.length === 1 ? "" : "s"} · {paymentMethod}
                </p>
              </div>

              {error && (
                <p className="mt-4 text-sm font-bold text-red-600">{error}</p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-lime-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    busy || !data || !selectedDate || selectedSlots.length === 0
                  }
                  className="rounded-2xl bg-emerald-950 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-lime-300 shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Booking…" : "Confirm booking"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      <FooterComponent />
    </div>
  );
}

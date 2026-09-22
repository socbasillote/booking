import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type BusinessSettings = {
  business: {
    id?: string;
    name: string;
    slug: string;
    description?: string;
    openHour?: string;
    closeHour?: string;
    slotsPerHour?: number;
    slotIntervalMinutes?: number;
    isOpen24Hours?: boolean;
    courtsCount?: number;
    disabledCourts?: string[];
    settings?: {
      payments?: {
        paymongo?: {
          configured?: boolean;
          keyLast4?: string;
        };
      };
    };
  } | null;
};

export function SettingsPage() {
  const [business, setBusiness] = useState<BusinessSettings["business"] | null>(
    null,
  );
  const [openHour, setOpenHour] = useState("08:00");
  const [closeHour, setCloseHour] = useState("20:00");
  const [slotsPerHour, setSlotsPerHour] = useState(2);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(30);
  const [isOpen24Hours, setIsOpen24Hours] = useState(false);
  const [courtsCount, setCourtsCount] = useState(3);
  const [disabledCourts, setDisabledCourts] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymongoSecretKey, setPaymongoSecretKey] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);

  const courtOptions = Array.from(
    { length: Math.max(1, courtsCount) },
    (_, index) => `Court ${index + 1}`,
  );

  function sanitizeDisabledCourts(value: string[], nextCourtCount: number) {
    const valid = Array.from(
      { length: Math.max(1, nextCourtCount) },
      (_, index) => `Court ${index + 1}`,
    );

    return [
      ...new Set(value.map((court) => court.trim()).filter(Boolean)),
    ].filter((court) => valid.includes(court));
  }

  function updateCourtCount(nextCount: number) {
    setCourtsCount(nextCount);
    setDisabledCourts((current) => sanitizeDisabledCourts(current, nextCount));
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiRequest<BusinessSettings>("/business/");
        const saved = data.business;
        if (saved) {
          setBusiness(saved);
          const nextOpenHour = saved.openHour ?? "08:00";
          const nextCloseHour = saved.closeHour ?? "20:00";
          setOpenHour(nextOpenHour);
          setCloseHour(nextCloseHour);
          setSlotsPerHour(saved.slotsPerHour ?? 2);
          setSlotIntervalMinutes(saved.slotIntervalMinutes ?? 30);
          setIsOpen24Hours(
            Boolean(saved.isOpen24Hours) ||
              (nextOpenHour === "00:00" && nextCloseHour === "23:30"),
          );
          setCourtsCount(saved.courtsCount ?? 3);
          setDisabledCourts(saved.disabledCourts ?? []);
        }
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Unable to load settings",
        );
      }
    }
    void loadSettings();
  }, []);

  async function saveBusinessHours(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const normalizedDisabledCourts = sanitizeDisabledCourts(
        disabledCourts,
        courtsCount,
      );
      setDisabledCourts(normalizedDisabledCourts);

      const normalizedOpenHour = isOpen24Hours ? "00:00" : openHour;
      const normalizedCloseHour = isOpen24Hours ? "23:30" : closeHour;

      const payload = {
        name: business?.name ?? "Maria Studio",
        slug: business?.slug ?? "maria-studio",
        description: business?.description ?? "",
        openHour: normalizedOpenHour,
        closeHour: normalizedCloseHour,
        slotsPerHour,
        slotIntervalMinutes,
        isOpen24Hours,
        courtsCount,
        disabledCourts: normalizedDisabledCourts,
        settings: {
          booking: {
            slotsPerHour,
            slotIntervalMinutes,
            courtsCount,
            isOpen24Hours,
          },
        },
      };

      const response = await apiRequest<{
        business: BusinessSettings["business"];
      }>("/business/", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response?.business) {
        setBusiness(response.business);
        setDisabledCourts(response.business.disabledCourts ?? []);
      }

      setStatus("Business hours updated");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to update hours");
    } finally {
      setBusy(false);
    }
  }

  async function savePaymentSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!paymongoSecretKey.trim()) {
      setPaymentStatus("Paste a PayMongo secret key before saving.");
      return;
    }

    setPaymentBusy(true);
    setPaymentStatus("");
    try {
      const response = await apiRequest<{
        business: BusinessSettings["business"];
      }>("/business/", {
        method: "PUT",
        body: JSON.stringify({
          name: business?.name ?? "Maria Studio",
          slug: business?.slug ?? "maria-studio",
          description: business?.description ?? "",
          settings: {
            payments: {
              paymongo: { secretKey: paymongoSecretKey.trim() },
            },
          },
        }),
      });

      setBusiness(response.business);
      setPaymongoSecretKey("");
      setPaymentStatus("PayMongo is connected and ready for online bookings.");
    } catch (err) {
      setPaymentStatus(
        err instanceof Error ? err.message : "Unable to save payment settings",
      );
    } finally {
      setPaymentBusy(false);
    }
  }

  const categories = [
    {
      section: "Booking",
      items: [
        "Booking Types",
        "Booking Statuses",
        "Confirmation Rules",
        "Cancellation Rules",
        "Rescheduling Rules",
      ],
    },
    {
      section: "Payments",
      items: [
        "Payment Types",
        "Payment Statuses",
        "Deposit Rules",
        "Payment Due Dates",
        "Refund Rules",
      ],
    },
    {
      section: "Notifications",
      items: [
        "Booking Confirmation",
        "Payment Reminders",
        "Booking Reminders",
        "Cancellation",
        "Follow-ups",
      ],
    },
    {
      section: "Automation",
      items: [
        "Auto-confirm",
        "Auto-cancel",
        "Payment Overdue",
        "No-show",
        "Follow-up",
      ],
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your studio profile and preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="page-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Profile
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Studio name</span>
              <span className="font-medium text-slate-900">
                {business?.name ?? "Maria Studio"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Booking page</span>
              <span className="font-medium text-slate-900">
                /book/{business?.slug ?? "maria-studio"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Currency</span>
              <span className="font-medium text-slate-900">PHP</span>
            </div>
          </div>
        </section>

        <section className="page-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Appointment reminders</span>
              <span className="font-medium text-slate-900">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Online booking</span>
              <span className="font-medium text-slate-900">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timezone</span>
              <span className="font-medium text-slate-900">Asia/Manila</span>
            </div>
          </div>
        </section>
      </div>

      <section className="page-card min-w-0 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Opening Hours
            </h2>
          </div>
          <button
            type="submit"
            form="business-settings-form"
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>

        <form
          id="business-settings-form"
          onSubmit={saveBusinessHours}
          className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm font-medium text-slate-700">
            Open hours
            <select
              value={isOpen24Hours ? "24" : "custom"}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === "24") {
                  setIsOpen24Hours(true);
                  setOpenHour("00:00");
                  setCloseHour("23:30");
                  return;
                }

                setIsOpen24Hours(false);
                setOpenHour("08:00");
                setCloseHour("20:00");
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <option value="custom">Custom</option>
              <option value="24">24 Hours</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Open
            <input
              type="time"
              step="1800"
              value={isOpen24Hours ? "00:00" : openHour}
              onChange={(event) => setOpenHour(event.target.value)}
              disabled={isOpen24Hours}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Close
            <input
              type="time"
              step="1800"
              value={isOpen24Hours ? "23:30" : closeHour}
              onChange={(event) => setCloseHour(event.target.value)}
              disabled={isOpen24Hours}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Slots / hour
            <input
              type="number"
              min={1}
              max={12}
              value={slotsPerHour}
              onChange={(event) =>
                setSlotsPerHour(Number(event.target.value) || 1)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Time per slot
            <select
              value={slotIntervalMinutes}
              onChange={(event) =>
                setSlotIntervalMinutes(Number(event.target.value))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Courts
            <select
              value={courtsCount}
              onChange={(event) => updateCourtCount(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <option value={1}>1 court</option>
              <option value={2}>2 courts</option>
              <option value={3}>3 courts</option>
              <option value={4}>4 courts</option>
              <option value={5}>5 courts</option>
            </select>
          </label>
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Settings saved as you update
            </div>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-base font-semibold text-slate-900">
            Court availability
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Disable any court that is under construction or unavailable.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courtOptions.map((court) => {
              const isDisabled = disabledCourts.includes(court);

              return (
                <label
                  key={court}
                  className={[
                    "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                    isDisabled
                      ? "border-slate-200 bg-slate-100 text-slate-400 opacity-75"
                      : "border-slate-200 bg-slate-50 text-slate-700",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{court}</span>
                    {isDisabled && (
                      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Under construction
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isDisabled}
                    onChange={() => {
                      setDisabledCourts((current) =>
                        current.includes(court)
                          ? current.filter((entry) => entry !== court)
                          : [...current, court],
                      );
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {status && <p className="mt-3 text-sm text-slate-600">{status}</p>}
      </section>

      <section className="page-card p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Payment processor
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Connect PayMongo for card, GCash, and Maya checkout payments.
          </p>
        </div>

        <form onSubmit={savePaymentSettings} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            PayMongo secret key
            <input
              type="password"
              value={paymongoSecretKey}
              onChange={(event) => setPaymongoSecretKey(event.target.value)}
              placeholder={
                business?.settings?.payments?.paymongo?.configured
                  ? `Connected (...${business.settings.payments.paymongo.keyLast4 ?? ""})`
                  : "sk_test_..."
              }
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Your key is stored on the server and never shown after saving.
            </p>
            <button
              type="submit"
              disabled={paymentBusy}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentBusy ? "Connecting..." : "Connect PayMongo"}
            </button>
          </div>
          {paymentStatus && (
            <p className="text-sm text-slate-600">{paymentStatus}</p>
          )}
        </form>
      </section>

      <section className="page-card p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Automation Center
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category.section}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                  {category.section}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {category.items.length}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span>{item}</span>
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

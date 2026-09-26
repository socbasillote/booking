import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { apiRequest } from "../lib/api";
import { updateUser } from "../features/auth/authSlice";

type BusinessSettings = {
  business: {
    id?: string;
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
  const dispatch = useDispatch();
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [profileStatus, setProfileStatus] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [paymongoSecretKey, setPaymongoSecretKey] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiRequest<BusinessSettings>("/business");
        const saved = data.business;
        if (saved) {
          setBusiness(saved);
          setBusinessName(saved.name);
          setBusinessSlug(saved.slug);
          setCurrency(saved.currency ?? "PHP");
        }
      } catch (err) {
        setProfileStatus(
          err instanceof Error ? err.message : "Unable to load settings",
        );
      }
    }
    void loadSettings();
  }, []);

  async function saveBusinessProfile() {
    if (!business) return;
    setProfileBusy(true);
    setProfileStatus("");
    try {
      const response = await apiRequest<{
        business: BusinessSettings["business"];
      }>("/business", {
        method: "PUT",
        body: JSON.stringify({
          name: businessName.trim(),
          slug: businessSlug.trim(),
          currency,
          description: business.description ?? "",
          timezone: business.timezone ?? "Asia/Manila",
          openHour: business.openHour ?? "08:00",
          closeHour: business.closeHour ?? "20:00",
          slotsPerHour: business.slotsPerHour ?? 2,
          slotIntervalMinutes: business.slotIntervalMinutes ?? 30,
          isOpen24Hours: business.isOpen24Hours ?? false,
          courtsCount: business.courtsCount ?? 1,
          disabledCourts: business.disabledCourts ?? [],
        }),
      });
      if (response.business) {
        setBusiness(response.business);
        setBusinessName(response.business.name);
        setBusinessSlug(response.business.slug);
        setCurrency(response.business.currency ?? "PHP");
        dispatch(
          updateUser({
            businessSlug: response.business.slug,
            onboardingComplete: true,
          }),
        );
      }
      setProfileStatus("Business profile updated.");
    } catch (err) {
      setProfileStatus(
        err instanceof Error ? err.message : "Unable to update profile",
      );
    } finally {
      setProfileBusy(false);
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
      }>("/business", {
        method: "PUT",
        body: JSON.stringify({
          name: businessName.trim(),
          slug: businessSlug.trim(),
          currency,
          description: business?.description ?? "",
          timezone: business?.timezone ?? "Asia/Manila",
          openHour: business?.openHour ?? "08:00",
          closeHour: business?.closeHour ?? "20:00",
          slotsPerHour: business?.slotsPerHour ?? 2,
          slotIntervalMinutes: business?.slotIntervalMinutes ?? 30,
          isOpen24Hours: business?.isOpen24Hours ?? false,
          courtsCount: business?.courtsCount ?? 1,
          disabledCourts: business?.disabledCourts ?? [],
          settings: {
            payments: {
              paymongo: { secretKey: paymongoSecretKey.trim() },
            },
          },
        }),
      });

      if (response.business) {
        setBusiness(response.business);
        setBusinessName(response.business.name);
        setBusinessSlug(response.business.slug);
        setCurrency(response.business.currency ?? "PHP");
        dispatch(
          updateUser({
            businessSlug: response.business.slug,
            onboardingComplete: true,
          }),
        );
      }
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

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your business profile and payment processor.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="page-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Profile
          </h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <label className="block">
              <span className="mb-1 block">Studio name</span>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="mb-1 block">Booking slug</span>
              <input
                value={businessSlug}
                onChange={(event) => setBusinessSlug(event.target.value)}
                required
                pattern="[a-z0-9-]+"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            <div className="flex items-center justify-between">
              <span>Booking page</span>
              <span className="font-medium text-slate-900">
                /book/{businessSlug}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-900"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-sm text-slate-600">
              {profileStatus}
            </p>
            <button
              type="button"
              onClick={() => void saveBusinessProfile()}
              disabled={profileBusy || !business}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileBusy ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>
      </div>

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
    </div>
  );
}

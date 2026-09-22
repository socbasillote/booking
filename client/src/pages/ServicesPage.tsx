import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
  duration?: number;
  category?: string;
  description?: string;
  isActive?: boolean;
  onlineBookingEnabled?: boolean;
};

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadServices() {
    try {
      const data = await apiRequest<{ services: Service[] }>("/services/");
      setServices(data.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load services");
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const payload = {
        name: String(form.get("name")),
        description: String(form.get("description") ?? ""),
        price: Number(form.get("price")),
        durationMinutes: Number(form.get("duration")),
        bufferMinutes: 0,
        category: "General",
        isActive: true,
        onlineBookingEnabled: true,
        assignedStaffIds: [],
      };
      await apiRequest<{ service: Service }>("/services/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOpen(false);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save service");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Services
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
        >
          + Add Service
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="page-card min-w-0 p-5">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-900">
                  {service.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {service.onlineBookingEnabled === false
                    ? "Online booking disabled"
                    : "Online booking enabled"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {service.isActive === false ? "Inactive" : "Active"}
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              ₱{Number(service.price ?? 0).toLocaleString()}
            </div>
            <div className="mt-4 text-sm text-slate-600">
              {service.durationMinutes ?? service.duration ?? 0} minutes
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">Add service</h2>
            <div className="mt-5 space-y-4">
              <input
                name="name"
                required
                placeholder="Service name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="description"
                placeholder="Description"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="price"
                required
                min="0"
                type="number"
                placeholder="Price (PHP)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                name="duration"
                required
                min="5"
                type="number"
                placeholder="Duration (minutes)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
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
                {busy ? "Saving..." : "Save service"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

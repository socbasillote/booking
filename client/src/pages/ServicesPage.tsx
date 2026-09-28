import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Clock3, CalendarCheck2 } from "lucide-react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { SkeletonBlock, SkeletonLoader } from "../components/SkeletonLoader";
import { SERVICE_ICONS, serviceIconFor } from "../lib/serviceAppearance";

type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
  duration?: number;
  category?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  onlineBookingEnabled?: boolean;
};

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("PHP");

  async function loadServices() {
    try {
      const data = await apiRequestWithCache<{
        services: Service[];
        currency?: string;
      }>("/services", (cached) => {
        setServices(cached.services ?? []);
        setCurrency(cached.currency ?? "PHP");
        setLoading(false);
      });
      setServices(data.services ?? []);
      setCurrency(data.currency ?? "PHP");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadServices(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);

    try {
      const payload = {
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? ""),
        price: Number(form.get("price")),
        durationMinutes: Number(form.get("duration")),
        bufferMinutes: 0,
        category: String(form.get("category") ?? "General").trim(),
        icon: String(form.get("icon") ?? "court"),
        color: String(form.get("color") ?? "#059669"),
        isActive: form.get("isActive") === "on",
        onlineBookingEnabled: form.get("onlineBookingEnabled") === "on",
        assignedStaffIds: [],
      };

      await apiRequest<{ service: Service }>(
        editingService ? `/services/${editingService.id}` : "/services",
        {
          method: editingService ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setOpen(false);
      setEditingService(null);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save service");
    } finally {
      setBusy(false);
    }
  }

  async function removeService(service: Service) {
    if (!window.confirm(`Delete ${service.name}?`)) return;

    setError("");
    setBusy(true);

    try {
      await apiRequest<{ service: Service }>(`/services/${service.id}`, {
        method: "DELETE",
      });
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete service");
    } finally {
      setBusy(false);
    }
  }

  function openCreateForm() {
    setEditingService(null);
    setOpen(true);
  }

  function openEditForm(service: Service) {
    setEditingService(service);
    setOpen(true);
  }

  function currencyChange(currency: string) {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "yen":
        return "¥";
      default:
        return "₱";
    }
  }

  return (
    <div className="min-w-0 space-y-7 bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Service Management
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Services
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your services, pricing, availability, and online booking.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 sm:w-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Service
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
            !
          </div>
          {error}
        </div>
      )}

      {/* Services */}
      {loading ? (
        <SkeletonLoader label="Loading services">
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, card) => (
              <div
                key={card}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-5 w-2/3" />
                    <SkeletonBlock className="h-4 w-1/2" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <SkeletonBlock className="h-8 w-1/3" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>

                <SkeletonBlock className="mt-6 h-10 w-full" />
              </div>
            ))}
          </div>
        </SkeletonLoader>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Plus size={24} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No services yet
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Add your first service to start managing pricing, duration, and
            online bookings.
          </p>

          <button
            onClick={openCreateForm}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = serviceIconFor(service.icon);

            return (
              <div
                key={service.id}
                className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                {/* Emerald accent */}
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{
                    backgroundColor: service.color ?? "#059669",
                  }}
                />

                <div className="p-5">
                  {/* Top */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          color: service.color ?? "#059669",
                          backgroundColor: `${service.color ?? "#059669"}14`,
                        }}
                      >
                        <Icon size={22} />
                      </span>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-slate-900">
                          {service.name}
                        </h2>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {service.category ?? "General"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        service.isActive === false
                          ? "bg-slate-100 text-slate-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {service.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                      {service.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-6">
                    <div className="text-3xl font-bold tracking-tight text-slate-950">
                      {currencyChange(currency)}
                      {Number(service.price ?? 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600">
                      <Clock3 size={14} className="text-emerald-600" />
                      {service.durationMinutes ?? service.duration ?? 0} minutes
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                        service.onlineBookingEnabled === false
                          ? "bg-slate-50 text-slate-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <CalendarCheck2 size={14} />
                      {service.onlineBookingEnabled === false
                        ? "Booking off"
                        : "Online booking"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditForm(service)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Edit ${service.name}`}
                      title="Edit service"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void removeService(service)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Delete ${service.name}`}
                      title="Delete service"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            key={editingService?.id ?? "new-service"}
            onSubmit={submit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    {editingService ? <Pencil size={18} /> : <Plus size={20} />}
                  </div>

                  <h2 className="text-xl font-bold text-slate-950">
                    {editingService ? "Edit service" : "Add service"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingService
                      ? "Update the service details below."
                      : "Create a new service for your customers."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Service name
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingService?.name ?? ""}
                  placeholder="Service name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <input
                  name="description"
                  defaultValue={editingService?.description ?? ""}
                  placeholder="Description"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                      {currencyChange(currency)}
                    </span>

                    <input
                      name="price"
                      required
                      min="0"
                      type="number"
                      defaultValue={editingService?.price ?? ""}
                      placeholder="Price"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Duration
                  </label>

                  <div className="relative">
                    <input
                      name="duration"
                      required
                      min="5"
                      type="number"
                      defaultValue={
                        editingService?.durationMinutes ??
                        editingService?.duration ??
                        60
                      }
                      placeholder="Duration"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-3 pr-20 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      minutes
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <input
                  name="category"
                  defaultValue={editingService?.category ?? "General"}
                  placeholder="Category"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Icon
                  <select
                    name="icon"
                    defaultValue={editingService?.icon ?? "court"}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    {SERVICE_ICONS.map(({ key, label }) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Color
                  <input
                    name="color"
                    type="color"
                    defaultValue={editingService?.color ?? "#059669"}
                    className="mt-1.5 h-[46px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Active
                    </div>
                    <div className="text-xs text-slate-500">
                      Make this service available to customers.
                    </div>
                  </div>

                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={editingService?.isActive !== false}
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>

                <div className="h-px bg-slate-200" />

                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Available for online booking
                    </div>
                    <div className="text-xs text-slate-500">
                      Allow customers to book this service online.
                    </div>
                  </div>

                  <input
                    name="onlineBookingEnabled"
                    type="checkbox"
                    defaultChecked={
                      editingService?.onlineBookingEnabled !== false
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                </label>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                disabled={busy}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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

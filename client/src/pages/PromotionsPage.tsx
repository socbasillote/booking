import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { SkeletonBlock, SkeletonLoader } from "../components/SkeletonLoader";

type Promotion = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  status: "Draft" | "Scheduled" | "Live" | "Expired";
  startsAt?: string;
  endsAt?: string;
};

const statusStyles: Record<Promotion["status"], string> = {
  Draft: "bg-slate-100 text-slate-700",
  Scheduled: "bg-blue-50 text-blue-700",
  Live: "bg-emerald-50 text-emerald-700",
  Expired: "bg-red-50 text-red-700",
};

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadPromotions() {
    try {
      const data = await apiRequestWithCache<{ promotions: Promotion[] }>(
        "/promotions",
        (cached) => {
          setPromotions(cached.promotions ?? []);
          setLoading(false);
        },
      );
      setPromotions(data.promotions ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load promotions",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPromotions(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get("startsAt") ?? "");
    const endsAt = String(form.get("endsAt") ?? "");
    const payload = {
      code: String(form.get("code") ?? "")
        .trim()
        .toUpperCase(),
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      discountType: String(
        form.get("discountType"),
      ) as Promotion["discountType"],
      discountValue: Number(form.get("discountValue")),
      status: String(form.get("status")) as Promotion["status"],
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      endsAt: endsAt ? new Date(endsAt).toISOString() : "",
    };

    try {
      await apiRequest<{ promotion: Promotion }>(
        editingPromotion ? `/promotions/${editingPromotion.id}` : "/promotions",
        {
          method: editingPromotion ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setOpen(false);
      setEditingPromotion(null);
      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save promotion");
    } finally {
      setBusy(false);
    }
  }

  async function removePromotion(promotion: Promotion) {
    if (!window.confirm(`Delete ${promotion.title}?`)) return;

    setError("");
    setBusy(true);
    try {
      await apiRequest<{ promotion: Promotion }>(
        `/promotions/${promotion.id}`,
        {
          method: "DELETE",
        },
      );
      await loadPromotions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete promotion",
      );
    } finally {
      setBusy(false);
    }
  }

  function openCreateForm() {
    setEditingPromotion(null);
    setOpen(true);
  }

  function openEditForm(promotion: Promotion) {
    setEditingPromotion(promotion);
    setOpen(true);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Promotions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage active promo campaigns.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="w-full shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 sm:w-auto"
        >
          + Create Promotion
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonLoader label="Loading promotions">
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, card) => (
              <div key={card} className="page-card space-y-4 p-5">
                <SkeletonBlock className="h-5 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-2/3" />
                <SkeletonBlock className="h-4 w-1/3" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        </SkeletonLoader>
      ) : (
        <div className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Top coupon section */}
              <div className="relative p-5 pb-6">
                {/* Decorative circles for the perforated edge */}
                <div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-slate-50" />
                <div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-slate-50" />

                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyles[promo.status]}`}
                  >
                    {promo.status}
                  </span>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditForm(promo)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                      aria-label={`Edit ${promo.title}`}
                      title="Edit promotion"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void removePromotion(promo)}
                      disabled={busy}
                      className="rounded-lg border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Delete ${promo.title}`}
                      title="Delete promotion"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Special Offer
                  </p>

                  <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-slate-900">
                    {promo.title}
                  </h2>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                    {promo.description}
                  </p>
                </div>

                {/* Big discount */}
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-black tracking-tight text-emerald-600">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : `₱${promo.discountValue.toLocaleString()}`}
                    </p>

                    <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      {promo.discountType === "percentage"
                        ? "Discount"
                        : "Amount Off"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                      Promo Code
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-extrabold tracking-wider text-emerald-800">
                      {promo.code || "NO CODE"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Perforated divider */}
              <div className="relative border-t-2 border-dashed border-slate-200">
                <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-slate-50" />
                <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-slate-50" />
              </div>

              {/* Coupon footer */}
              <div className="bg-slate-50/70 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Validity
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {promo.startsAt
                        ? new Date(promo.startsAt).toLocaleDateString()
                        : "Any date"}
                      {promo.endsAt
                        ? ` — ${new Date(promo.endsAt).toLocaleDateString()}`
                        : " — No expiry"}
                    </p>
                  </div>

                  {/* Barcode-style decoration */}
                  <div
                    className="flex h-8 items-stretch gap-[2px] opacity-40"
                    aria-hidden="true"
                  >
                    <span className="w-[2px] bg-slate-700" />
                    <span className="w-[1px] bg-slate-700" />
                    <span className="w-[3px] bg-slate-700" />
                    <span className="w-[1px] bg-slate-700" />
                    <span className="w-[2px] bg-slate-700" />
                    <span className="w-[4px] bg-slate-700" />
                    <span className="w-[1px] bg-slate-700" />
                    <span className="w-[2px] bg-slate-700" />
                    <span className="w-[1px] bg-slate-700" />
                    <span className="w-[3px] bg-slate-700" />
                    <span className="w-[2px] bg-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !promotions.length && !error && (
        <div className="page-card p-8 text-center text-sm text-slate-500">
          No promotions yet. Create your first campaign to get started.
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
          <form
            key={editingPromotion?.id ?? "new-promotion"}
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">
              {editingPromotion ? "Edit promotion" : "Create promotion"}
            </h2>
            <div className="mt-5 space-y-4">
              <input
                name="code"
                required
                pattern="[A-Za-z0-9_-]+"
                defaultValue={editingPromotion?.code ?? ""}
                placeholder="Promotion code (e.g. SUMMER20)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase"
              />
              <input
                name="title"
                required
                defaultValue={editingPromotion?.title ?? ""}
                placeholder="Promotion title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <textarea
                name="description"
                required
                defaultValue={editingPromotion?.description ?? ""}
                placeholder="Description"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  name="discountType"
                  defaultValue={editingPromotion?.discountType ?? "percentage"}
                  className="rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                <input
                  name="discountValue"
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  defaultValue={editingPromotion?.discountValue ?? ""}
                  placeholder="Discount"
                  className="rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </div>
              <select
                name="status"
                defaultValue={editingPromotion?.status ?? "Draft"}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <option>Draft</option>
                <option>Scheduled</option>
                <option>Live</option>
                <option>Expired</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-600">
                  Starts
                  <input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={toDateInput(editingPromotion?.startsAt)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Ends
                  <input
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={toDateInput(editingPromotion?.endsAt)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                  />
                </label>
              </div>
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
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-white disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save promotion"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

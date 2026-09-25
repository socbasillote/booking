import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/api";

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
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadPromotions() {
    try {
      const data = await apiRequest<{ promotions: Promotion[] }>("/promotions");
      setPromotions(data.promotions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load promotions");
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
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      discountType: String(form.get("discountType")) as Promotion["discountType"],
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
      await apiRequest<{ promotion: Promotion }>(`/promotions/${promotion.id}`, {
        method: "DELETE",
      });
      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete promotion");
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
          className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
        >
          + Create Promotion
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promo) => (
          <div key={promo.id} className="page-card min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[promo.status]}`}>
                {promo.status}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(promo)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label={`Edit ${promo.title}`}
                  title="Edit promotion"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void removePromotion(promo)}
                  disabled={busy}
                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Delete ${promo.title}`}
                  title="Delete promotion"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h2 className="mt-4 truncate text-xl font-semibold text-slate-900">
              {promo.title}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Code: {promo.code || "Not set"}
            </p>
            <p className="mt-2 min-h-10 text-sm text-slate-500">{promo.description}</p>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {promo.discountType === "percentage" ? `${promo.discountValue}% off` : `₱${promo.discountValue.toLocaleString()} off`}
            </p>
            {(promo.startsAt || promo.endsAt) && (
              <p className="mt-2 text-xs text-slate-500">
                {promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : "Any date"}
                {promo.endsAt ? ` - ${new Date(promo.endsAt).toLocaleDateString()}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      {!promotions.length && !error && (
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

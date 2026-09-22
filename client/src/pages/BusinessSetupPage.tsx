import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export function BusinessSetupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { await apiRequest("/business", { method: "PUT", body: JSON.stringify({ name: form.get("name"), slug: form.get("slug"), description: form.get("description") }) }); navigate("/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save business"); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Business setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Set up your business profile
        </h1>
      </div>

      <form onSubmit={submit} className="page-card p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Business name
            </label>
            <input
              name="name" defaultValue="Maria Studio" required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Business slug
            </label>
            <input
              name="slug" defaultValue="maria-studio" required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Business description
            </label>
            <textarea
              name="description" defaultValue="Modern beauty and wellness services for busy professionals."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Timezone
            </label>
            <select
              defaultValue="Asia/Manila"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            >
              <option>Asia/Manila</option>
              <option>UTC</option>
              <option>America/New_York</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Currency
            </label>
            <select
              defaultValue="PHP"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            >
              <option>PHP</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate("/dashboard")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
            Skip
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
        {error && <p className="mt-3 text-right text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

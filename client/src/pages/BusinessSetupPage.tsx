import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { updateUser } from "../features/auth/authSlice";

export function BusinessSetupPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiRequest<{ business: { slug: string } }>(
        "/business",
        {
          method: "PUT",
          body: JSON.stringify({
            name: String(form.get("name") ?? "").trim(),
            slug: String(form.get("slug") ?? "").trim(),
            description: form.get("description"),
            timezone: form.get("timezone"),
            currency: form.get("currency"),
          }),
        },
      );
      dispatch(
        updateUser({
          businessSlug: response.business.slug,
          onboardingComplete: true,
        }),
      );
      navigate("/dashboard");
    }
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
              name="name" required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Business slug
            </label>
            <input
              name="slug" required pattern="[a-z0-9-]+"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Business description
            </label>
            <textarea
              name="description" required minLength={1}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Timezone
            </label>
            <select
              name="timezone"
              required
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
              name="currency"
              required
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
          <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
        {error && <p className="mt-3 text-right text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { apiRequest, apiRequestWithCache } from "../lib/api";
import { SkeletonBlock, SkeletonLoader } from "../components/SkeletonLoader";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
};

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await apiRequestWithCache<{ users: TeamMember[] }>(
          "/team",
          (cached) => {
            setTeam(cached.users ?? []);
            setLoading(false);
          },
        );
        setTeam(data.users ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load team");
      } finally {
        setLoading(false);
      }
    }

    void loadTeam();
  }, []);

  async function addStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await apiRequest<{ user: TeamMember }>("/team", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      setShowForm(false);
      formElement.reset();

      const data = await apiRequest<{ users: TeamMember[] }>("/team");
      setTeam(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add staff");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Team
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your team members and staff access.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
        >
          + Add Staff
        </button>
      </div>

      {/* Add staff form */}
      {showForm && (
        <form
          onSubmit={addStaff}
          className="page-card grid min-w-0 gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <input
            name="name"
            required
            minLength={2}
            placeholder="Full name"
            className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-300"
          />

          <input
            name="email"
            required
            type="email"
            placeholder="Email address"
            className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-300"
          />

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              name="password"
              required
              minLength={8}
              type="password"
              placeholder="Temporary password"
              className="min-w-0 w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-300"
            />

            <button
              type="submit"
              disabled={busy}
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Team */}
      {loading ? (
        <SkeletonLoader label="Loading team members">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, card) => (
              <div key={card} className="page-card space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-3 w-1/3" />
                  </div>
                </div>
                <SkeletonBlock className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </SkeletonLoader>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.id}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
            >
              {/* Brand accent */}
              <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400" />

              <div className="p-5">
                {/* Profile */}
                <div className="flex min-w-0 items-center gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-100">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>

                    {/* Active indicator */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500"
                      aria-label="Active"
                    />
                  </div>

                  {/* Name / role */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">
                      {member.name}
                    </h3>

                    <span className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-700">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-slate-100" />

                {/* Email */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7.5 12 13l9-5.5M4.5 19.5h15A1.5 1.5 0 0 0 21 18V6a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Email
                    </p>

                    <p className="truncate text-sm font-medium text-slate-700">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

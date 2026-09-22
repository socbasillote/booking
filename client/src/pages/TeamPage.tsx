import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
};

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await apiRequest<{ users: TeamMember[] }>("/team/");
        setTeam(data.users ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load team");
      }
    }

    void loadTeam();
  }, []);

  async function addStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      await apiRequest<{ user: TeamMember }>("/team/", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      setShowForm(false);
      event.currentTarget.reset();

      const data = await apiRequest<{ users: TeamMember[] }>("/team/");
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
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {team.map((member) => (
          <div key={member.id} className="page-card min-w-0 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white sm:h-12 sm:w-12">
                {member.name.slice(0, 1).toUpperCase()}
              </div>

              {/* Name / role */}
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">
                  {member.name}
                </div>

                <div className="text-sm capitalize text-slate-500">
                  {member.role}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mt-4 min-w-0 truncate text-sm text-slate-600">
              {member.email}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

function SocialIcon({ label }: { label: string }) {
  const common =
    "h-9 w-9 rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-lime-300 hover:text-slate-950";

  if (label === "Instagram") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Instagram"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (label === "Facebook") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Facebook"
      >
        <path
          d="M14 8h3V4h-3c-3 0-5 2-5 5v2H7v4h2v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      className={common}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="LinkedIn"
    >
      <path
        d="M4 4h4v16H4zM10 4h4v3h.2c.7-1.3 2.3-2.6 4.8-2.6C20.4 4.4 21 7 21 9.2V20h-4v-18.8C17 10.2 16.7 10 16.2 10H14v10h-4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HomePage() {
  const navLinks = ["Club", "Courts", "Programs", "Events", "Reviews", "About"];

  const pickupPrograms = [
    {
      title: "Open Play",
      copy: "Drop into friendly court sessions and meet players across every pace and style.",
      icon: "01",
    },
    {
      title: "Court Rentals",
      copy: "Reserve a court fast, bring your crew, and book your next match before the lights fade.",
      icon: "02",
    },
    {
      title: "Private Clinics",
      copy: "Warm up with coaches, improve match control, and build smarter pickleball habits.",
      icon: "03",
    },
  ];

  const reviews = [
    {
      name: "Avery Morgan",
      text: "The court setup is incredible and the community is so welcoming.",
    },
    {
      name: "Chris Rivera",
      text: "Fast booking, great coaches, and always a competitive open play night.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eef6ed] text-slate-900">
      <header className="border-b border-emerald-900/10 bg-[#173f2d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-300 bg-lime-300 text-sm font-black text-slate-950 shadow-sm">
              PB
            </span>
            <span className="text-lg font-black tracking-tight">
              PicklePark
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-50 transition hover:text-lime-300"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-bold text-emerald-50 transition hover:bg-white/10"
            >
              Club login
            </Link>
            <Link
              to="/book/maria-studio"
              className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-lime-200"
            >
              Book a court
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-emerald-900/10 bg-[#183f2e] text-white">
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="absolute left-0 top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:py-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-lime-300" />
                <span className="text-xs font-black uppercase tracking-[0.26em] text-lime-200">
                  Pickleball Club
                </span>
              </div>

              <h1 className="mt-6 text-5xl font-black leading-none tracking-[-0.045em] md:text-7xl">
                Rally up your next match.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-emerald-50">
                Reserve a court, join open play, and book your next pickleball
                session with a club built for social energy and sharp
                competition.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/book/maria-studio"
                  className="rounded-2xl bg-lime-300 px-7 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-lime-200"
                >
                  Book a court
                </Link>
                <a
                  href="#programs"
                  className="rounded-2xl border border-white/30 px-7 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Explore programs
                </a>
              </div>

              <div className="mt-9 flex flex-wrap gap-6">
                {[
                  ["28+", "Indoor Courts"],
                  ["02", "Training Nights"],
                  ["7d", "Weekly Play"],
                ].map(([number, label]) => (
                  <div key={label}>
                    <div className="text-3xl font-black text-white">
                      {number}
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="relative">
              <div className="rounded-4xl border border-lime-300/30 bg-white/8 p-2 shadow-2xl shadow-slate-950/50 backdrop-blur">
                <div className="rounded-[1.7rem] bg-[#eaf7d7] p-5 text-slate-900">
                  <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                        Court schedule
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-950">
                        Today at PicklePark
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-lime-300">
                      Live
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ["07:30", "Court 01", "Morning Open Play", "Open"],
                      ["12:00", "Court 03", "Women’s Doubles", "Booked"],
                      ["18:30", "Court 02", "League Night", "Open"],
                      ["20:00", "Court 05", "Skill Clinic", "Open"],
                    ].map(([time, court, session, state], idx) => (
                      <div
                        key={court}
                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-emerald-700">
                            {time}
                          </span>
                          <div>
                            <div className="text-sm font-black text-slate-900">
                              {court}
                            </div>
                            <div className="text-[11px] font-bold text-slate-500">
                              {session}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${idx === 1 ? "bg-slate-900 text-white" : "bg-lime-200 text-emerald-900"}`}
                        >
                          {state}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ["Booked", "08"],
                      ["Open", "12"],
                      ["Players", "66"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-emerald-900/10 bg-white p-3 text-center"
                      >
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {label}
                        </div>
                        <div className="mt-2 text-lg font-black text-slate-900">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-emerald-900/10 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Pickleball every day
            </div>
            <div className="flex flex-wrap items-center gap-8">
              {navLinks.map((item) => (
                <span
                  key={item}
                  className="text-xs font-black uppercase tracking-[0.18em] text-slate-500"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eef6ed] py-12">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Partner courts", "06"],
                ["Weekly events", "24"],
                ["Club rating", "4.9"],
                ["Court availability", "Today"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-emerald-900/10 bg-white px-5 py-5"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    {label}
                  </div>
                  <div className="mt-3 text-3xl font-black text-slate-950">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="programs" className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
                Club programs
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-slate-950">
                Find your pickleball rhythm.
              </h2>
            </div>
            <Link
              to="/book/maria-studio"
              className="rounded-2xl border border-emerald-900/20 bg-white px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-emerald-950 hover:text-white"
            >
              Reserve a court
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pickupPrograms.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-emerald-900/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950 text-xs font-black text-lime-300">
                    {feature.icon}
                  </span>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Pickleball
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-black text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#183f2e] py-16 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-[0.95fr,1.05fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-lime-300">
                Why pickleball
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.03em]">
                Easy to learn. Hard to put down.
              </h2>
              <p className="mt-5 max-w-xl text-emerald-50">
                From first-time players to league regulars, our club is designed
                around warm courts, helpful coaching, and social energy that
                keeps everyone moving through the game.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  ["Skill clinics", "Weekly"],
                  ["League play", "Saturdays"],
                  ["Court sharing", "Indoor"],
                  ["Community", "Local"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/8 p-5"
                  >
                    <div className="text-2xl font-black text-white">
                      {value}
                    </div>
                    <div className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-lime-300/30 bg-white/10 p-4 shadow-2xl shadow-black/30">
              <div className="rounded-[1.7rem] bg-white p-6 text-slate-950">
                <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                      League table
                    </div>
                    <div className="mt-2 text-2xl font-black">
                      Club match board
                    </div>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ["01", "Court 03", "Doubles night", "4:30 PM"],
                    ["02", "Training", "Skills clinic", "6:15 PM"],
                    ["03", "Social", "Mixer play", "7:00 PM"],
                    ["04", "League", "Division A", "Friday"],
                  ].map(([number, label, details, time]) => (
                    <div
                      key={number}
                      className="flex items-center justify-between rounded-2xl bg-[#eef6ed] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950 text-[10px] font-black text-lime-300">
                          {number}
                        </span>
                        <span>
                          <span className="block text-sm font-black text-slate-900">
                            {label}
                          </span>
                          <span className="block text-[11px] font-bold text-slate-500">
                            {details}
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="grid gap-8 md:grid-cols-[1fr,0.8fr]">
            <div className="rounded-4xl border border-emerald-900/10 bg-white p-8">
              <div className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
                Club stories
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-slate-950">
                Pickleball, community, and shared momentum.
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600">
                Every court becomes a place for first serves, friendly rivalry,
                and local connection. Whether you are learning the dink or
                chasing a league match, your next session starts here.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-900/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-900">
                  Beginner friendly
                </span>
                <span className="rounded-full border border-emerald-900/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-900">
                  Leagues
                </span>
                <span className="rounded-full border border-emerald-900/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-900">
                  Coaching
                </span>
              </div>
            </div>

            <div className="rounded-4xl border border-emerald-900/10 bg-[#183f2e] p-8 text-white">
              <div className="text-xs font-black uppercase tracking-[0.26em] text-lime-300">
                Sponsor
              </div>
              <div className="mt-5 text-5xl font-black tracking-[-0.03em]">
                Brand X
              </div>
              <p className="mt-4 text-sm leading-7 text-emerald-50">
                Proudly supporting weekly court nights, player development, and
                local pickleball energy.
              </p>
              <div className="mt-7 rounded-2xl bg-lime-300 px-4 py-3 text-center text-sm font-black text-slate-950">
                Club partner since 2026
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="rounded-3xl border border-emerald-900/10 bg-white p-7"
              >
                <div className="flex items-center gap-1 text-lime-600">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg
                      key={index}
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3 7 7 .8-5 5 1.5 7-5.5-3-5.5 3 1.5-7-5-5 7-.8z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  “{review.text}”
                </p>
                <div className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {review.name}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-900/10 bg-[#173f2d] text-emerald-50">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-wrap items-center justify-between gap-10">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-300 bg-lime-300 text-sm font-black text-slate-950">
                PB
              </span>
              <span className="text-lg font-black tracking-tight text-white">
                PicklePark
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-5 text-xs font-black uppercase tracking-[0.18em]">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="transition hover:text-lime-300"
                >
                  {link}
                </a>
              ))}
              <a href="#" className="transition hover:text-lime-300">
                About us
              </a>
              <a href="#" className="transition hover:text-lime-300">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              {["Instagram", "Facebook", "LinkedIn"].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="inline-flex items-center justify-center"
                >
                  <SocialIcon label={label} />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
            <span>© 2026 PicklePark</span>
            <span className="text-lime-300">
              Open play • Club courts • Leagues
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

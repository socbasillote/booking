import React from "react";
import { Link } from "react-router-dom";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

function EventPage() {
  return (
    <div>
      <HeaderComponent />
      <section className="bg-[#183f2e] text-white">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-lime-300">
                What's Happening
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
              Play.
              <br />
              Compete.
              <br />
              Repeat.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-emerald-50">
              From casual open play to competitive tournaments, there's always
              something happening on the court.
            </p>
          </div>

          <div className="mt-20 space-y-4">
            {[
              {
                date: "18",
                month: "SEP",
                title: "Friday Open Play",
                type: "OPEN PLAY",
                time: "7:00 PM — 10:00 PM",
              },
              {
                date: "21",
                month: "SEP",
                title: "Beginner Rally Night",
                type: "COMMUNITY",
                time: "6:00 PM — 8:00 PM",
              },
              {
                date: "27",
                month: "SEP",
                title: "Weekend Club Tournament",
                type: "TOURNAMENT",
                time: "9:00 AM — 3:00 PM",
              },
            ].map((event) => (
              <div
                key={event.title}
                className="group grid gap-6 rounded-3xl border border-white/10 bg-white/[0.05] p-6 transition hover:bg-lime-300 hover:text-slate-950 md:grid-cols-[100px_1fr_auto] md:items-center"
              >
                <div>
                  <div className="text-5xl font-black leading-none">
                    {event.date}
                  </div>
                  <div className="mt-1 text-xs font-black tracking-[0.2em] text-lime-300 group-hover:text-emerald-900">
                    {event.month}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                    {event.type}
                  </div>

                  <h2 className="mt-2 text-2xl font-black md:text-3xl">
                    {event.title}
                  </h2>
                </div>

                <div className="text-sm font-bold md:text-right">
                  {event.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-lime-300 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.26em]">
              Don't Miss Out
            </span>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Your next match starts here.
            </h2>
          </div>

          <Link
            to="/book/maria-studio"
            className="w-fit rounded-2xl bg-[#183f2e] px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
          >
            Reserve Your Court
          </Link>
        </div>
      </section>
      <FooterComponent />
    </div>
  );
}

export default EventPage;

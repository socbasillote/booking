import React from "react";
import { Link } from "react-router-dom";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

function ClubPage() {
  return (
    <div>
      <HeaderComponent />
      <section className="relative overflow-hidden bg-[#183f2e] text-white">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-lime-200">
                The Club
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
              More than a court.
              <br />
              Find your people.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-emerald-50 md:text-xl">
              A place to play hard, meet new people, and keep coming back for
              the next rally. Whether you're picking up a paddle for the first
              time or chasing your next competitive match, there's a place for
              you here.
            </p>
          </div>

          <div className="mt-20 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Open Play",
                text: "Drop in, rotate in, and meet players at your level. No long-term commitment required.",
              },
              {
                number: "02",
                title: "Community",
                text: "Connect with players, make friends, and become part of a club that keeps the energy going.",
              },
              {
                number: "03",
                title: "Level Up",
                text: "Improve your game through organized play, friendly competition, and opportunities to learn.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm"
              >
                <div className="text-sm font-black text-lime-300">
                  {item.number}
                </div>

                <h2 className="mt-16 text-3xl font-black tracking-tight">
                  {item.title}
                </h2>

                <p className="mt-4 leading-7 text-emerald-100/80">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f2f5ed] text-[#183f2e]">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 md:px-8 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">
                Built to Play
              </span>
            </div>

            <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
              Come for the game.
              <br />
              Stay for the vibe.
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-8 text-emerald-950/70">
            <p>
              Pickleball is better when there's a great community around it. Our
              club is designed to make playing easy, social, and genuinely fun.
            </p>

            <p>
              Reserve your own court, jump into open play, bring your friends,
              or meet someone new. You don't need to know everyone when you
              arrive.
            </p>

            <Link
              to="/book/maria-studio"
              className="inline-flex rounded-2xl bg-[#183f2e] px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
            >
              Book a Court
            </Link>
          </div>
        </div>
      </section>
      <FooterComponent />
    </div>
  );
}

export default ClubPage;

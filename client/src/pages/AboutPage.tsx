import React from "react";
import { Link } from "react-router-dom";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

function AboutPage() {
  return (
    <div>
      <HeaderComponent />
      <section className="bg-[#f2f5ed] text-[#183f2e]">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <div className="max-w-5xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">
                About the Club
              </span>
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
              A better place
              <br />
              to play.
            </h1>
          </div>

          <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_0.8fr]">
            <div className="text-2xl font-bold leading-relaxed md:text-3xl">
              We believe a great pickleball club should feel like more than a
              place where you rent a court.
            </div>

            <div className="space-y-6 text-lg leading-8 text-emerald-950/70">
              <p>
                It should be somewhere you recognize familiar faces, discover
                new competition, and leave already thinking about your next
                game.
              </p>

              <p>
                That's why we built our club around three simple things: great
                courts, good people, and a reason to keep playing.
              </p>

              <p>
                Whether you're completely new to pickleball or already counting
                points between rallies, you're welcome on our court.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#183f2e] text-white">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <div className="text-6xl font-black text-lime-300">3+</div>
              <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Outdoor Courts
              </div>
            </div>

            <div>
              <div className="text-6xl font-black text-lime-300">24/7</div>
              <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Open
              </div>
            </div>

            <div>
              <div className="text-6xl font-black text-lime-300">∞</div>
              <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Rallies Ahead
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2f5ed]">
        <div className="mx-auto max-w-7xl px-5 py-24 text-center md:px-8 md:py-32">
          <span className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
            Ready to Play?
          </span>

          <h2 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-none tracking-[-0.05em] text-[#183f2e] md:text-7xl">
            Grab a paddle.
            <br />
            We'll see you on court.
          </h2>

          <Link
            to="/book/maria-studio"
            className="mt-10 inline-flex rounded-2xl bg-[#183f2e] px-8 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
          >
            Book a Court
          </Link>
        </div>
      </section>
      <FooterComponent />
    </div>
  );
}

export default AboutPage;

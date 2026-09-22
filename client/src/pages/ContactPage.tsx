import React from "react";
import { Link } from "react-router-dom";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

function ContactPage() {
  return (
    <div>
      <HeaderComponent />
      <section className="relative overflow-hidden bg-[#183f2e] text-white">
        {/* Background glow */}
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          {/* HEADER */}
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-lime-200">
                Get in Touch
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
              Come find us.
              <br />
              Let's talk pickleball.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-emerald-50 md:text-xl">
              Have a question about booking, open play, events, or the club?
              Send us a message or drop by the court. We'd love to hear from
              you.
            </p>
          </div>

          {/* CONTACT + MAP */}
          <div className="mt-20 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* CONTACT CARD */}
            <div className="rounded-[2rem] bg-[#f2f5ed] p-7 text-[#183f2e] md:p-10">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Contact Details
              </span>

              <div className="mt-10 space-y-8">
                {/* LOCATION */}
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Location
                  </div>

                  <p className="mt-2 text-lg font-bold leading-7">
                    Westmont Court
                    <br />
                    Ocean Shore Blvd, Palm Coast
                    <br />
                    FL 32137, United States
                  </p>
                </div>

                {/* PHONE */}
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Phone
                  </div>

                  <a
                    href="tel:+630000000000"
                    className="mt-2 block text-lg font-bold hover:text-emerald-600"
                  >
                    (212) 555-0123
                  </a>
                </div>

                {/* EMAIL */}
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Email
                  </div>

                  <a
                    href="mailto:hello@yourclub.com"
                    className="mt-2 block text-lg font-bold hover:text-emerald-600"
                  >
                    contact@westmont.com
                  </a>
                </div>

                {/* HOURS */}
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Court Hours
                  </div>

                  <div className="mt-2 text-lg font-bold">Open 24/7</div>

                  <p className="mt-1 text-sm text-emerald-950/60">
                    Court availability may vary by booking.
                  </p>
                </div>
              </div>

              <Link
                to="/book/maria-studio"
                className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-[#183f2e] px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
              >
                Book a Court
              </Link>
            </div>

            {/* MAP */}
            <div className="relative min-h-[500px] overflow-hidden rounded-[2rem] bg-[#dce5d7]">
              {/* Replace this iframe src with your actual Google Maps embed URL */}
              <iframe
                title="Pickleball Club Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d17370.146678377194!2d-81.22087961327222!3d29.667379579809474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e696557ed5a08f%3A0x2a5c655a2f369b5c!2sWashington%20Oaks%20Gardens%20State%20Park!5e1!3m2!1sen!2sph!4v1789595785743!5m2!1sen!2sph"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* MAP LABEL */}
              <div
                className="absolute bottom-5 left-5 right-5 z-10"
                id="mapping"
              >
                <div className="rounded-2xl border border-white/20 bg-[#183f2e]/95 p-5 text-white shadow-xl backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                        Find the Club
                      </div>

                      <div className="mt-2 text-xl font-black">Wesmont</div>

                      <div className="mt-1 text-sm text-emerald-100/70">
                        Sample Washington Oaks Gardens State Park
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300 text-[#183f2e]">
                      <span className="text-lg font-black">↗</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* MESSAGE SECTION */}
      <section className="bg-[#f2f5ed] text-[#183f2e]">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.7fr_1fr]">
            {/* TEXT */}
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">
                  Court Booking
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.04em] md:text-6xl">
                {" "}
                Got a question? <br /> We're here.{" "}
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-emerald-950/60">
                Everything you need to know about booking a pickleball court,
                from availability and pricing to cancellations and group play.
              </p>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
              <details
                open
                className="group rounded-2xl bg-white p-6 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  How do I book a pickleball court?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Select your preferred date and time, choose an available
                  court, and complete your booking details. Your reservation is
                  confirmed once the booking process is complete.
                </p>
              </details>

              <details className="group rounded-2xl bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  How long can I book a court for?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Court bookings are available in set time slots. Choose the
                  duration that works best for your group when making your
                  reservation.
                </p>
              </details>

              <details className="group rounded-2xl bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  Can I book a court for a group?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Absolutely. Courts can be booked for casual games, group
                  sessions, and organized play. Make sure your booking includes
                  the correct number of players.
                </p>
              </details>

              <details className="group rounded-2xl bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  Can I cancel or change my booking?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Booking changes and cancellations depend on the applicable
                  cancellation policy. Check the terms provided during checkout
                  for the latest details.
                </p>
              </details>

              <details className="group rounded-2xl bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  What should I bring to play?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Bring comfortable sports clothing, court-appropriate shoes,
                  and plenty of water. If you have your own paddle, feel free to
                  bring it along.
                </p>
              </details>

              <details className="group rounded-2xl bg-white p-6 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-black">
                  Do I need to bring my own paddle and balls?
                  <span className="text-2xl font-normal transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/60">
                  Equipment availability may vary. Check the court details when
                  booking to see whether paddles and balls are provided or
                  available to rent.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
      {/* DIRECTIONS CTA */}
      <section className="bg-lime-300 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.26em]">
              See You on Court
            </span>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Your next rally is waiting.
            </h2>
          </div>

          <a
            href="https://maps.app.goo.gl/WzZzegwM7kFXCvgz7"
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-2xl bg-[#183f2e] px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
          >
            Get Directions ↗
          </a>
        </div>
      </section>
      <FooterComponent />
    </div>
  );
}

export default ContactPage;

import React from "react";
import { Link } from "react-router-dom";
import picklogo from "../../assets/wesmontlogo3.png";
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

function FooterComponent() {
  const navLinks = [
    { nav: "Club", link: "/club" },
    { nav: "Events", link: "/event" },
    { nav: "About Us", link: "/about" },
  ];
  return (
    <footer className="border-t border-emerald-900/10 bg-[#173f2d] text-emerald-50">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-10">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={picklogo}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-5 text-xs font-black uppercase tracking-[0.18em]">
            {navLinks.map((link) => (
              <a
                key={link.nav}
                href={link.link}
                className="transition hover:text-lime-300"
              >
                {link.nav}
              </a>
            ))}
            <a href="/contact" className="transition hover:text-lime-300">
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
          <span>© 2026 Westmont court</span>
          <span className="text-lime-300">
            Open play • Club courts • Leagues
          </span>
        </div>
      </div>
    </footer>
  );
}

export default FooterComponent;

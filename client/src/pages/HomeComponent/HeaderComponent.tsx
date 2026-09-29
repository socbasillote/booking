import { Link } from "react-router-dom";
import picklogo from "../../assets/wesmontlogo3.png";

function HeaderComponent() {
  const navLinks = [
    { nav: "Club", link: "/club" },
    { nav: "Events", link: "/event" },
    { nav: "About Us", link: "/about" },
  ];

  return (
    <>
      <header className="border-b border-emerald-900/10 bg-[#173f2d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={picklogo}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <a
                key={item.nav}
                href={item.link}
                className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-50 transition hover:text-lime-300"
              >
                {item.nav}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div>
              <Link
                to="/login"
                className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-50 transition hover:text-lime-300"
              >
                Login
              </Link>
            </div>
            <Link
              to="/book/westmont"
              className="rounded-full bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-lime-200"
            >
              Book a Court
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export default HeaderComponent;

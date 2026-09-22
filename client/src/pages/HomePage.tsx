import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import pickleballImage from "../assets/whitepaddle.png";
import aerialview from "../assets/aerialview.png";
import courtzoomview from "../assets/courtzoomview.png";
import netview from "../assets/netview2.png";
import morningview from "../assets/morningview.png";
import playerperspective from "../assets/playerperspective2.png";
import pantryview from "../assets/pantryview.png";
import portraittest from "../assets/portraittest.png";
import teamvsteam from "../assets/teamvsteampickle.png";
import footerimage from "../assets/footerimage.png";
import HeaderComponent from "./HomeComponent/HeaderComponent";
import FooterComponent from "./HomeComponent/FooterComponent";

import {
  CalendarCheck2,
  CircleDot,
  CalendarClock,
  BadgeCheck,
  ParkingCircle,
  Utensils,
  UserPlus,
  UsersRound,
  Users,
  Apple,
  GlassWater,
  UserRoundGroup,
} from "lucide-react";

export function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const section = canvas.parentElement as HTMLElement | null;
    const court = section?.querySelector(".court") as HTMLDivElement | null;
    const context = canvas.getContext("2d");
    if (!section || !court || !context) {
      return undefined;
    }

    const resizeCanvas = () => {
      const rect = section.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);
    };

    const getCourtRoutes = () => {
      const sectionRect = section.getBoundingClientRect();
      const courtRect = court.getBoundingClientRect();

      const left = courtRect.left - sectionRect.left;
      const right = courtRect.right - sectionRect.left;
      const top = courtRect.top - sectionRect.top;
      const bottom = courtRect.bottom - sectionRect.top;
      const centerX = courtRect.left - sectionRect.left + courtRect.width / 2;
      const centerY = courtRect.top - sectionRect.top + courtRect.height / 2;

      const routeA = [
        { x: centerX, y: centerY },
        { x: centerX, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: centerX, y: bottom },
        { x: centerX, y: centerY },
      ];

      const routeB = [
        { x: centerX, y: centerY },
        { x: centerX, y: bottom },
        { x: left, y: bottom },
        { x: left, y: top },
        { x: centerX, y: top },
        { x: centerX, y: centerY },
      ];

      return { routeA, routeB };
    };

    const routeLength = (route: Array<{ x: number; y: number }>) => {
      let total = 0;
      for (let i = 1; i < route.length; i += 1) {
        total += Math.sqrt(
          (route[i].x - route[i - 1].x) ** 2 +
            (route[i].y - route[i - 1].y) ** 2,
        );
      }
      return total;
    };

    const distanceBetween = (
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) => Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);

    const pointOnSegment = (
      from: { x: number; y: number },
      to: { x: number; y: number },
      t: number,
    ) => ({
      x: from.x + (to.x - from.x) * clamp(t, 0, 1),
      y: from.y + (to.y - from.y) * clamp(t, 0, 1),
    });

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const colorToRgba = (hex: string, alpha: number) => {
      const value = hex.replace("#", "");
      const bigint = Number.parseInt(
        value.length === 3
          ? value
              .split("")
              .map((c) => c + c)
              .join("")
          : value,
        16,
      );
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const drawRoute = (
      route: Array<{ x: number; y: number }>,
      travelled: number,
      color: string,
    ) => {
      const routeTrack = routeLength(route);
      const highlightLength = routeTrack * 1;
      const start = Math.max(0, travelled - highlightLength);
      const end = Math.min(routeTrack, travelled);

      const segments: Array<{
        from: { x: number; y: number };
        to: { x: number; y: number };
        alpha: number;
      }> = [];
      let cursor = 0;

      for (let i = 1; i < route.length; i += 1) {
        const from = route[i - 1];
        const to = route[i];
        const len = distanceBetween(from, to);
        const segStart = cursor;
        const segEnd = cursor + len;

        if (segEnd < start || segStart > end) {
          cursor = segEnd;
          continue;
        }

        const overlapLeft = Math.max(segStart, start);
        const overlapRight = Math.min(segEnd, end);

        if (overlapLeft >= overlapRight) {
          cursor = segEnd;
          continue;
        }

        const tLeft = clamp(
          (overlapLeft - segStart) / Math.max(len, 0.0001),
          0,
          1,
        );
        const tRight = clamp(
          (overlapRight - segStart) / Math.max(len, 0.0001),
          0,
          1,
        );
        const edgeFrom = pointOnSegment(from, to, tLeft);
        const edgeTo = pointOnSegment(from, to, tRight);

        const alpha = clamp(
          ((overlapRight - start) / Math.max(highlightLength, 0.0001)) * 0.5,
          0,
          1,
        );

        segments.push({ from: edgeFrom, to: edgeTo, alpha });
        cursor = segEnd;
      }

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = color;
      context.shadowBlur = 8;
      context.lineWidth = 4;

      for (const seg of segments) {
        context.strokeStyle = colorToRgba(color, clamp(seg.alpha, 0, 1));
        context.beginPath();
        context.moveTo(seg.from.x, seg.from.y);
        context.lineTo(seg.to.x, seg.to.y);
        context.stroke();
      }

      context.restore();
    };

    resizeCanvas();

    const start = performance.now();
    const cycle = 5000;

    const animate = (now: number) => {
      const routeData = getCourtRoutes();
      const routeALength = routeLength(routeData.routeA);
      const routeBLength = routeLength(routeData.routeB);
      const cyclePosition = ((now - start) % cycle) / cycle;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const distanceA = cyclePosition * routeALength;
      const distanceB = cyclePosition * routeBLength;

      drawRoute(routeData.routeA, distanceA, "#dfffd9");
      drawRoute(routeData.routeB, distanceB, "#d2ffe4");

      window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const navLinks = [
    { nav: "Club", link: "/club" },
    { nav: "Events", link: "/event" },
    { nav: "About Us", link: "/about" },
  ];

  const whyBook = [
    {
      title: "Easy booking",
      copy: "Pick your court, time, and format in minutes.",
      icon: <CalendarCheck2 />,
    },
    {
      title: "Great courts",
      copy: "Play on smooth, well-lit, club-ready courts.",
      icon: <CircleDot />,
    },
    {
      title: "Flexible schedules",
      copy: "Choose open play, league nights, or private sessions.",
      icon: <CalendarClock />,
    },
    {
      title: "Instant confirmation",
      copy: "Get a booking-ready experience from start to finish.",
      icon: <BadgeCheck />,
    },
  ];

  const steps = [
    {
      title: "Choose",
      copy: "Choose your court and preferred session time.",
      icon: "01",
    },
    {
      title: "Book",
      copy: "Confirm your preferred date and booking details.",
      icon: "02",
    },
    {
      title: "Play",
      copy: "Show up ready for your pickleball match.",
      icon: "03",
    },
  ];

  const reviews = [
    {
      name: "Avery Morgan",
      text: "Really simple to book a court and the club crew is always friendly.",
    },
    {
      name: "Chris Rivera",
      text: "The court quality is excellent and I love the open play evenings.",
    },
  ];

  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    {
      src: aerialview,
      alt: "Pickleball court",
    },
    {
      src: playerperspective,
      alt: "Pickleball player",
    },
    {
      src: courtzoomview,
      alt: "Pickleball game",
    },
    {
      src: netview,
      alt: "Pickleball player on court",
    },
    {
      src: morningview,
      alt: "Pickleball players",
    },
    {
      src: pantryview,
      alt: "Pickleball game",
    },
  ];

  const openGallery = (index) => {
    setSelectedImage(index);
  };

  const closeGallery = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    setSelectedImage((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  };

  const previousImage = () => {
    setSelectedImage((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  };

  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowRight") nextImage();
      if (event.key === "ArrowLeft") previousImage();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-[#eef6ed] text-slate-900">
      <HeaderComponent />

      <main>
        {/* HEADER + HERO = 100vh */}
        <section className="relative h-[calc(100vh-73px)] min-h-[600px] overflow-hidden border-b border-emerald-900/10 bg-[#183f2e] text-white">
          <canvas
            ref={canvasRef}
            className="court-canvas"
            aria-label="Pickleball court highlight path"
          />

          <div className="court" aria-hidden="true">
            <span className="kitchen-left" />
            <span className="kitchen-right" />
            <span className="service-left" />
            <span className="service-right" />
            <span className="center-line" />
          </div>

          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="absolute left-0 top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

          {/* HERO CONTENT */}
          <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 py-10 md:px-8 md:py-12">
            {/* TOP LEFT */}
            <div className="relative z-20 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-lime-200">
                  Pickleball Court
                </span>
              </div>

              <h1 className="mt-6 text-left text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
                Rally up your
                <br />
                next match.
              </h1>
            </div>

            {/* CENTER IMAGE */}
            <div className="group absolute left-1/2 top-1/2 z-10 w-[75%] max-w-3xl -translate-x-1/2 -translate-y-1/2 transition-[z-index] duration-300 hover:z-50 md:w-[60%] lg:w-[52%]">
              <img
                src={pickleballImage}
                alt="Pickleball court"
                className="h-auto w-full rounded-3xl transform transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
            </div>

            {/* DESCRIPTION */}
            <p className="relative z-20 mt-auto max-w-xl pb-24 text-left text-lg leading-8 text-emerald-50 md:pb-20">
              Book your court, join open play, and enjoy a friendly club built
              around pickleball energy and connection.
            </p>

            {/* BOTTOM */}
            <div className="absolute bottom-8 left-5 right-5 z-30 flex items-end justify-between md:left-8 md:right-8">
              {/* CTA */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/book/maria-studio"
                  className="group inline-flex items-center gap-4 rounded-full bg-lime-300 px-7 py-4 text-sm font-black text-emerald-950 transition hover:bg-lime-200"
                >
                  Book a Court
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              {/* DATA */}
              <div className="flex flex-wrap justify-end gap-x-10 gap-y-6 text-right">
                {[
                  ["3+", "Outdoor Courts"],
                  ["24/7", "Open"],
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
          </div>
        </section>
        <section className="overflow-hidden bg-[#183f2e] py-6 text-white">
          <div className="flex w-max animate-[marquee_18s_linear_infinite]">
            {[1, 2, 3, 4].map((group) => (
              <div
                key={group}
                className="flex shrink-0 items-center gap-10 pr-10 whitespace-nowrap"
              >
                <span className="text-xl font-black uppercase tracking-wide">
                  SPECIAL PROMO
                </span>

                <span className="text-xl font-black text-lime-300">✦</span>

                <span className="text-xl font-black uppercase tracking-wide">
                  BOOK NOW
                </span>

                <span className="text-xl font-black text-lime-300">✦</span>

                <span className="text-xl font-black uppercase tracking-wide">
                  PLAY & SAVE
                </span>

                <span className="text-xl font-black text-lime-300">✦</span>

                <span className="text-xl font-black uppercase tracking-wide">
                  ENJOY
                </span>

                <span className="text-xl font-black text-lime-300">✦</span>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
    SECTION 1 — GALLERY
========================================================= */}
        <section className="relative overflow-hidden bg-[#f7faf5] py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-5 md:px-8">
            {/* Header */}
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800">
                    Inside the club
                  </span>
                </div>

                <h2 className="max-w-4xl text-5xl font-black leading-[0.88] tracking-[-0.06em] text-emerald-950 md:text-7xl lg:text-8xl">
                  This is where
                  <br />
                  <span className="text-emerald-700">the fun happens.</span>
                </h2>
              </div>

              <div className="lg:pb-2">
                <p className="text-base leading-7 text-slate-500">
                  Real games. Real people. Real energy. Get a feel for the
                  courts before you step onto them.
                </p>

                <button
                  type="button"
                  onClick={() => openGallery(0)}
                  className="mt-5 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-950 transition hover:text-emerald-700"
                >
                  Explore gallery
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 transition group-hover:translate-x-1">
                    ↗
                  </span>
                </button>
              </div>
            </div>

            {/* Editorial Gallery */}
            <div className="mt-14 grid gap-4 md:grid-cols-12 md:grid-rows-[260px_260px_180px]">
              {/* Main */}
              <button
                type="button"
                onClick={() => openGallery(0)}
                className="group relative overflow-hidden rounded-[2rem] bg-emerald-950 text-left md:col-span-7 md:row-span-2"
              >
                <img
                  src={galleryImages[0].src}
                  alt={galleryImages[0].alt}
                  className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />

                <div className="absolute left-6 top-6 md:left-8 md:top-8">
                  <span className="rounded-full bg-lime-300 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                    The main event
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                    Game on
                  </div>

                  <h3 className="mt-2 max-w-lg text-3xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                    Ready when
                    <br />
                    you are.
                  </h3>
                </div>

                <div className="absolute bottom-7 right-7 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-emerald-950 opacity-0 shadow-xl transition duration-300 group-hover:opacity-100">
                  ↗
                </div>
              </button>

              {/* Image 2 */}
              <button
                type="button"
                onClick={() => openGallery(1)}
                className="group relative min-h-[240px] overflow-hidden rounded-[2rem] bg-emerald-950 text-left md:col-span-5"
              >
                <img
                  src={galleryImages[1].src}
                  alt={galleryImages[1].alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute bottom-5 left-5 text-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
                    01
                  </span>
                </div>

                <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-950 opacity-0 transition group-hover:opacity-100">
                  ↗
                </div>
              </button>

              {/* Image 3 */}
              <button
                type="button"
                onClick={() => openGallery(2)}
                className="group relative min-h-[240px] overflow-hidden rounded-[2rem] bg-emerald-950 text-left md:col-span-5"
              >
                <img
                  src={galleryImages[2].src}
                  alt={galleryImages[2].alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute bottom-5 left-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
                    02
                  </span>
                </div>

                <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-950 opacity-0 transition group-hover:opacity-100">
                  ↗
                </div>
              </button>

              {/* Image 4 */}
              <button
                type="button"
                onClick={() => openGallery(3)}
                className="group relative min-h-[180px] overflow-hidden rounded-[2rem] bg-emerald-950 md:col-span-3"
              >
                <img
                  src={galleryImages[3].src}
                  alt={galleryImages[3].alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/30" />

                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-emerald-950 opacity-0 transition group-hover:opacity-100">
                  ↗
                </div>
              </button>

              {/* Image 5 */}
              <button
                type="button"
                onClick={() => openGallery(4)}
                className="group relative min-h-[180px] overflow-hidden rounded-[2rem] bg-emerald-950 md:col-span-3"
              >
                <img
                  src={galleryImages[4].src}
                  alt={galleryImages[4].alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/30" />

                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-emerald-950 opacity-0 transition group-hover:opacity-100">
                  ↗
                </div>
              </button>

              {/* Bottom CTA image */}
              <button
                type="button"
                onClick={() => openGallery(5)}
                className="group relative min-h-[180px] overflow-hidden rounded-[2rem] bg-emerald-950 text-left md:col-span-6"
              >
                <img
                  src={galleryImages[5].src}
                  alt={galleryImages[5].alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-emerald-950/50 transition group-hover:bg-emerald-950/40" />

                <div className="absolute inset-0 flex items-center justify-between p-6 md:p-8">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
                      More than a game
                    </div>

                    <div className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                      Good people.
                      <br />
                      Good energy.
                    </div>
                  </div>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-emerald-950 transition group-hover:scale-110">
                    ↗
                  </span>
                </div>
              </button>
            </div>

            {/* Gallery CTA */}
            <div className="mt-5 flex flex-col justify-between gap-5 rounded-[2rem] bg-lime-300 p-6 md:flex-row md:items-center md:px-8">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.15em] text-emerald-950">
                  Like what you see?
                </div>

                <p className="mt-1 text-sm text-emerald-950/65">
                  Your next game is closer than you think.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-950 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-lime-300 transition hover:bg-emerald-800"
              >
                Book a Court
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================
    FULLSCREEN GALLERY
========================================================= */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/95 p-4 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Pickleball gallery"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeGallery();
              }
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeGallery}
              aria-label="Close gallery"
              className="absolute right-5 top-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-emerald-950 transition hover:bg-lime-300"
            >
              ×
            </button>

            {/* Counter */}
            <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs font-black tracking-[0.18em] text-white backdrop-blur">
              {String(selectedImage + 1).padStart(2, "0")} /{" "}
              {String(galleryImages.length).padStart(2, "0")}
            </div>

            {/* Previous */}
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white backdrop-blur transition hover:border-lime-300 hover:bg-lime-300 hover:text-emerald-950 md:left-8"
            >
              ←
            </button>

            {/* Image */}
            <div className="flex h-full w-full items-center justify-center px-12 py-16 md:px-24">
              <img
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white backdrop-blur transition hover:border-lime-300 hover:bg-lime-300 hover:text-emerald-950 md:right-8"
            >
              →
            </button>

            {/* Caption */}
            <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                {galleryImages[selectedImage].alt}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
    SECTION 2 — WHY BOOK
========================================================= */}
        <section className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-5 md:px-8">
            <div className="grid overflow-hidden rounded-[2.5rem] bg-[#eef6ed] lg:grid-cols-[0.9fr_1.1fr]">
              {/* Content */}
              <div className="flex flex-col justify-between p-7 md:p-12 lg:p-16">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />

                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800">
                      Why book with us
                    </span>
                  </div>

                  <h2 className="mt-6 text-5xl font-black leading-[0.88] tracking-[-0.055em] text-emerald-950 md:text-6xl">
                    Everything
                    <br />
                    you need.
                    <br />
                    <span className="text-emerald-700">Nothing extra.</span>
                  </h2>

                  <p className="mt-7 max-w-lg text-base leading-7 text-slate-600">
                    Show up, play your game, and enjoy the rest. We've made the
                    experience simple from the moment you arrive.
                  </p>
                </div>

                {/* Feature list */}
                <div className="mt-12 border-t border-emerald-950/10">
                  {[
                    ...whyBook,
                    {
                      icon: <ParkingCircle />,
                      title: "Easy Parking",
                      copy: "Convenient parking so you can get from your car to the court without the hassle.",
                    },
                    {
                      icon: <Utensils />,
                      title: "Food & Drinks",
                      copy: "Grab refreshing drinks and food before or after your game.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={feature.title}
                      className="group grid grid-cols-[44px_1fr_auto] items-start gap-4 border-b border-emerald-950/10 py-5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-xs font-black text-lime-300 transition group-hover:bg-lime-300 group-hover:text-emerald-950">
                        {feature.icon}
                      </span>

                      <div>
                        <div className="text-sm font-black uppercase tracking-[0.12em] text-emerald-950">
                          {feature.title}
                        </div>

                        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                          {feature.copy}
                        </p>
                      </div>

                      <span className="pt-1 text-xs font-black text-emerald-950/30">
                        0{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual */}
              <div className="relative min-h-[600px] overflow-hidden bg-emerald-950 lg:min-h-[760px]">
                <img
                  src={portraittest}
                  className="absolute inset-0 h-full w-full object-cover transition duration-1000 hover:scale-105"
                  alt="Pickleball court"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/10 to-transparent" />

                {/* Floating label */}
                <div className="absolute left-6 top-6 md:left-8 md:top-8">
                  <span className="rounded-full bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950">
                    Everything's here
                  </span>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-7 md:p-12">
                  <div className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                    Play. Refresh. Repeat.
                  </div>

                  <h3 className="mt-4 max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-6xl">
                    Get on the court.
                    <br />
                    Stay for the fun.
                  </h3>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {["🅿️ Parking", "🥤 Drinks", "🍔 Food"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* 
                  <div className="mt-7 flex flex-wrap gap-2">
                    {[
                      { icon: <CircleParking />, text: "Parking" },
                      { icon: <GlassWater />, text: "Drinks" },
                      { icon: <Apple />, text: "Food" },
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md"
                      >
                        {item.icon} {item.text}
                      </span>
                    ))}
                  </div>
                  */}

                  <button
                    type="button"
                    className="mt-7 inline-flex items-center gap-3 rounded-full bg-lime-300 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-emerald-950 transition hover:bg-white"
                  >
                    Book a Court
                    <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
    SECTION 3 — HOW IT WORKS
========================================================= */}
        <section className="relative overflow-hidden bg-emerald-950 py-24 text-white md:py-32">
          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />

                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-lime-300">
                    How it works
                  </span>
                </div>

                <h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.05em] md:text-7xl">
                  Three steps.
                  <br />
                  <span className="text-lime-300">That's it.</span>
                </h2>
              </div>

              <p className="max-w-sm text-sm leading-7 text-emerald-100/65 lg:pb-1">
                No complicated process. Pick your court, lock in your time, and
                show up ready to play.
              </p>
            </div>

            {/* Steps */}
            <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="group relative bg-emerald-950 p-7 transition duration-500 hover:bg-[#1d4b37] md:p-10"
                >
                  {/* Number */}
                  <div className="flex items-start justify-between">
                    <span className="text-[5rem] font-black leading-none tracking-[-0.08em] text-white/10 transition duration-500 group-hover:text-lime-300/20 md:text-[7rem]">
                      0{index + 1}
                    </span>

                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-300 text-sm font-black text-emerald-950">
                      {step.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-10">
                    <div className="text-2xl font-black tracking-[-0.02em] text-white md:text-3xl">
                      {step.title}
                    </div>

                    <p className="mt-4 max-w-sm text-sm leading-7 text-emerald-100/60">
                      {step.copy}
                    </p>
                  </div>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <div className="absolute bottom-10 right-8 hidden text-2xl text-lime-300/40 md:block">
                      →
                    </div>
                  )}

                  {/* Bottom accent */}
                  <div className="mt-10 h-1 w-10 rounded-full bg-white/10 transition-all duration-500 group-hover:w-20 group-hover:bg-lime-300" />
                </article>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-lime-300/20 bg-lime-300 p-7 md:flex-row md:items-center md:px-10">
              <div>
                <div className="text-lg font-black tracking-[-0.02em] text-emerald-950">
                  Ready to play?
                </div>

                <p className="mt-1 text-sm text-emerald-950/60">
                  Pick a time and we'll see you on the court.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full bg-emerald-950 px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-lime-300 transition hover:bg-emerald-800"
              >
                Book a Court
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#f7faf5]">
          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 py-24 lg:py-32">
            {/* Header */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-900/10 bg-white px-4 py-2 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800">
                    Pickleball Community
                  </span>
                </div>

                <h2 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                  Find your people.
                  <br />
                  <span className="text-emerald-800">Find your game.</span>
                </h2>

                <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  Pick up a paddle, meet new people, and find a community that
                  makes every game worth showing up for.
                </p>
              </div>

              <Link
                to="/book/maria-studio"
                className="group inline-flex w-fit items-center gap-4 rounded-full bg-emerald-950 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition duration-300 hover:bg-lime-300 hover:text-emerald-950"
              >
                Explore Clubs
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-base transition group-hover:translate-x-1 group-hover:bg-emerald-950/10">
                  →
                </span>
              </Link>
            </div>

            {/* Featured Club */}
            <div className="mt-14 overflow-hidden rounded-[2.75rem] bg-emerald-950 shadow-[0_30px_80px_-30px_rgba(6,78,59,0.35)]">
              <div className="grid lg:grid-cols-[1.15fr,0.85fr]">
                {/* Image */}
                <div className="group relative min-h-120 overflow-hidden lg:min-h-150">
                  <img
                    src={teamvsteam}
                    alt="Group of people playing pickleball together"
                    className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/10 to-transparent" />

                  <div className="absolute left-7 top-7">
                    <span className="inline-flex rounded-full bg-white/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950 backdrop-blur">
                      Featured Club
                    </span>
                  </div>

                  <div className="absolute bottom-8 left-7 right-7 md:bottom-10 md:left-10">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-lime-300">
                      Play together
                    </div>

                    <h3 className="mt-3 max-w-lg text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-5xl">
                      Good games.
                      <br />
                      Better company.
                    </h3>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {["Social games", "All levels", "New friends"].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between p-8 text-white md:p-10 lg:p-12">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
                        01 / Community
                      </span>

                      <span className="text-xs font-bold text-white/20">
                        PICKLEBALL
                      </span>
                    </div>

                    <h3 className="mt-8 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                      More than a court.
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-emerald-50/70">
                      Whether you're playing your first game or already obsessed
                      with the sport, there's a place for you here. Meet
                      players, build friendships, and keep coming back for the
                      next game.
                    </p>

                    {/* Feature list */}
                    <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
                      {[
                        {
                          number: <UserRoundGroup />,
                          title: "Meet New Players",
                          text: "Find people who love the game as much as you do.",
                        },
                        {
                          number: <UsersRound />,
                          title: "Every Skill Level",
                          text: "Beginner, intermediate, or experienced — everyone belongs.",
                        },
                        {
                          number: <Users />,
                          title: "Build Your Crew",
                          text: "Turn casual games into a community you look forward to.",
                        },
                      ].map((item) => (
                        <div
                          key={item.number}
                          className="flex gap-5 py-5 first:pt-6 last:pb-6"
                        >
                          <span className="pt-1 text-[10px] font-black tracking-widest text-lime-300">
                            {item.number}
                          </span>

                          <div>
                            <div className="text-sm font-black text-white">
                              {item.title}
                            </div>
                            <p className="mt-1 text-xs leading-5 text-emerald-50/50">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/book/maria-studio"
                    className="group mt-10 flex items-center justify-between rounded-2xl bg-lime-300 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-emerald-950 transition hover:bg-lime-200"
                  >
                    Join the Club
                    <span className="text-xl transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-24 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.75fr,1.25fr] lg:items-center">
              {/* Intro */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Player Stories
                  </span>
                </div>

                <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.045em] text-slate-950 md:text-5xl">
                  Come for the game.
                  <br />
                  <span className="text-emerald-800">Stay for the people.</span>
                </h2>

                <p className="mt-6 max-w-md text-sm leading-7 text-slate-500">
                  The best part of pickleball isn't always the score. It's the
                  people you meet between games.
                </p>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {["A", "M", "J", "K"].map((letter, index) => (
                      <div
                        key={letter}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-black ${
                          index % 2 === 0
                            ? "bg-lime-300 text-emerald-950"
                            : "bg-emerald-900 text-white"
                        }`}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-sm font-black text-slate-900">
                      Your next crew is here.
                    </div>
                    <div className="text-xs text-slate-500">
                      Friendly games. Real connections.
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((review, index) => (
                  <article
                    key={review.name}
                    className={`rounded-[1.75rem] border border-emerald-900/10 p-6 ${
                      index === 0 ? "bg-[#eef6ed]" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 text-lime-600">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <svg
                            key={starIndex}
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2l3 7 7 .8-5 5 1.5 7-5.5-3-5.5 3 1.5-7-5-5 7-.8z" />
                          </svg>
                        ))}
                      </div>

                      <span className="text-[10px] font-black text-slate-300">
                        5.0
                      </span>
                    </div>

                    <p className="mt-6 text-sm leading-7 text-slate-600">
                      “{review.text}”
                    </p>

                    <div className="mt-6 flex items-center gap-3 border-t border-slate-900/5 pt-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-xs font-black text-lime-300">
                        {review.name.charAt(0)}
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {review.name}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-emerald-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(163,230,53,0.15),transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl px-5 py-24 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[1fr,0.85fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-lime-300">
                    Your next game
                  </span>
                </div>

                <h2 className="mt-6 max-w-2xl text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                  Your next court
                  <br />
                  <span className="text-lime-300">is waiting.</span>
                </h2>

                <p className="mt-7 max-w-xl text-base leading-8 text-emerald-50/65">
                  Reserve your time, bring your people, and make pickleball part
                  of your weekly routine.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    to="/book/maria-studio"
                    className="group inline-flex items-center gap-4 rounded-full bg-lime-300 px-7 py-4 text-sm font-black text-emerald-950 transition hover:bg-lime-200"
                  >
                    Book Your Court
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* Image */}
              <div className="group relative overflow-hidden rounded-[2.5rem]">
                <img
                  src={footerimage}
                  className="h-105 w-full object-cover transition duration-700 group-hover:scale-105 lg:h-130"
                  alt="Players enjoying an active game"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">
                    Play more
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    Make it your game.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterComponent />
    </div>
  );
}

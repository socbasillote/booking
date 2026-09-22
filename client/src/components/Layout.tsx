import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserCircle2,
  Users,
  Megaphone,
} from "lucide-react";
import { logout } from "../features/auth/authSlice";
import type { RootState } from "../store/store";
import {
  activateBookingNotifications,
  getNotifications,
  markNotificationsRead,
  notificationEvent,
  type BookingNotification,
} from "../lib/notifications";

const businessNav = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Bookings", to: "/bookings", icon: BriefcaseBusiness },
  { label: "Customers", to: "/customers", icon: Users },
];

const operationsNav = [
  { label: "Services", to: "/services", icon: Sparkles },
  { label: "Team", to: "/team", icon: UserCircle2 },
  { label: "Availability", to: "/calendar", icon: CalendarDays },
];

const growthNav = [
  { label: "Payments", to: "/bookings", icon: CreditCard },
  { label: "Promotions", to: "/promotions", icon: Megaphone },
  { label: "Reports", to: "/dashboard", icon: LayoutDashboard },
];

const footerNav = [
  { label: "Booking Page", to: "/book/maria-studio", icon: BriefcaseBusiness },
  { label: "Settings", to: "/settings", icon: Settings },
];

const restrictedForStaff = new Set([
  "Team",
  "Promotions",
  "Reports",
  "Settings",
]);

export function Layout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isStaff = user?.role === "staff";
  const [notifications, setNotifications] =
    useState<BookingNotification[]>(getNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const refreshNotifications = () => setNotifications(getNotifications());
    window.addEventListener(notificationEvent, refreshNotifications);
    window.addEventListener("storage", refreshNotifications);
    return () => {
      window.removeEventListener(notificationEvent, refreshNotifications);
      window.removeEventListener("storage", refreshNotifications);
    };
  }, []);

  function openNotifications() {
    setShowNotifications((isOpen) => {
      if (!isOpen) {
        markNotificationsRead();
        setNotifications(getNotifications());
      }
      return !isOpen;
    });
    void activateBookingNotifications();
  }

  return (
    <div className="app-shell flex min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed left-0 top-0 hidden h-screen border-r border-slate-200 bg-white p-3 transition-all duration-200 lg:flex lg:flex-col ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Header */}
        <div
          className={`mb-5 flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <div>
              <div className="mt-1 text-lg font-semibold">Maria Studio</div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="space-y-6 text-sm">
          {/* Business */}
          <div>
            {!isCollapsed && (
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Business
              </div>
            )}

            <div className="space-y-1">
              {businessNav.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={to}
                  title={isCollapsed ? label : undefined}
                  className={({ isActive }) =>
                    `sidebar-item flex items-center rounded-xl py-2 ${
                      isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                    } ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={16} className="shrink-0" />

                  {!isCollapsed && (
                    <span className="leading-none">{label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div>
            {!isCollapsed && (
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Operations
              </div>
            )}

            <div className="space-y-1">
              {operationsNav
                .filter(
                  ({ label }) => !(isStaff && restrictedForStaff.has(label)),
                )
                .map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={label}
                    to={to}
                    title={isCollapsed ? label : undefined}
                    className={({ isActive }) =>
                      `sidebar-item flex items-center rounded-xl py-2 ${
                        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                      } ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={16} className="shrink-0" />

                    {!isCollapsed && (
                      <span className="leading-none">{label}</span>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>

          {/* Growth */}
          <div>
            {!isCollapsed && (
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Growth
              </div>
            )}

            <div className="space-y-1">
              {growthNav
                .filter(
                  ({ label }) => !(isStaff && restrictedForStaff.has(label)),
                )
                .map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={label}
                    to={to}
                    title={isCollapsed ? label : undefined}
                    className={({ isActive }) =>
                      `sidebar-item flex items-center rounded-xl py-2 ${
                        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                      } ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={16} className="shrink-0" />

                    {!isCollapsed && (
                      <span className="leading-none">{label}</span>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        </nav>

        {/* Footer navigation */}
        <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
          {footerNav
            .filter(({ label }) => !(isStaff && restrictedForStaff.has(label)))
            .map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `sidebar-item flex items-center rounded-xl py-2 ${
                    isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } ${isActive ? "active" : ""}`
                }
              >
                <Icon size={16} className="shrink-0" />

                {!isCollapsed && <span className="leading-none">{label}</span>}
              </NavLink>
            ))}
        </div>

        {/* User */}
        <div
          className={`mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {user?.name?.slice(0, 1) ?? "A"}
              </div>

              <button
                onClick={() => dispatch(logout())}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {user?.name?.slice(0, 1) ?? "A"}
                </div>

                <div>
                  <div className="font-medium text-slate-900">
                    {user?.name ?? "Alicia"}
                  </div>

                  <div className="text-xs capitalize text-slate-500">
                    {user?.role ?? "owner"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => dispatch(logout())}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`min-w-0 flex-1 transition-all duration-200 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 lg:px-7">
            {/* Left side */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Mobile menu */}
              <button
                className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              {/* Search */}
              <div className="relative min-w-0 w-full max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300"
                  placeholder="Search bookings or customers"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="relative flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Notifications */}
              <button
                onClick={openNotifications}
                className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Open notifications"
                aria-expanded={showNotifications}
              >
                <Bell size={18} />

                {notifications.some((notification) => !notification.read) && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                    {
                      notifications.filter((notification) => !notification.read)
                        .length
                    }
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <div className="text-sm font-semibold text-slate-900">
                      Notifications
                    </div>

                    <span className="text-xs text-slate-400">
                      {notifications.length} total
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-1 py-5 text-center text-sm text-slate-500">
                      No bookings yet.
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <div className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-500">
                            {notification.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Business settings */}
              {!isStaff && (
                <button
                  onClick={() => navigate("/settings")}
                  className="hidden shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 sm:block"
                >
                  Business Settings
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="min-w-0 p-4 lg:p-7">{children}</div>
      </main>
    </div>
  );
}

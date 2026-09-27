import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  BarChart3,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Globe2,
  LockKeyhole,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserCircle2,
  UserRound,
  Users,
  Megaphone,
  X,
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
  { label: "Availability", to: "/availability", icon: Clock3 },
];

const growthNav = [
  { label: "Payments", to: "/bookings", icon: CreditCard },
  { label: "Promotions", to: "/promotions", icon: Megaphone },
  { label: "Reports", to: "/reports", icon: BarChart3 },
];

const restrictedForStaff = new Set([
  "Team",
  "Promotions",
  "Reports",
  "Settings",
  "Availability",
]);

type UserPreferences = {
  theme: "light" | "dark";
  language: string;
  notifications: {
    bookings: boolean;
    reminders: boolean;
    productUpdates: boolean;
  };
};

type LocalProfile = {
  name: string;
  email: string;
  photo: string;
};

const preferencesKey = "sidebooking_user_preferences";

function getPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(preferencesKey);
    if (saved) {
      return {
        theme: "light",
        language: "en-US",
        notifications: {
          bookings: true,
          reminders: true,
          productUpdates: false,
        },
        ...JSON.parse(saved),
      };
    }
  } catch {
    // Ignore invalid local preferences and use defaults.
  }
  return {
    theme: "light",
    language: "en-US",
    notifications: {
      bookings: true,
      reminders: true,
      productUpdates: false,
    },
  };
}

function getLocalProfile(
  key: string,
  name: string,
  email: string,
): LocalProfile {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : { name, email, photo: "" };
  } catch {
    return { name, email, photo: "" };
  }
}

export function Layout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [userSettingsTab, setUserSettingsTab] = useState<
    "settings" | "profile"
  >("settings");
  const [preferences, setPreferences] =
    useState<UserPreferences>(getPreferences);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isStaff = user?.role === "staff";
  const profileKey = `sidebooking_profile_${user?.id ?? "current"}`;
  const [profile, setProfile] = useState<LocalProfile>(() =>
    getLocalProfile(profileKey, user?.name ?? "Alicia", user?.email ?? ""),
  );
  const [profileSaved, setProfileSaved] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [notifications, setNotifications] =
    useState<BookingNotification[]>(getNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!showUserSettings) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowUserSettings(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showUserSettings]);

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
        <div className="mt-auto space-y-1  pt-2"></div>

        {/* User */}
        <div
          className={`mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setShowUserMenu(true)}
            className={`flex w-full items-center text-left hover:opacity-80 ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
            aria-label="Open user menu"
            aria-haspopup="dialog"
            title={isCollapsed ? profile.name : undefined}
          >
            {profile.photo ? (
              <img
                src={profile.photo}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {profile.name.slice(0, 1) || "A"}
              </div>
            )}

            {!isCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">
                  {profile.name}
                </span>

                <span className="block text-xs capitalize text-slate-500">
                  {user?.role ?? "owner"}
                </span>
              </span>
            )}
          </button>
        </div>
      </aside>

      {showUserMenu && (
        <div
          className="fixed inset-0 z-[60]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowUserMenu(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="User navigation"
            className="absolute bottom-[88px] left-4 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* User header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {profile.name.slice(0, 1) || "A"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {profile.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {profile.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUserMenu(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close user menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation options */}
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setUserSettingsTab("profile");
                  setShowUserSettings(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserRound size={18} />
                </span>

                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Personalization
                  </span>
                  <span className="block text-xs text-slate-500">
                    Manage your personal details
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setUserSettingsTab("settings");
                  setShowUserSettings(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Settings size={18} />
                </span>

                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Settings
                  </span>
                  <span className="block text-xs text-slate-500">
                    Preferences and notifications
                  </span>
                </span>
              </button>

              <div className="my-2 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  dispatch(logout());
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-rose-700 hover:bg-rose-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                  <LogOut size={18} />
                </span>

                <span>
                  <span className="block text-sm font-medium">Log out</span>
                  <span className="block text-xs text-rose-500">
                    Sign out of your account
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      )}

      {showUserSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowUserSettings(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-settings-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="user-settings-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Your account
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preferences and personal details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUserSettings(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close user settings"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200 px-6 pt-4">
              <button
                type="button"
                onClick={() => setUserSettingsTab("settings")}
                className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-medium ${userSettingsTab === "settings" ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                <Settings size={16} /> Settings
              </button>
              <button
                type="button"
                onClick={() => setUserSettingsTab("profile")}
                className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-medium ${userSettingsTab === "profile" ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                <UserRound size={16} /> Personalization
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              {userSettingsTab === "settings" ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Appearance
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(["light", "dark"] as const).map((theme) => {
                        const ThemeIcon = theme === "light" ? Sun : Moon;
                        return (
                          <button
                            key={theme}
                            type="button"
                            onClick={() =>
                              setPreferences((current) => ({
                                ...current,
                                theme,
                              }))
                            }
                            aria-pressed={preferences.theme === theme}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm capitalize ${preferences.theme === theme ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span className="flex items-center gap-2">
                              <ThemeIcon size={16} />
                              {theme}
                            </span>
                            {preferences.theme === theme && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Globe2 size={16} /> Language
                    </span>
                    <select
                      value={preferences.language}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          language: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    >
                      <option value="en-US">English (United States)</option>
                      <option value="en-GB">English (United Kingdom)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </label>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Bell size={16} /> Notifications
                    </h3>
                    <div className="mt-2 divide-y divide-slate-100">
                      {(
                        [
                          ["bookings", "New booking alerts"],
                          ["reminders", "Booking reminders"],
                          ["productUpdates", "Product updates"],
                        ] as const
                      ).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center justify-between gap-4 py-3 text-sm text-slate-700"
                        >
                          {label}
                          <input
                            type="checkbox"
                            checked={preferences.notifications[key]}
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                notifications: {
                                  ...current.notifications,
                                  [key]: event.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 accent-emerald-700"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    {profile.photo ? (
                      <img
                        src={profile.photo}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                        {profile.name.slice(0, 1) || "A"}
                      </div>
                    )}
                    <div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Camera size={16} /> Change photo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1_500_000) {
                              setPhotoError(
                                "Choose an image smaller than 1.5 MB.",
                              );
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setProfile((current) => ({
                                ...current,
                                photo: String(reader.result),
                              }));
                              setPhotoError("");
                              setProfileSaved(false);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {photoError && (
                        <p className="mt-1 text-xs text-rose-700">
                          {photoError}
                        </p>
                      )}
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-slate-700">
                    Full name
                    <input
                      value={profile.name}
                      onChange={(event) => {
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }));
                        setProfileSaved(false);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) => {
                        setProfile((current) => ({
                          ...current,
                          email: event.target.value,
                        }));
                        setProfileSaved(false);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(profileKey, JSON.stringify(profile));
                      setProfileSaved(true);
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Save personal details
                  </button>
                  {profileSaved && (
                    <span className="ml-3 text-sm text-emerald-700">
                      Saved on this device
                    </span>
                  )}

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <LockKeyhole size={16} /> Password
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      Password changes are not supported by the current account
                      API. Your password has not been changed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <span className="text-xs text-slate-500">
                Preferences are saved on this device.
              </span>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </section>
        </div>
      )}

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

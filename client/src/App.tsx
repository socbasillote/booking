import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store, type RootState } from "./store/store";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import "./App.css";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const BookingsPage = lazy(() =>
  import("./pages/BookingsPage").then((module) => ({
    default: module.BookingsPage,
  })),
);
const CustomersPage = lazy(() =>
  import("./pages/CustomersPage").then((module) => ({
    default: module.CustomersPage,
  })),
);
const ServicesPage = lazy(() =>
  import("./pages/ServicesPage").then((module) => ({
    default: module.ServicesPage,
  })),
);
const TeamPage = lazy(() =>
  import("./pages/TeamPage").then((module) => ({ default: module.TeamPage })),
);
const CalendarPage = lazy(() =>
  import("./pages/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  })),
);
const BusinessSetupPage = lazy(() =>
  import("./pages/BusinessSetupPage").then((module) => ({
    default: module.BusinessSetupPage,
  })),
);
const PublicBookingPage = lazy(() =>
  import("./pages/PublicBookingPage").then((module) => ({
    default: module.PublicBookingPage,
  })),
);
const BookingStatusPage = lazy(() =>
  import("./pages/BookingStatusPage").then((module) => ({
    default: module.BookingStatusPage,
  })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const PromotionsPage = lazy(() =>
  import("./pages/PromotionsPage").then((module) => ({
    default: module.PromotionsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const ClubPage = lazy(() => import("./pages/ClubPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

function ProtectedApp() {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route
          path="/team"
          element={
            user?.role === "staff" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <TeamPage />
            )
          }
        />
        <Route
          path="/promotions"
          element={
            user?.role === "staff" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PromotionsPage />
            )
          }
        />
        <Route
          path="/settings"
          element={
            user?.role === "staff" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SettingsPage />
            )
          }
        />
        <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
        <Route path="/onboarding" element={<BusinessSetupPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef6ed] text-sm font-black uppercase tracking-[0.2em] text-emerald-800">
      Loading...
    </div>
  );
}

function ProtectedOnboarding() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? (
    <BusinessSetupPage />
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<ProtectedOnboarding />} />
            <Route path="/book/:slug" element={<PublicBookingPage />} />
            <Route
              path="/status/:confirmationCode"
              element={<BookingStatusPage />}
            />
            <Route path="/" element={<HomePage />} />
            <Route path="/club" element={<ClubPage />} />
            <Route path="/event" element={<EventPage />} />
            <Route path="/About" element={<AboutPage />} />
            <Route path="/Contact" element={<ContactPage />} />
            <Route path="*" element={<ProtectedApp />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

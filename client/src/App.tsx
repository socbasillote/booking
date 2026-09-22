import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store, type RootState } from "./store/store";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { BookingsPage } from "./pages/BookingsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ServicesPage } from "./pages/ServicesPage";
import { TeamPage } from "./pages/TeamPage";
import { CalendarPage } from "./pages/CalendarPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { BusinessSetupPage } from "./pages/BusinessSetupPage";
import { PublicBookingPage } from "./pages/PublicBookingPage";
import { BookingStatusPage } from "./pages/BookingStatusPage";
import { HomePage } from "./pages/HomePage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./App.css";
import ClubPage from "./pages/ClubPage";
import EventPage from "./pages/EventPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

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
      </BrowserRouter>
    </Provider>
  );
}

export default App;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

type BookingStatusData = {
  booking: {
    id: string;
    confirmationCode: string;
    customer: string;
    email: string;
    service: string;
    staff: string;
    date: string;
    time: string;
    payment: "Unpaid" | "Deposit" | "Paid";
    paymentMethod: string;
    status: "Pending" | "Confirmed" | "Completed" | "Rejected";
    business: string;
  };
  qr: string;
  emailDelivered: boolean;
};

export function BookingStatusPage() {
  const { confirmationCode = "" } = useParams();
  const [data, setData] = useState<BookingStatusData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!confirmationCode) {
      return;
    }

    let pollTimer: number | undefined;
    let pollCount = 0;

    async function loadStatus(showLoading = true) {
      if (showLoading) setLoading(true);
      try {
        const payload = await apiRequest<BookingStatusData>(
          `/public/status/${confirmationCode}`,
        );
        setData(payload);

        const waitingForPayMongo =
          payload.booking.paymentMethod === "PayMongo" &&
          payload.booking.payment !== "Paid" &&
          payload.booking.status === "Pending";

        if (waitingForPayMongo && pollCount < 15) {
          pollCount += 1;
          pollTimer = window.setTimeout(() => {
            void loadStatus(false);
          }, 2000);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load booking status",
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    void loadStatus();

    return () => {
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
    };
  }, [confirmationCode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-sm font-medium text-slate-600 shadow-sm">
          Loading booking status...
        </div>
      </div>
    );
  }

  if (error || !confirmationCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-700">
            !
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Booking not found
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {error || "No confirmation code was provided."}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { booking } = data;
  const canShowPayment =
    booking.payment === "Paid" || booking.payment === "Deposit";
  const paymentComplete = booking.payment === "Paid";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-8 py-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                  Booking status
                </div>
                <h1 className="mt-2 text-3xl font-semibold">
                  {booking.business}
                </h1>
              </div>
              <div
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  booking.status === "Rejected"
                    ? "border-red-200 bg-red-100 text-red-700"
                    : booking.status === "Confirmed"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : booking.status === "Completed"
                        ? "border-sky-200 bg-sky-100 text-sky-700"
                        : "border-white/30 bg-white/10 text-white"
                }`}
              >
                {booking.status}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 md:grid-cols-[1.1fr,0.9fr]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Confirmation code
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {booking.confirmationCode}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-900/10 bg-emerald-50 p-4 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                {["Date & Time, Court", "Details", "Payment"].map(
                  (label, index) => (
                    <span key={label} className="flex items-center gap-2">
                      {index > 0 && <span className="text-emerald-300">→</span>}
                      <span className="flex items-center gap-1">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            paymentComplete
                              ? "bg-lime-300 text-emerald-950"
                              : "bg-white text-slate-500"
                          }`}
                        >
                          {paymentComplete ? "✓" : index + 1}
                        </span>
                        <span className="hidden sm:inline">{label}</span>
                      </span>
                    </span>
                  ),
                )}
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Customer
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {booking.customer}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Service
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {booking.service}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Staff
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {booking.staff}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Appointment
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {booking.date} at {booking.time}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Payment
                  </span>
                  <span
                    className={`text-sm font-semibold ${canShowPayment ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {booking.payment}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Method
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {booking.paymentMethod}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  QR confirmation
                </div>
                <img
                  src={data.qr}
                  alt="Booking confirmation QR code"
                  className="mx-auto mt-4 h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                />
                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Booking status
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-900">
                    {booking.payment}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

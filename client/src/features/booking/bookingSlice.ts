import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
};
export type Booking = {
  id: string;
  customer: string;
  email: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Completed" | "Rejected";
  payment: "Unpaid" | "Deposit" | "Paid";
  paymentMethod:
    | "Cash"
    | "Card"
    | "GCash"
    | "Bank transfer"
    | "PayPal"
    | "PayMongo";
};
const defaultServices: Service[] = [
  {
    id: "svc-haircut",
    name: "Haircut",
    price: 500,
    duration: 45,
    active: true,
  },
  {
    id: "svc-color",
    name: "Hair Coloring",
    price: 1500,
    duration: 90,
    active: true,
  },
  { id: "svc-facial", name: "Facial", price: 800, duration: 30, active: true },
  {
    id: "svc-massage",
    name: "Massage",
    price: 1200,
    duration: 60,
    active: true,
  },
];
const defaultBookings: Booking[] = [
  {
    id: "bk-1",
    customer: "Anna Santos",
    email: "anna@example.com",
    service: "Haircut",
    staff: "Maria",
    date: "2026-09-12",
    time: "09:00",
    status: "Confirmed",
    payment: "Paid",
    paymentMethod: "GCash",
  },
  {
    id: "bk-2",
    customer: "Jean Santos",
    email: "jean@example.com",
    service: "Balayage",
    staff: "Rhea",
    date: "2026-09-12",
    time: "10:30",
    status: "Pending",
    payment: "Deposit",
    paymentMethod: "Card",
  },
];
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const slice = createSlice({
  name: "booking",
  initialState: {
    services: read("sidebooking_services", defaultServices),
    bookings: read("sidebooking_bookings", defaultBookings),
  },
  reducers: {
    addService: (
      state,
      action: PayloadAction<Omit<Service, "id" | "active">>,
    ) => {
      state.services.push({
        ...action.payload,
        id: crypto.randomUUID(),
        active: true,
      });
    },
    addBooking: (state, action: PayloadAction<Omit<Booking, "id">>) => {
      state.bookings.unshift({ ...action.payload, id: crypto.randomUUID() });
    },
    updateBooking: (
      state,
      action: PayloadAction<{
        id: string;
        status?: Booking["status"];
        payment?: Booking["payment"];
      }>,
    ) => {
      const item = state.bookings.find(
        (booking) => booking.id === action.payload.id,
      );
      if (item) Object.assign(item, action.payload);
    },
  },
});
export const { addService, addBooking, updateBooking } = slice.actions;
export default slice.reducer;

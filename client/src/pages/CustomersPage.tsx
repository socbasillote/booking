import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "../lib/api";

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  notes?: string;
  createdAt?: string;
};

type Booking = {
  id?: string;
  _id?: string;
  customer: string;
  email: string;
  service: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Completed" | "Rejected";
  payment: "Unpaid" | "Deposit" | "Paid";
  paymentMethod?: string;
  createdAt?: string;
};

type CustomerSummary = Customer & {
  bookings: Booking[];
  lastBooking?: Booking;
  totalSpent: number;
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSummary | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCustomers() {
      try {
        const [customerData, bookingData] = await Promise.all([
          apiRequest<{ customers: Customer[] }>("/customers/"),
          apiRequest<{ bookings: Booking[] }>("/bookings/"),
        ]);
        setCustomers(customerData.customers ?? []);
        setBookings(bookingData.bookings ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load customers",
        );
      }
    }
    void loadCustomers();
  }, []);

  const summaries = useMemo<CustomerSummary[]>(
    () =>
      customers.map((customer) => {
        const customerBookings = bookings.filter((booking) => {
          const sameEmail =
            customer.email && booking.email
              ? customer.email.toLowerCase() === booking.email.toLowerCase()
              : false;
          return (
            sameEmail ||
            booking.customer.toLowerCase() === customer.name.toLowerCase()
          );
        });
        const ordered = [...customerBookings].sort((a, b) =>
          `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
        );

        return {
          ...customer,
          bookings: customerBookings,
          lastBooking: ordered[0],
          totalSpent: customerBookings.reduce(
            (total, booking) =>
              total +
              (booking.payment === "Paid"
                ? 250
                : booking.payment === "Deposit"
                  ? 150
                  : 0),
            0,
          ),
        };
      }),
    [bookings, customers],
  );

  const filteredCustomers = summaries.filter((customer) => {
    const matchesQuery =
      `${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (statusFilter === "all" || (customer.status ?? "active") === statusFilter)
    );
  });

  const newThisMonth = summaries.filter((customer) => {
    if (!customer.createdAt) return false;
    const created = new Date(customer.createdAt);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  function formatDate(value?: string) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Relationships</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep track of your customers and their booking activity.
          </p>
        </div>
        <button
          onClick={() => navigate("/bookings?new=1")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <CalendarPlus size={16} /> Create Booking
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Customers", summaries.length, "All customer records"],
          ["New This Month", newThisMonth, "Recently added"],
          [
            "Active",
            summaries.filter(
              (customer) => (customer.status ?? "active") === "active",
            ).length,
            "Currently active",
          ],
          [
            "Returning",
            summaries.filter((customer) => customer.bookings.length > 1).length,
            "More than one booking",
          ],
        ].map(([label, value, detail]) => (
          <div key={String(label)} className="stat-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-slate-400" />
                  <p className="text-sm text-slate-500">{label}</p>
                </div>

                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {value}
                </p>
                <p className="mt-2 text-xs text-slate-400">{detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Customer",
                  "Contact",
                  "Bookings",
                  "Last booking",
                  "Total spent",
                  "Status",
                  "",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {initials(customer.name)}
                      </div>
                      <span className="font-medium text-slate-900">
                        {customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    <div>{customer.email ?? "No email"}</div>
                    <div className="text-xs">
                      {customer.phone ?? "No phone"}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {customer.bookings.length}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {formatDate(customer.lastBooking?.date)}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900">
                    ₱{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${(customer.status ?? "active") === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {customer.status ?? "active"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-400">
                    <ChevronRight size={17} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No customers match your search.
            </div>
          )}
        </div>
      </div>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-slate-900/30"
          onClick={() => setSelectedCustomer(null)}
        >
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                    {initials(selectedCustomer.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-sm capitalize text-slate-500">
                      {selectedCustomer.status ?? "active"} customer
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer profile"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>
            <button
              onClick={() => navigate("/bookings?new=1")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              <CalendarPlus size={17} /> Create Booking
            </button>

            <section className="mt-7 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Contact information
              </h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  {selectedCustomer.email ?? "No email provided"}
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  {selectedCustomer.phone ?? "No phone provided"}
                </div>
              </div>
            </section>
            <section className="mt-7 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Booking history
              </h3>
              <div className="mt-3 space-y-2">
                {selectedCustomer.bookings.length === 0 ? (
                  <p className="text-sm text-slate-500">No bookings yet.</p>
                ) : (
                  selectedCustomer.bookings.map((booking) => (
                    <div
                      key={
                        booking.id ??
                        booking._id ??
                        `${booking.date}-${booking.time}`
                      }
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {booking.service}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(booking.date)} at {booking.time}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {booking.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
            <section className="mt-7 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">Payments</h3>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <span className="text-sm text-slate-600">Lifetime value</span>
                <span className="font-semibold text-slate-900">
                  ₱{selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Based on recorded deposits and paid bookings.
              </p>
            </section>
            <section className="mt-7 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Internal notes
              </h3>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                {selectedCustomer.notes ||
                  "No internal notes for this customer."}
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

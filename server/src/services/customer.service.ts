import { Customer } from "../models/Customer.js";

export async function syncCustomerFromBooking(input: {
  businessId: string;
  name: string;
  email: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const query = email
    ? { businessId: input.businessId, email }
    : { businessId: input.businessId, name: input.name.trim() };

  return Customer.findOneAndUpdate(
    query,
    {
      $set: {
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() ?? "",
        status: "active",
      },
      $setOnInsert: { notes: "" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export type BookingNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const notificationsKey = "sidebooking_notifications";
const notificationEvent = "sidebooking:notification";

export function getNotifications(): BookingNotification[] {
  try {
    const value = JSON.parse(localStorage.getItem(notificationsKey) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function markNotificationsRead() {
  const notifications = getNotifications().map((notification) => ({
    ...notification,
    read: true,
  }));
  localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  window.dispatchEvent(new Event(notificationEvent));
}

export function addBookingNotification(booking: {
  customer?: string;
  date?: string;
  time?: string;
}) {
  const customer = booking.customer?.trim() || "A customer";
  const date = booking.date ? ` on ${booking.date}` : "";
  const time = booking.time ? ` at ${booking.time}` : "";
  const notification: BookingNotification = {
    id: crypto.randomUUID(),
    title: "New booking",
    message: `${customer} booked${date}${time}.`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const notifications = [notification, ...getNotifications()].slice(0, 20);
  localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  window.dispatchEvent(new Event(notificationEvent));

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(notification.title, { body: notification.message });
  }
}

export async function activateBookingNotifications() {
  if (typeof Notification === "undefined" || Notification.permission !== "default") {
    return;
  }
  await Notification.requestPermission();
}

export { notificationEvent };
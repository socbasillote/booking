import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { env } from "../config/env.js";

export async function sendBookingConfirmation(input: {
  to: string;
  customer: string;
  business: string;
  service: string;
  date: string;
  time: string;
  paymentMethod: string;
  payment: string;
  confirmationCode: string;
  statusPageUrl?: string;
}) {
  let qr: string;

  try {
    qr = await QRCode.toDataURL(input.confirmationCode, {
      margin: 1,
      width: 220,
    });
  } catch (error) {
    console.error(
      `Unable to generate QR code for booking confirmation: ${input.confirmationCode}`,
      error,
    );
    return { delivered: false, qr: "" };
  }

  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) {
    console.warn(
      `SMTP not configured; booking confirmation for ${input.to} was created. Code: ${input.confirmationCode}`,
    );
    return { delivered: false, qr };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
    });

    const statusLink =
      input.statusPageUrl ??
      `http://localhost:5173/status/${input.confirmationCode}`;
    await transporter.sendMail({
      from: env.smtpFrom || env.smtpUser,
      to: input.to,
      subject: `Booking confirmation for ${input.business}`,
      html: `<h2>Booking confirmed</h2><p>Hi ${input.customer},</p><p>Your booking at <strong>${input.business}</strong> is received.</p><p><strong>${input.service}</strong><br/>${input.date} at ${input.time}<br/>Payment: ${input.paymentMethod}<br/>Payment status: ${input.payment}</p><p>Track or view your booking status here:</p><p><a href="${statusLink}" target="_blank">${statusLink}</a></p><p>Show this QR code at your appointment:</p><img src="cid:booking-qr" alt="Booking QR code" width="220"/><p>Confirmation code: <strong>${input.confirmationCode}</strong></p>`,
      attachments: [
        {
          filename: "booking-qr.png",
          content: qr.split(",")[1],
          encoding: "base64",
          cid: "booking-qr",
        },
      ],
    });

    return { delivered: true, qr };
  } catch (error) {
    console.error(
      `SMTP delivery failed for booking confirmation ${input.confirmationCode} to ${input.to}`,
      error,
    );
    return { delivered: false, qr };
  }
}

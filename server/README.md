# Sidebooking

A production-style booking SaaS scaffold for small businesses.

## Stack

- Frontend: React + Vite + TypeScript + Redux Toolkit + Tailwind
- Backend: Express + TypeScript + Mongoose + Zod

## Run locally

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm run dev
```

## Notes

The app includes JWT authentication, protected business setup, persistent browser sessions, a health route, and a production client build. The default API port is 4000.

For local development, copy `.env.example` to `.env` in `server` and start MongoDB before running the API. The client proxies `/api` requests to port 4000 during Vite development. For production, set `VITE_API_URL` to the public API origin plus `/api`, or serve the client and API from the same origin.

Health check: `GET /api/health`.

Customer booking pages use `/book/:slug` (for example `/book/maria-studio`). After a customer submits a booking, Sidebooking creates a confirmation code and QR image. Configure the `SMTP_*` variables in `.env` to email the QR code automatically. If SMTP is omitted during development, the API still returns the QR image and logs the confirmation code.

PayMongo checkout is available as the `PayMongo` payment method on public bookings. Set `PAYMONGO_SECRET_KEY` and `PAYMONGO_WEBHOOK_SECRET` in `server/.env`, then configure this webhook URL in PayMongo:

```text
https://your-api-host.example.com/api/payments/paymongo/webhook
```

The webhook marks the related bookings as paid and confirmed after a successful Checkout Session payment. Use PayMongo test keys while developing.

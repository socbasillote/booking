import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

function required(name: string): string {
  const value = process.env[name];

  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

function getMongoUri(): string {
  const mongoUri =
    process.env.MONGODB_URI ??
    process.env.MONGO_URI ??
    process.env.DATABASE_URL ??
    "mongodb://127.0.0.1:27017/sidebooking";

  if (!mongoUri && isProduction) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  return mongoUri;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),

  mongoUri: getMongoUri(),

  jwtSecret:
    process.env.JWT_SECRET ??
    (isProduction ? required("JWT_SECRET") : "dev-secret-key"),

  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    (isProduction ? required("JWT_REFRESH_SECRET") : "dev-refresh-secret"),

  clientUrl:
    process.env.CLIENT_URL ??
    process.env.FRONTEND_URL ??
    "http://localhost:5173",

  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,

  paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY,
  paymongoWebhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET,
};

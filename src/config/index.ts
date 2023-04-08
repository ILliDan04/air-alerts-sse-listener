import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
  DATABASE_URL: process.env.DATABASE_URL,
  AIR_ALERT_API_URL: process.env.AIR_ALERT_API_URL,
  AIR_ALERT_API_ACCESS_KEY: process.env.AIR_ALERT_API_ACCESS_KEY,
};

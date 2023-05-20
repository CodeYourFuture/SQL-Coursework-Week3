import { ClientType } from "./types";
import dotenv from "dotenv";
dotenv.config();
export const clientConfig: ClientType = {
  user: process.env.user!,
  host: process.env.host!,
  database: process.env.database!,
  password: process.env.password!,
  port: +process.env.port!,
  ssl: {
    rejectUnauthorized: false,
  },
};

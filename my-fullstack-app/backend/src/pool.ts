import { Pool } from "pg";
import dotenv from "dotenv";

// .envファイルを読み込む
dotenv.config();

// データベース接続設定
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

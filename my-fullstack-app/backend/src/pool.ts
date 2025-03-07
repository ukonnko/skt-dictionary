import { Pool } from "pg";

// データベース接続設定
export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "dictionary_db",
  password: "your_password",
  port: 5432,
});

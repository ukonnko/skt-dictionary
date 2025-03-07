import { Pool } from "pg";
import { env } from "./config";
// データベース接続設定
export const pool = new Pool(env.db);

console.log("pool", process.env.DB_USER);

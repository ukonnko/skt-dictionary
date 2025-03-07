import dotenv from "dotenv";

// 環境に応じて適切な.envファイルを読み込む
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
      ? ".env.test"
      : ".env.development";

// 基本設定と環境固有設定を読み込む
dotenv.config({ path: ".env" });
dotenv.config({ path: envFile });
dotenv.config({ path: ".env.local" }); // 個人設定は最後に読み込む

// 環境変数をエクスポート
export const env = {
  db: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
  },
  app: {
    port: parseInt(process.env.PORT || "3001"),
    env: process.env.NODE_ENV || "development",
  },
  // 他の環境変数も必要に応じて追加
};

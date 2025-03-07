import { pool } from "./pool";
import { createTables } from "./createTable";
import { migrateXmlToPostgres } from "./migrateXmlToPostgres";

// 実行
async function main() {
  try {
    await createTables();
    // await migrateXmlToPostgres("dictionary_data.xml");
    console.log("処理が完了しました");
  } catch (e) {
    console.error("エラーが発生しました:", e);
  } finally {
    await pool.end();
  }
}

main();

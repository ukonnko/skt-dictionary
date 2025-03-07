import { pool } from "./pool";

// テーブル作成関数
export async function createTables(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // テーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS headwords (
        id UUID PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        key1 TEXT NOT NULL,
        key2 TEXT,
        homonym TEXT,
        position INTEGER,
        page_ref TEXT,
        line_ref TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS definitions (
        id UUID PRIMARY KEY,
        headword_id UUID REFERENCES headwords(id),
        content TEXT,
        raw_content JSONB,
        display_order INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sanskrit_forms (
        id UUID PRIMARY KEY,
        definition_id UUID REFERENCES definitions(id),
        text TEXT,
        display_order INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS abbreviations (
        id UUID PRIMARY KEY,
        definition_id UUID REFERENCES definitions(id),
        abbr_text TEXT,
        display_order INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id UUID PRIMARY KEY,
        definition_id UUID REFERENCES definitions(id),
        source_text TEXT,
        display_order INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lexical_categories (
        id UUID PRIMARY KEY,
        definition_id UUID REFERENCES definitions(id),
        category TEXT,
        display_order INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        id UUID PRIMARY KEY,
        related_id UUID,
        related_table VARCHAR(50),
        meta_key VARCHAR(100),
        meta_value TEXT,
        attr_source TEXT
      )
    `);

    await client.query("COMMIT");
    console.log("テーブルが正常に作成されました");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("テーブル作成中にエラーが発生しました:", e);
    throw e;
  } finally {
    client.release();
  }
}

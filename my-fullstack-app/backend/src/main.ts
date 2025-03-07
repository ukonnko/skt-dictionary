import * as fs from "fs";
import * as path from "path";
import { DOMParser } from "xmldom";
import { v4 as uuidv4 } from "uuid";
import { pool } from "./pool";

// テーブル作成関数
async function createTables(): Promise<void> {
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

// XMLをクリーンアップする関数
function cleanText(text: string | null): string | null {
  if (!text) return null;
  // XMLタグを除去
  return text.replace(/<[^>]+>/g, " ").trim();
}

// XMLをJSONに変換する関数
function elementToJson(element: Element): any {
  const result: any = {
    tag: element.nodeName,
    text: element.textContent,
    attributes: {},
    children: [],
  };

  // 属性を取得
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    result.attributes[attr.name] = attr.value;
  }

  // 子要素を取得
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === 1) {
      // ELEMENT_NODE
      result.children.push(elementToJson(node as Element));
    }
  }

  return result;
}

// XMLからテキストを抽出する関数
function getTextFromElement(element: Element | null): string | null {
  if (!element) return null;
  return element.textContent;
}

// XMLから子要素を取得する関数
function getChildElement(element: Element, tagName: string): Element | null {
  const children = element.getElementsByTagName(tagName);
  return children.length > 0 ? children[0] : null;
}

// データ移行の主関数
async function migrateXmlToPostgres(xmlFilePath: string): Promise<void> {
  // XMLファイルを読み込む
  const xmlContent = fs.readFileSync(xmlFilePath, "utf8");
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${xmlContent}</root>`, "text/xml");
  const root = doc.documentElement;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let entryPosition = 0;

    // rootの直接の子要素（各エントリー）を処理
    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes[i];

      if (node.nodeType === 1) {
        // ELEMENT_NODE
        const entry = node as Element;
        entryPosition++;
        const entryType = entry.nodeName;

        // 見出し情報の取得
        const hElem = getChildElement(entry, "h");
        if (!hElem) continue;

        const key1Elem = getChildElement(hElem, "key1");
        const key2Elem = getChildElement(hElem, "key2");
        const homElem = getChildElement(hElem, "hom");

        const key1 = getTextFromElement(key1Elem);
        const key2 = getTextFromElement(key2Elem);
        const homonym = getTextFromElement(homElem);

        if (!key1) continue; // key1は必須

        // 参照情報の取得
        const tailElem = getChildElement(entry, "tail");
        const lineRef = tailElem
          ? getTextFromElement(getChildElement(tailElem, "L"))
          : null;
        const pageRef = tailElem
          ? getTextFromElement(getChildElement(tailElem, "pc"))
          : null;

        // 見出し語のID生成
        const headwordId = uuidv4();

        // 見出し語をデータベースに挿入
        await client.query(
          `INSERT INTO headwords 
           (id, type, key1, key2, homonym, position, page_ref, line_ref) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            headwordId,
            entryType,
            key1,
            key2,
            homonym,
            entryPosition,
            pageRef,
            lineRef,
          ]
        );

        // 本文の処理
        const bodyElem = getChildElement(entry, "body");
        if (bodyElem) {
          // テキストとXML構造の両方を保存
          const rawBody = elementToJson(bodyElem);

          // 整形されたテキスト内容を作成
          const bodyText = bodyElem.textContent || "";
          const cleanBodyText = cleanText(bodyText);

          // 定義のID生成
          const definitionId = uuidv4();

          // 定義をデータベースに挿入
          await client.query(
            `INSERT INTO definitions 
             (id, headword_id, content, raw_content, display_order) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              definitionId,
              headwordId,
              cleanBodyText,
              JSON.stringify(rawBody),
              1,
            ]
          );

          // サンスクリット表記の処理
          const sElems = bodyElem.getElementsByTagName("s");
          for (let j = 0; j < sElems.length; j++) {
            const sElem = sElems[j];
            const sText = sElem.textContent;

            if (sText) {
              await client.query(
                `INSERT INTO sanskrit_forms 
                 (id, definition_id, text, display_order) 
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), definitionId, sText, j + 1]
              );
            }
          }

          // 略語の処理
          const abElems = bodyElem.getElementsByTagName("ab");
          for (let j = 0; j < abElems.length; j++) {
            const abElem = abElems[j];
            const abText = abElem.textContent;

            if (abText) {
              await client.query(
                `INSERT INTO abbreviations 
                 (id, definition_id, abbr_text, display_order) 
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), definitionId, abText, j + 1]
              );
            }
          }

          // 出典の処理
          const lsElems = bodyElem.getElementsByTagName("ls");
          for (let j = 0; j < lsElems.length; j++) {
            const lsElem = lsElems[j];
            const lsText = lsElem.textContent;

            if (lsText) {
              await client.query(
                `INSERT INTO sources 
                 (id, definition_id, source_text, display_order) 
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), definitionId, lsText, j + 1]
              );
            }
          }

          // 品詞情報の処理
          const lexElems = bodyElem.getElementsByTagName("lex");
          for (let j = 0; j < lexElems.length; j++) {
            const lexElem = lexElems[j];
            const lexText = lexElem.textContent;

            if (lexText) {
              await client.query(
                `INSERT INTO lexical_categories 
                 (id, definition_id, category, display_order) 
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), definitionId, lexText, j + 1]
              );
            }
          }

          // メタデータの処理
          const infoElems = bodyElem.getElementsByTagName("info");
          for (let j = 0; j < infoElems.length; j++) {
            const infoElem = infoElems[j];

            for (let k = 0; k < infoElem.attributes.length; k++) {
              const attr = infoElem.attributes[k];

              await client.query(
                `INSERT INTO metadata 
                 (id, related_id, related_table, meta_key, meta_value, attr_source) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  uuidv4(),
                  definitionId,
                  "definitions",
                  attr.name,
                  attr.value,
                  "info",
                ]
              );
            }
          }
        }
      }
    }

    await client.query("COMMIT");
    console.log("データ移行が正常に完了しました");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("データ移行中にエラーが発生しました:", e);
    throw e;
  } finally {
    client.release();
  }
}

// 実行
async function main() {
  try {
    await createTables();
    await migrateXmlToPostgres("dictionary_data.xml");
    console.log("処理が完了しました");
  } catch (e) {
    console.error("エラーが発生しました:", e);
  } finally {
    await pool.end();
  }
}

main();

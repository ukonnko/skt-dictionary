// 型定義
export interface HeadwordEntry {
  id: string;
  type: string;
  key1: string;
  key2: string | null;
  homonym: string | null;
  position: number;
  pageRef: string | null;
  lineRef: string | null;
}

export interface Definition {
  id: string;
  headwordId: string;
  content: string;
  rawContent: object;
  displayOrder: number;
}

export interface SanskritForm {
  id: string;
  definitionId: string;
  text: string;
  displayOrder: number;
}

export interface Abbreviation {
  id: string;
  definitionId: string;
  abbrText: string;
  displayOrder: number;
}

export interface Source {
  id: string;
  definitionId: string;
  sourceText: string;
  displayOrder: number;
}

export interface LexicalCategory {
  id: string;
  definitionId: string;
  category: string;
  displayOrder: number;
}

export interface Metadata {
  id: string;
  relatedId: string;
  relatedTable: string;
  metaKey: string;
  metaValue: string;
  attrSource: string;
}

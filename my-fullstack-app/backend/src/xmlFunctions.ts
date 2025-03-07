// XMLをクリーンアップする関数
export function cleanText(text: string | null): string | null {
  if (!text) return null;
  // XMLタグを除去し、連続する空白を単一のスペースに置換
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// XMLをJSONに変換する関数
export function elementToJson(element: Element): any {
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
export function getTextFromElement(element: Element | null): string | null {
  if (!element) return null;
  return element.textContent;
}

// XMLから子要素を取得する関数
export function getChildElement(
  element: Element,
  tagName: string
): Element | null {
  const children = element.getElementsByTagName(tagName);
  return children.length > 0 ? children[0] : null;
}

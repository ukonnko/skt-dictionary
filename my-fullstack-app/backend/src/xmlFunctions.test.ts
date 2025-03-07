import { describe, it, expect } from "vitest";
import { DOMParser } from "xmldom";
import {
  cleanText,
  elementToJson,
  getTextFromElement,
  getChildElement,
} from "./xmlFunctions";

describe("xmlFunctions", () => {
  describe("cleanText", () => {
    it("should remove XML tags", () => {
      const input = "<p>Hello <b>World</b></p>";
      const result = cleanText(input);
      expect(result).toBe("Hello World");
    });

    it("should return null for null input", () => {
      const result = cleanText(null);
      expect(result).toBeNull();
    });

    it("should trim whitespace", () => {
      const input = "  <p> Text </p>  ";
      const result = cleanText(input);
      expect(result).toBe("Text");
    });
  });

  describe("elementToJson", () => {
    it("should convert simple element to JSON", () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        "<div id='test'>Hello</div>",
        "text/xml"
      );
      const element = doc.documentElement;

      const result = elementToJson(element);
      expect(result).toEqual({
        tag: "div",
        text: "Hello",
        attributes: { id: "test" },
        children: [],
      });
    });

    it("should handle nested elements", () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        "<div><p>Hello</p><p>World</p></div>",
        "text/xml"
      );
      const element = doc.documentElement;

      const result = elementToJson(element);
      expect(result.children.length).toBe(2);
      expect(result.children[0].tag).toBe("p");
      expect(result.children[0].text).toBe("Hello");
    });
  });

  describe("getTextFromElement", () => {
    it("should get text content from element", () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString("<p>Hello</p>", "text/xml");
      const element = doc.documentElement;

      const result = getTextFromElement(element);
      expect(result).toBe("Hello");
    });

    it("should return null for null input", () => {
      const result = getTextFromElement(null);
      expect(result).toBeNull();
    });
  });

  describe("getChildElement", () => {
    it("should get child element by tag name", () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString("<div><p>Hello</p></div>", "text/xml");
      const element = doc.documentElement;

      const result = getChildElement(element, "p");
      expect(result?.textContent).toBe("Hello");
    });

    it("should return null if child not found", () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString("<div></div>", "text/xml");
      const element = doc.documentElement;

      const result = getChildElement(element, "p");
      expect(result).toBeNull();
    });
  });
});

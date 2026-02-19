import { describe, expect, it } from "vitest";
import { parseRGB, withOpacity } from "./colors";

describe("color utilities", () => {
  it("parses 3-digit and 6-digit hex strings", () => {
    expect(parseRGB("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseRGB("#123456")).toEqual({ r: 18, g: 52, b: 86 });
  });

  it("parses rgb syntax", () => {
    expect(parseRGB("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("falls back to black for unsupported formats", () => {
    expect(parseRGB("nonsense")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("adds an alpha channel to color input", () => {
    expect(withOpacity("#3366ff", 0.5)).toBe("rgba(51, 102, 255, 0.5)");
    expect(withOpacity("rgb(1, 2, 3)", 0.3)).toBe("rgba(1, 2, 3, 0.3)");
  });
});

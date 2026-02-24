import { describe, expect, it } from "vitest";
import type { Layer } from "@/lib/map-editor/types";
import { getLayerDisplayName } from "./layer-display";

describe("getLayerDisplayName", () => {
  it("returns the custom layer name when present", () => {
    expect(
      getLayerDisplayName({
        name: "My Area",
        context: "area",
      } as Layer),
    ).toBe("My Area");
  });

  it("falls back to context prefix when name is empty", () => {
    expect(
      getLayerDisplayName({
        name: " ",
        context: "area",
      } as Layer),
    ).toBe("Area");
  });

  it("uses indexed fallback when index is provided", () => {
    expect(
      getLayerDisplayName(
        {
          name: "",
          context: "keepout",
        } as Layer,
        3,
      ),
    ).toBe("Keepout 3");
  });
});


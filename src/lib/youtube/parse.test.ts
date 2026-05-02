import { describe, expect, it } from "vitest";

import { parseIsoDurationToSeconds } from "./parse";

describe("parseIsoDurationToSeconds", () => {
  it("parses standard ISO durations", () => {
    expect(parseIsoDurationToSeconds("PT1H2M3S")).toBe(3723);
    expect(parseIsoDurationToSeconds("PT15M")).toBe(900);
  });

  it("returns null for invalid strings", () => {
    expect(parseIsoDurationToSeconds("invalid")).toBeNull();
  });
});

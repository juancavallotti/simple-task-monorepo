import { describe, expect, it } from "vitest";

import { formatJson, formatJsonEvents, formatJsonSource } from "./format-json";

describe("formatJson", () => {
  it("pretty-prints serializable values", () => {
    expect(formatJson({ ok: true, count: 2 })).toBe(
      '{\n  "ok": true,\n  "count": 2\n}',
    );
  });

  it("returns an empty string for undefined", () => {
    expect(formatJson(undefined)).toBe("");
  });

  it("falls back for circular values", () => {
    const value: { self?: unknown } = {};
    value.self = value;

    expect(formatJson(value)).toBe("[object Object]");
  });
});

describe("formatJsonSource", () => {
  it("pretty-prints JSON strings and preserves plain text", () => {
    expect(formatJsonSource('{"ok":true}')).toBe('{\n  "ok": true\n}');
    expect(formatJsonSource("not json")).toBe("not json");
  });
});

describe("formatJsonEvents", () => {
  it("formats event payloads separated by blank lines", () => {
    expect(formatJsonEvents(['{"a":1}', "plain"])).toBe(
      '{\n  "a": 1\n}\n\nplain',
    );
  });
});

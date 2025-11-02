import { sanitizeTextForDatabase, sanitizeJsonForDatabase, sanitizeAnyForDatabase } from "@/lib/utils";

describe("sanitizeTextForDatabase", () => {
  it("removes NULL bytes from strings", () => {
    const input = "Hello\u0000World\u0000!";
    const result = sanitizeTextForDatabase(input);

    expect(result).toBe("HelloWorld!");
  });

  it("returns the original string when no NULL bytes are present", () => {
    const input = "Clean text";
    const result = sanitizeTextForDatabase(input);

    expect(result).toBe(input);
  });

  it("returns an empty string when the input is entirely NULL bytes", () => {
    const input = "\u0000\u0000";
    const result = sanitizeTextForDatabase(input);

    expect(result).toBe("");
  });

  it("returns empty string for non-string inputs", () => {
    expect(sanitizeTextForDatabase(null as unknown as string)).toBe("");
    expect(sanitizeTextForDatabase(undefined as unknown as string)).toBe("");
    expect(sanitizeTextForDatabase(123 as unknown as string)).toBe("");
  });
});

describe("sanitizeJsonForDatabase", () => {
  it("removes NULL bytes from nested object strings", () => {
    const input = {
      name: "Hello\u0000World",
      nested: {
        value: "Test\u0000Data",
        deep: {
          text: "Deep\u0000Text"
        }
      }
    };
    const result = sanitizeJsonForDatabase(input);

    expect(result).toEqual({
      name: "HelloWorld",
      nested: {
        value: "TestData",
        deep: {
          text: "DeepText"
        }
      }
    });
  });

  it("handles arrays with NULL bytes", () => {
    const input = ["Hello\u0000", "World\u0000", "Test"];
    const result = sanitizeJsonForDatabase(input);

    expect(result).toEqual(["Hello", "World", "Test"]);
  });

  it("handles arrays of objects with NULL bytes", () => {
    const input = [
      { name: "Item\u00001", value: "Value\u00001" },
      { name: "Item2", value: "Value2" }
    ];
    const result = sanitizeJsonForDatabase(input);

    expect(result).toEqual([
      { name: "Item1", value: "Value1" },
      { name: "Item2", value: "Value2" }
    ]);
  });

  it("preserves non-string values", () => {
    const input = {
      text: "Hello\u0000",
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined
    };
    const result = sanitizeJsonForDatabase(input);

    expect(result).toEqual({
      text: "Hello",
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined
    });
  });

  it("handles complex nested structures", () => {
    const input = {
      files: {
        "app.ts": "const x\u0000 = 1;",
        "test.ts": "const y = 2;"
      },
      metadata: {
        screenshots: ["url1\u0000", "url2"],
        tags: ["tag\u00001", "tag2"]
      }
    };
    const result = sanitizeJsonForDatabase(input);

    expect(result).toEqual({
      files: {
        "app.ts": "const x = 1;",
        "test.ts": "const y = 2;"
      },
      metadata: {
        screenshots: ["url1", "url2"],
        tags: ["tag1", "tag2"]
      }
    });
  });

  it("returns null for null input", () => {
    expect(sanitizeJsonForDatabase(null)).toBe(null);
  });

  it("returns undefined for undefined input", () => {
    expect(sanitizeJsonForDatabase(undefined)).toBe(undefined);
  });

  it("handles empty objects and arrays", () => {
    expect(sanitizeJsonForDatabase({})).toEqual({});
    expect(sanitizeJsonForDatabase([])).toEqual([]);
  });
});

describe("sanitizeAnyForDatabase", () => {
  it("sanitizes string values", () => {
    const input = "Hello\u0000World";
    const result = sanitizeAnyForDatabase(input);

    expect(result).toBe("HelloWorld");
  });

  it("sanitizes objects", () => {
    const input = { name: "Test\u0000" };
    const result = sanitizeAnyForDatabase(input);

    expect(result).toEqual({ name: "Test" });
  });

  it("sanitizes arrays", () => {
    const input = ["Test\u00001", "Test2"];
    const result = sanitizeAnyForDatabase(input);

    expect(result).toEqual(["Test1", "Test2"]);
  });

  it("preserves primitive values", () => {
    expect(sanitizeAnyForDatabase(123)).toBe(123);
    expect(sanitizeAnyForDatabase(true)).toBe(true);
    expect(sanitizeAnyForDatabase(false)).toBe(false);
  });

  it("preserves null and undefined", () => {
    expect(sanitizeAnyForDatabase(null)).toBe(null);
    expect(sanitizeAnyForDatabase(undefined)).toBe(undefined);
  });

  it("handles Fragment files structure", () => {
    const input = {
      "src/app.ts": "import\u0000 React from 'react';",
      "src/utils.ts": "export const helper\u0000 = () => {};"
    };
    const result = sanitizeAnyForDatabase(input);

    expect(result).toEqual({
      "src/app.ts": "import React from 'react';",
      "src/utils.ts": "export const helper = () => {};"
    });
  });

  it("handles Fragment metadata structure", () => {
    const input = {
      screenshots: ["https://example.com/img\u00001.png", "https://example.com/img2.png"],
      previousFiles: {
        "app.ts": "code\u0000"
      },
      fixedAt: "2025-11-02\u0000"
    };
    const result = sanitizeAnyForDatabase(input);

    expect(result).toEqual({
      screenshots: ["https://example.com/img1.png", "https://example.com/img2.png"],
      previousFiles: {
        "app.ts": "code"
      },
      fixedAt: "2025-11-02"
    });
  });
});

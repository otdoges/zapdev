import { sanitizeTextForDatabase } from "@/lib/utils";

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
});

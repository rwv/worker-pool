import { describe, it, expect } from "vitest";
import { foo } from "./index";

/**
 * Test suite for the foo function
 *
 * This suite verifies that the foo function:
 * - Returns the correct string value "bar"
 * - Returns a value of string type
 * - Returns the literal string "bar" and not other values
 */
describe("foo", () => {
  /**
   * Test that foo returns the expected string "bar"
   */
  it('should return "bar"', () => {
    const result = foo();
    expect(result).toBe("bar");
  });

  /**
   * Test that foo returns a value of string type
   */
  it("should return a string type", () => {
    const result = foo();
    expect(typeof result).toBe("string");
  });

  /**
   * Test that foo returns the literal string "bar" and not other values
   * This test ensures the function returns exactly "bar" and not similar strings
   */
  it('should return the literal string "bar"', () => {
    const result = foo();
    expect(result).toBe("bar");
    expect(result).not.toBe("baz");
    expect(result).not.toBe("qux");
  });
});

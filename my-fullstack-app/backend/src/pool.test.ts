import { describe, it, expect } from "vitest";
import { Pool } from "pg";

describe("Pool", () => {
  it("should create a pool", () => {
    const pool = new Pool({});
    expect(pool).toBeDefined();
  });
});

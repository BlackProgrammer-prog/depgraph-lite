import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverSourceFiles } from "../src/core/discovery.js";

describe("discoverSourceFiles", () => {
  it("finds supported files while applying defaults and user globs", async () => {
    const root = path.resolve("test/fixtures/discovery");
    const files = await discoverSourceFiles(root, ["**/*.generated.ts"]);
    expect(files.map((file) => path.relative(root, file).replaceAll("\\", "/"))).toEqual([
      "nested/keep.js",
      "source.ts"
    ]);
  });
});

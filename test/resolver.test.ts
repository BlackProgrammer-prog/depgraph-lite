import path from "node:path";
import { describe, expect, it } from "vitest";
import { ImportResolver, externalPackageName } from "../src/core/resolver.js";

const fixtureRoot = path.resolve("test/fixtures/basic");

describe("ImportResolver", () => {
  it("resolves extensionless, emitted JavaScript, and directory imports", async () => {
    const resolver = new ImportResolver();
    const importer = path.join(fixtureRoot, "index.ts");
    expect((await resolver.resolve(importer, "./auth.js")).resolved).toMatch(/auth\.ts$/);
    expect((await resolver.resolve(path.join(fixtureRoot, "auth.ts"), "./users")).resolved).toMatch(/users\.ts$/);
    expect((await resolver.resolve(importer, "./features")).resolved).toMatch(/features\/index\.ts$/);
  });

  it("classifies package imports and normalizes scoped package names", async () => {
    expect((await new ImportResolver().resolve("/project/a.ts", "@scope/tool/subpath")).external).toBe(true);
    expect(externalPackageName("@scope/tool/subpath")).toBe("@scope/tool");
    expect(externalPackageName("lodash/map")).toBe("lodash");
  });
});

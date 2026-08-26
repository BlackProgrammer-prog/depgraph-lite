import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/core/analyzer.js";

describe("analyzeProject", () => {
  it("runs the complete analysis pipeline", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/basic") });
    expect(result.metrics).toMatchObject({ files: 4, edges: 3, externalPackages: 1, entryPoints: 1, leafModules: 2, circularDependencies: 0 });
    expect(result.graph.nodes.get("index.ts")?.dependencies).toEqual(["auth.ts", "features/index.ts"]);
    expect(result.warnings).toEqual([]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("reports a real circular path", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/cycle") });
    expect(result.cycles).toEqual([{ nodes: ["a.ts", "b.ts", "c.ts", "a.ts"] }]);
  });

  it("continues after a malformed source file", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/malformed") });
    expect(result.metrics.files).toBe(1);
    expect(result.warnings[0]).toMatchObject({ file: "broken.ts", code: "PARSE_ERROR" });
  });
});

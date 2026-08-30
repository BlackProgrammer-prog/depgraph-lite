import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/core/analyzer.js";
import { generateHtmlReport } from "../src/reporters/html.js";
import { generateJsonReport } from "../src/reporters/json.js";
import { generateTerminalReport } from "../src/reporters/terminal.js";

describe("reporters", () => {
  it("produces parseable JSON without Map data loss", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/basic") });
    const report = JSON.parse(generateJsonReport(result)) as { modules: unknown[]; metrics: { files: number } };
    expect(report.modules).toHaveLength(4);
    expect(report.metrics.files).toBe(4);
  });

  it("produces readable terminal output", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/cycle") });
    const report = generateTerminalReport(result, false);
    expect(report).toContain("Most depended-on modules");
    expect(report).toContain("a.ts\n → b.ts\n → c.ts\n → a.ts");
    expect(report).not.toContain("\u001b[");
  });

  it("produces standalone escaped HTML with an SVG graph", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/basic") });
    result.root = "<unsafe>";
    const report = generateHtmlReport(result);
    expect(report).toContain("<!doctype html>");
    expect(report).toContain("<svg");
    expect(report).toContain("&lt;unsafe&gt;");
    expect(report).not.toContain("<unsafe>");
    expect(report).not.toContain("https://");
  });

  it("includes interactive graph controls without external assets", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/cycle") });
    const report = generateHtmlReport(result);
    expect(report).toContain('id="search"');
    expect(report).toContain('data-filter="cycle"');
    expect(report).toContain('id="zoom-in"');
    expect(report).toContain('id="graph-data"');
    expect(report).toContain('class="node cycle"');
    expect(report).not.toContain("<link");
    expect(report).not.toContain("<script src=");
  });

  it("escapes module ids in both markup and embedded graph data", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/basic") });
    const firstNode = result.graph.nodes.values().next().value;
    expect(firstNode).toBeDefined();
    if (!firstNode) return;
    result.graph.nodes.delete(firstNode.id);
    firstNode.id = "</script><script>alert(1)</script>";
    firstNode.path = firstNode.id;
    result.graph.nodes.set(firstNode.id, firstNode);
    const report = generateHtmlReport(result);
    expect(report).not.toContain("</script><script>alert(1)</script>");
    expect(report).toContain("\\u003c/script>");
  });

  it("explains an empty single-file graph", async () => {
    const result = await analyzeProject({ root: path.resolve("test/fixtures/discovery/source.ts") });
    expect(generateTerminalReport(result, false)).toContain("Only one source file was analyzed.");
    expect(generateHtmlReport(result)).toContain("Only one source file was analyzed.");
  });
});

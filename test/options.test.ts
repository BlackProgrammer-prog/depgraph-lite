import { describe, expect, it } from "vitest";
import { parseCliOptions } from "../src/cli/options.js";

describe("parseCliOptions", () => {
  it("supports JSON and default HTML output", () => {
    expect(parseCliOptions(["src", "--json"])).toMatchObject({ root: "src", output: "json" });
    expect(parseCliOptions(["src", "--html"])).toMatchObject({ output: "html", outputFile: "depgraph-report.html" });
  });

  it("supports a custom HTML path and repeated ignore globs", () => {
    expect(parseCliOptions(["src", "--html", "report.html", "--ignore", "one/**", "-i", "two/**"])).toMatchObject({
      outputFile: "report.html", ignore: ["one/**", "two/**"]
    });
  });
});

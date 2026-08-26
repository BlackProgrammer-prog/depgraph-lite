import { describe, expect, it } from "vitest";
import { parseDependencies } from "../src/core/parser.js";

describe("parseDependencies", () => {
  it("extracts supported module syntax from an AST", () => {
    const source = `
      import value from "./static";
      import "./setup";
      export { item } from "./named";
      export * from "./all";
      const legacy = require("./legacy");
      const lazy = import("./lazy");
      require(variable);
      import(\`./plugins/\${name}\`);
    `;
    expect(parseDependencies(source, "sample.ts")).toEqual([
      { source: "./static", type: "static-import" },
      { source: "./setup", type: "static-import" },
      { source: "./named", type: "re-export" },
      { source: "./all", type: "re-export" },
      { source: "./legacy", type: "require" },
      { source: "./lazy", type: "dynamic-import" }
    ]);
  });

  it("handles JSX and excludes type-only imports by default", () => {
    const source = `import type { User } from "./types"; export const view = <div />;`;
    expect(parseDependencies(source, "view.tsx")).toEqual([]);
    expect(parseDependencies(source, "view.tsx", true)).toEqual([{ source: "./types", type: "static-import" }]);
  });

  it("does not mistake import-looking strings and comments for dependencies", () => {
    const source = `const example = 'import x from "./fake"'; // require("./fake-too")`;
    expect(parseDependencies(source, "safe.js")).toEqual([]);
  });
});

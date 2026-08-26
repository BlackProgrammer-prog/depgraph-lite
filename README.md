# DepGraph Lite

A lightweight dependency graph analyzer for JavaScript and TypeScript projects.

Scan a codebase, visualize module relationships, detect circular dependencies, and inspect architectural hotspots directly from your terminal.

[![CI](https://github.com/BlackProgrammer-prog/depgraph-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/BlackProgrammer-prog/depgraph-lite/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg)](https://nodejs.org/)

## Features

- Parses JavaScript, JSX, TypeScript, and TSX through a real syntax tree
- Detects static imports, re-exports, dynamic `import()`, and CommonJS `require()`
- Resolves extensionless paths, directory indexes, and TypeScript sources referenced with `.js`
- Returns actual circular dependency paths with deterministic deduplication
- Calculates entry points, leaf modules, fan-in, fan-out, and dependency hotspots
- Generates concise terminal output, machine-readable JSON, and standalone HTML
- Continues analyzing when an individual source file cannot be parsed
- Executes no project code and has one small runtime dependency

## Installation

Build the current version from the repository:

```bash
git clone https://github.com/BlackProgrammer-prog/depgraph-lite.git
cd depgraph-lite
npm install
npm run build
node dist/cli/cli.js ./src
```

After the package is published to npm:

```bash
npm install --save-dev depgraph-lite
npx depgraph-lite ./src
```

Node.js 20 or newer is required.

## Usage

```bash
# Analyze a source directory
depgraph-lite ./src

# Emit valid JSON only
depgraph-lite ./src --json

# Write the default depgraph-report.html
depgraph-lite ./src --html

# Choose an HTML filename
depgraph-lite ./src --html architecture.html

# Ignore generated files and fail CI when a cycle exists
depgraph-lite ./src --ignore "generated/**" --fail-on-cycle
```

Available options:

```text
--json                print valid JSON to stdout
--html [file]         write a standalone HTML report
-i, --ignore <glob>   ignore a path; can be repeated
--include-types       include type-only imports
--fail-on-cycle       exit with code 2 when cycles are found
--no-color            disable terminal colors
-h, --help            show help
-v, --version         show the installed version
```

Successful analysis exits with code `0`. Runtime errors exit with `1`. With `--fail-on-cycle`, detected cycles exit with `2`.

## Example output

```text
DepGraph Lite
────────────────────────────────────

Project
Files                       143
Internal dependencies       287
External packages            19

Graph
Entry points                  4
Leaf modules                 27
Circular dependencies         2

Most depended-on modules

  31  src/shared/utils.ts
  24  src/config/index.ts
  18  src/api/client.ts

Cycles

1.
src/auth/index.ts
 → src/auth/service.ts
 → src/users/service.ts
 → src/auth/index.ts

Completed in 84 ms
```

The figures above demonstrate the output format; they are not benchmark results.

## HTML report

The HTML reporter produces one portable file containing all markup, styles, and SVG. It does not load a server, CDN, external script, stylesheet, or font.

The report contains:

- summary metrics
- a dependency graph
- modules ranked by fan-in and fan-out
- circular dependency paths
- project statistics

Graph rendering is capped at 150 modules so a large project does not make the page unusable. Metrics and hotspot tables still cover the complete analysis.

## Programmatic API

```ts
import { analyzeProject } from "depgraph-lite";

const result = await analyzeProject({
  root: "./src",
  ignore: ["**/*.generated.ts"],
  includeTypeImports: false
});

console.log(result.metrics);
console.log(result.cycles);
```

The package also exports `detectCycles`, `calculateMetrics`, the three report generators, and its public TypeScript types.

## How it works

The analyzer follows a small pipeline:

```text
discover files
    ↓
parse syntax trees
    ↓
resolve local imports
    ↓
build adjacency lists
    ↓
detect and canonicalize cycles
    ↓
calculate graph metrics
```

Files are represented by paths relative to the analysis root. Internal imports become directed edges. A DFS uses white/gray/black traversal state to reconstruct back-edge cycles in `O(V + E)` time. Paths are rotated to a stable starting module so equivalent cycle discoveries are not repeated.

Entry points are modules with an internal in-degree of zero. Leaf modules have an internal out-degree of zero. These are graph definitions rather than framework-aware classifications.

## Supported syntax

```ts
import value from "./value";
import { helper } from "./helper";
import * as config from "./config";
import "./setup";

export { item } from "./item";
export * from "./public-api";

const legacy = require("./legacy");
const lazy = import("./lazy");
```

Only string-literal `require()` and dynamic imports are collected. Computed forms such as `require(variable)` or `import(\`./plugins/\${name}\`)` are intentionally skipped.

Supported extensions are `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.

## Performance

Discovery is iterative, file reads use bounded batches, and import resolution is cached. Graph storage uses adjacency lists and graph traversal is linear in the number of modules and internal edges.

The design target is analysis of 1,000 ordinary source files in under one second on a modern machine. No benchmark result is claimed yet; a reproducible benchmark suite should be added before publishing performance comparisons.

## Limitations

The first release deliberately does not implement:

- TypeScript `paths` or `baseUrl`
- bundler and framework aliases
- Node package `exports` condition resolution
- computed dynamic imports or computed `require()`
- monorepo workspace intelligence
- unused-export or dead-code analysis
- framework-aware entry-point detection

Bare specifiers are classified as external packages and `node_modules` is never scanned.

## Roadmap

- Better Node and TypeScript path resolution
- Dependency depth and transitive dependency metrics
- Architecture boundary rules
- Workspace-level monorepo graphs
- Graph diffs between Git revisions
- Search, filtering, zoom, and cycle highlighting in HTML reports

## Development

```bash
npm install
npm run check
npm test
npm run coverage
npm run build
```

Tests use static fixtures for parsing, resolution, cycles, malformed files, and end-to-end analysis. CI runs type checking, tests, and builds on Node.js 20 and 22.

## License

[MIT](LICENSE) © Parham Azizi

# DepGraph Lite

A lightweight dependency graph analyzer for JavaScript and TypeScript.

Point it at a **source directory**, and it will find module relationships created by `import`, `export ... from`, `require()`, and dynamic `import()`.

[![CI](https://github.com/BlackProgrammer-prog/depgraph-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/BlackProgrammer-prog/depgraph-lite/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933.svg)](https://nodejs.org/)

## What it shows

Given this project:

```text
my-app/
└── src/
    ├── index.ts     imports auth.ts
    ├── auth.ts      imports api.ts
    └── api.ts
```

DepGraph Lite builds this directed graph:

```text
index.ts → auth.ts → api.ts
```

It also reports:

- circular dependency paths
- entry points and leaf modules
- modules with high fan-in or fan-out
- external package imports
- unresolved local imports
- source files that could not be parsed

## Requirements

- Node.js 20 or newer
- A JavaScript or TypeScript project containing multiple source modules

Supported files: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`.

## Installation

### Install in a project

Open a terminal in the project you want to analyze:

```bash
npm install --save-dev depgraph-lite
npx depgraph-lite ./src
```

Installing locally is the recommended option because every contributor and CI job uses the same version.

### Run without adding it to package.json

```bash
npx depgraph-lite@latest ./src
```

### Install globally

```bash
npm install --global depgraph-lite
depgraph-lite ./src
```

## The target path matters

The first argument is the project or source directory to analyze. It is resolved relative to your **current terminal directory**, not relative to where DepGraph Lite is installed.

For example:

```text
workspace/
├── depgraph-lite/
└── ky/
    └── source/
```

If your terminal is inside `workspace/ky`, run:

```bash
depgraph-lite ./source
```

If your terminal is inside `workspace/depgraph-lite`, run:

```bash
depgraph-lite ../ky/source
```

Before running the analyzer, use `pwd` on macOS/Linux or `Get-Location` on PowerShell if you are unsure which directory the terminal is using.

## Common mistake: analyzing the tool itself

This command:

```bash
node dist/cli/cli.js ./src
```

analyzes the `src` directory next to that `dist` directory. If you run it from the cloned DepGraph Lite repository, it analyzes **DepGraph Lite itself**, not another project.

When the npm package is installed, prefer the package command:

```bash
npx depgraph-lite <path-to-target-source>
```

Examples:

```bash
npx depgraph-lite ./src
npx depgraph-lite ../ky/source
npx depgraph-lite C:/projects/my-app/src
```

## Common mistake: analyzing one bundled file

A dependency graph describes relationships **between files**. If you analyze a single bundled or minified file:

```bash
depgraph-lite ./turn.js
```

the expected result is one node and usually zero internal edges. Bundled libraries often contain all their code in one file and no longer have local `import` or `export` statements.

Instead, analyze the original multi-file source directory:

```bash
depgraph-lite ./src
```

DepGraph Lite does not currently create edges from HTML `<script src="...">` tags.

## Usage

### Terminal report

```bash
npx depgraph-lite ./src
```

### Standalone HTML report

```bash
npx depgraph-lite ./src --html dependency-report.html
```

Open it in PowerShell:

```powershell
Start-Process .\dependency-report.html
```

The HTML file contains its CSS and SVG graph inline. It does not need a server, CDN, or internet connection.

### JSON report

```bash
npx depgraph-lite ./src --json > dependency-report.json
```

Standard output contains JSON only, so it can be piped into other tools.

### Include TypeScript type-only imports

```bash
npx depgraph-lite ./src --include-types
```

### Ignore generated files

```bash
npx depgraph-lite . \
  --ignore "dist/**" \
  --ignore "**/*.generated.ts"
```

In PowerShell, multiline commands use a backtick:

```powershell
npx depgraph-lite . `
  --ignore "dist/**" `
  --ignore "**/*.generated.ts"
```

### Fail CI when cycles exist

```bash
npx depgraph-lite ./src --fail-on-cycle
```

Exit codes:

- `0`: analysis completed
- `1`: filesystem, argument, or runtime error
- `2`: cycles found while using `--fail-on-cycle`

## CLI reference

```text
depgraph-lite [path] [options]

--json                print valid JSON to stdout
--html [file]         write a standalone HTML report
-i, --ignore <glob>   ignore a path; can be repeated
--include-types       include type-only imports
--fail-on-cycle       exit with code 2 when cycles are found
--no-color            disable terminal colors
-h, --help            show help
-v, --version         show the installed version
```

## Supported syntax

```ts
import value from "./value";
import {helper} from "./helper";
import "./setup";

export {item} from "./item";
export * from "./public-api";

const legacy = require("./legacy");
const lazy = import("./lazy");
```

Only string-literal `require()` and dynamic imports are collected. Computed expressions such as `require(variable)` and `import(\`./plugins/\${name}\`)` are skipped.

## Programmatic API

```ts
import {analyzeProject} from "depgraph-lite";

const result = await analyzeProject({
  root: "./src",
  ignore: ["**/*.generated.ts"],
  includeTypeImports: false
});

console.log(result.metrics);
console.log(result.cycles);
```

The package also exports `detectCycles`, `calculateMetrics`, the report generators, and its public TypeScript types.

## How it works

```text
discover source files
        ↓
parse JavaScript/TypeScript ASTs
        ↓
resolve relative imports
        ↓
build adjacency lists
        ↓
detect and canonicalize cycles
        ↓
calculate graph metrics
```

Project source is read as text and parsed with `@babel/parser`. It is never executed. Cycle detection uses a depth-first graph traversal with `O(V + E)` complexity.

Entry points are modules with an internal in-degree of zero. Leaf modules have an internal out-degree of zero. These definitions are graph-based rather than framework-aware.

## Limitations

Version 0.1 does not resolve:

- TypeScript `paths` or `baseUrl`
- webpack, Vite, or framework aliases
- package `exports` conditions
- computed dynamic imports
- HTML `<script>` relationships
- monorepo package boundaries

Bare imports such as `react` are classified as external packages. Files inside `node_modules`, `dist`, `build`, `coverage`, `.next`, and similar generated directories are ignored.

## Development

```bash
git clone https://github.com/BlackProgrammer-prog/depgraph-lite.git
cd depgraph-lite
npm install
npm run typecheck
npm test
npm run coverage
npm run build
```

To test the exact npm package before publishing:

```bash
npm pack
npm install --global ./depgraph-lite-0.1.0.tgz
depgraph-lite --version
```

## Publishing

Publishing requires an npm account with two-factor authentication configured:

```bash
npm login
npm whoami
npm publish --access public
```

The `prepublishOnly` script automatically runs type checking, tests, and a clean build before npm uploads the package.

## License

[MIT](LICENSE) © Parham Azizi

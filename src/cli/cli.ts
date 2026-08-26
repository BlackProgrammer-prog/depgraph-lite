#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { analyzeProject } from "../core/analyzer.js";
import { generateHtmlReport } from "../reporters/html.js";
import { generateJsonReport } from "../reporters/json.js";
import { generateTerminalReport } from "../reporters/terminal.js";
import { parseCliOptions } from "./options.js";

const VERSION = "0.1.0";
const HELP = `DepGraph Lite — analyze JavaScript and TypeScript dependencies

Usage:
  depgraph-lite [path] [options]

Options:
      --json                print valid JSON to stdout
      --html [file]         write a standalone HTML report
  -i, --ignore <glob>       ignore a path; can be repeated
      --include-types       include type-only imports
      --fail-on-cycle       exit with code 2 when cycles are found
      --no-color            disable terminal colors
  -h, --help                show this help
  -v, --version             show the installed version
`;

async function run(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  if (options === "help") return void process.stdout.write(HELP);
  if (options === "version") return void process.stdout.write(`${VERSION}\n`);
  const result = await analyzeProject({ root: options.root, ignore: options.ignore, includeTypeImports: options.includeTypes });
  const report = options.output === "json"
    ? generateJsonReport(result)
    : options.output === "html" ? generateHtmlReport(result) : generateTerminalReport(result, options.color && process.stdout.isTTY);
  if (options.outputFile) {
    const outputFile = path.resolve(options.outputFile);
    await writeFile(outputFile, report, "utf8");
    process.stderr.write(`Report written to ${outputFile}\n`);
  } else process.stdout.write(report);
  if (options.failOnCycle && result.cycles.length > 0) process.exitCode = 2;
}

run().catch((error: unknown) => {
  process.stderr.write(`depgraph-lite: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

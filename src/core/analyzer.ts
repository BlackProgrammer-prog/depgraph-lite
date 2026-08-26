import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { detectCycles } from "./cycles.js";
import { discoverSourceFiles } from "./discovery.js";
import { DependencyGraphStore } from "./graph.js";
import { calculateMetrics } from "./metrics.js";
import { parseDependencies } from "./parser.js";
import { externalPackageName, ImportResolver } from "./resolver.js";
import { normalizeAbsolutePath, relativeModuleId } from "../shared/path.js";
import type { AnalysisResult, AnalyzeOptions, ParsedDependency } from "../shared/types.js";

interface ParsedFile {
  path: string;
  dependencies: ParsedDependency[];
}

export async function analyzeProject(options: AnalyzeOptions): Promise<AnalysisResult> {
  const startedAt = performance.now();
  const inputPath = normalizeAbsolutePath(options.root);
  const files = await discoverSourceFiles(inputPath, options.ignore);
  const root = files.length === 1 && files[0] === inputPath ? normalizeAbsolutePath(path.dirname(inputPath)) : inputPath;
  const knownFiles = new Set(files);
  const warnings: AnalysisResult["warnings"] = [];
  const parsedFiles: ParsedFile[] = [];

  // Batches cap simultaneous reads without adding a concurrency dependency.
  const concurrency = 32;
  for (let offset = 0; offset < files.length; offset += concurrency) {
    const batch = files.slice(offset, offset + concurrency);
    const results = await Promise.all(batch.map(async (file): Promise<ParsedFile> => {
      const source = await readFile(file, "utf8");
      try {
        return { path: file, dependencies: parseDependencies(source, file, options.includeTypeImports) };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push({ file: relativeModuleId(root, file), code: "PARSE_ERROR", message });
        return { path: file, dependencies: [] };
      }
    }));
    parsedFiles.push(...results);
  }

  const graphStore = new DependencyGraphStore();
  parsedFiles.forEach((file) => graphStore.addNode({
    id: relativeModuleId(root, file.path),
    path: file.path,
    extension: path.extname(file.path),
    externalDependencies: []
  }));

  const resolver = new ImportResolver();
  const unresolved: AnalysisResult["unresolved"] = [];
  for (const file of parsedFiles) {
    const from = relativeModuleId(root, file.path);
    const node = graphStore.getNode(from);
    if (!node) continue;
    for (const dependency of file.dependencies) {
      const resolution = await resolver.resolve(file.path, dependency.source);
      if (resolution.external) {
        const packageName = externalPackageName(dependency.source);
        if (!node.externalDependencies.includes(packageName)) node.externalDependencies.push(packageName);
      } else if (resolution.resolved && knownFiles.has(resolution.resolved)) {
        graphStore.addEdge({ from, to: relativeModuleId(root, resolution.resolved), type: dependency.type });
      } else unresolved.push({ from, source: dependency.source });
    }
    node.externalDependencies.sort();
  }

  const graph = graphStore.toGraph();
  const cycles = detectCycles(graph);
  return {
    root,
    graph,
    cycles,
    metrics: calculateMetrics(graph, cycles),
    durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    warnings: warnings.sort((left, right) => (left.file ?? "").localeCompare(right.file ?? "")),
    unresolved: unresolved.sort((left, right) => `${left.from}\0${left.source}`.localeCompare(`${right.from}\0${right.source}`))
  };
}

import type { AnalysisResult } from "../shared/types.js";

export function serializeResult(result: AnalysisResult): object {
  return {
    root: result.root,
    metrics: result.metrics,
    cycles: result.cycles.map((cycle) => cycle.nodes),
    modules: [...result.graph.nodes.values()].map((node) => ({
      id: node.id,
      extension: node.extension,
      dependencies: node.dependencies,
      externalDependencies: node.externalDependencies,
      inDegree: node.inDegree,
      outDegree: node.outDegree
    })),
    edges: result.graph.edges,
    unresolved: result.unresolved,
    warnings: result.warnings,
    durationMs: result.durationMs
  };
}

export function generateJsonReport(result: AnalysisResult): string {
  return `${JSON.stringify(serializeResult(result), null, 2)}\n`;
}

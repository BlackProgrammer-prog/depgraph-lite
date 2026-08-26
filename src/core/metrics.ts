import type { DependencyCycle, DependencyGraph, GraphMetrics } from "../shared/types.js";

export function calculateMetrics(graph: DependencyGraph, cycles: DependencyCycle[]): GraphMetrics {
  const nodes = [...graph.nodes.values()];
  const externalPackages = new Set(nodes.flatMap((node) => node.externalDependencies));
  return {
    files: nodes.length,
    edges: graph.edges.length,
    externalPackages: externalPackages.size,
    entryPoints: nodes.filter((node) => node.inDegree === 0).length,
    leafModules: nodes.filter((node) => node.outDegree === 0).length,
    circularDependencies: cycles.length,
    maxDependencies: Math.max(0, ...nodes.map((node) => node.outDegree)),
    maxDependents: Math.max(0, ...nodes.map((node) => node.inDegree))
  };
}

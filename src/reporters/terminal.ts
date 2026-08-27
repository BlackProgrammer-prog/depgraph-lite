import type { AnalysisResult } from "../shared/types.js";

const colors = {
  cyan: (text: string) => `\u001b[36m${text}\u001b[0m`,
  green: (text: string) => `\u001b[32m${text}\u001b[0m`,
  yellow: (text: string) => `\u001b[33m${text}\u001b[0m`,
  red: (text: string) => `\u001b[31m${text}\u001b[0m`,
  dim: (text: string) => `\u001b[2m${text}\u001b[0m`
};

function metric(label: string, value: number): string {
  return `${label.padEnd(25)}${String(value).padStart(6)}`;
}

export function generateTerminalReport(result: AnalysisResult, useColor = true): string {
  const paint = useColor
    ? colors
    : Object.fromEntries(Object.keys(colors).map((key) => [key, (text: string) => text])) as typeof colors;
  const { metrics } = result;
  const hotspots = [...result.graph.nodes.values()]
    .filter((node) => node.inDegree > 0)
    .sort((left, right) => right.inDegree - left.inDegree || left.id.localeCompare(right.id))
    .slice(0, 5);
  const lines = [
    "",
    paint.cyan("DepGraph Lite"),
    paint.dim("────────────────────────────────────"),
    "",
    "Project",
    metric("Files", metrics.files),
    metric("Internal dependencies", metrics.edges),
    metric("External packages", metrics.externalPackages),
    "",
    "Graph",
    metric("Entry points", metrics.entryPoints),
    metric("Leaf modules", metrics.leafModules),
    metric("Circular dependencies", metrics.circularDependencies)
  ];

  if (metrics.files === 1 && metrics.edges === 0) {
    lines.push(
      "",
      paint.yellow("Only one source file was analyzed."),
      "Dependency graphs become useful when the target contains multiple modules with import/export or require() links."
    );
  }

  if (hotspots.length > 0) {
    lines.push("", "Most depended-on modules", "");
    hotspots.forEach((node) => lines.push(`${String(node.inDegree).padStart(4)}  ${node.id}`));
  }
  if (result.cycles.length > 0) {
    lines.push("", paint.red("Cycles"));
    result.cycles.forEach((cycle, index) => {
      lines.push("", `${index + 1}.`, cycle.nodes.map((node, nodeIndex) => `${nodeIndex === 0 ? "" : " → "}${node}`).join("\n"));
    });
  } else lines.push("", paint.green("No circular dependencies found."));

  if (result.warnings.length > 0) {
    lines.push("", paint.yellow(`Warnings (${result.warnings.length})`));
    result.warnings.slice(0, 10).forEach((warning) => lines.push(`  ${warning.file ?? "project"}: ${warning.message}`));
  }
  if (result.unresolved.length > 0) {
    lines.push("", paint.yellow(`Unresolved local imports (${result.unresolved.length})`));
    result.unresolved.slice(0, 10).forEach((item) => lines.push(`  ${item.from} → ${item.source}`));
  }
  lines.push("", paint.dim(`Completed in ${result.durationMs} ms`));
  return `${lines.join("\n")}\n`;
}

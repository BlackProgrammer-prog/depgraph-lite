export { analyzeProject } from "./core/analyzer.js";
export { detectCycles } from "./core/cycles.js";
export { calculateMetrics } from "./core/metrics.js";
export { parseDependencies } from "./core/parser.js";
export { generateHtmlReport } from "./reporters/html.js";
export { generateJsonReport } from "./reporters/json.js";
export { generateTerminalReport } from "./reporters/terminal.js";
export type {
  AnalysisResult,
  AnalysisWarning,
  AnalyzeOptions,
  DependencyCycle,
  DependencyEdge,
  DependencyGraph,
  DependencyType,
  GraphMetrics,
  ModuleId,
  ModuleNode,
  ParsedDependency
} from "./shared/types.js";

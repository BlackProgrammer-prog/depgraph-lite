export type ModuleId = string;

export type DependencyType = "static-import" | "dynamic-import" | "require" | "re-export";

export interface ParsedDependency {
  source: string;
  type: DependencyType;
}

export interface ModuleNode {
  id: ModuleId;
  path: string;
  extension: string;
  dependencies: ModuleId[];
  externalDependencies: string[];
  inDegree: number;
  outDegree: number;
}

export interface DependencyEdge {
  from: ModuleId;
  to: ModuleId;
  type: DependencyType;
}

export interface DependencyGraph {
  nodes: Map<ModuleId, ModuleNode>;
  edges: DependencyEdge[];
}

export interface DependencyCycle {
  nodes: ModuleId[];
}

export interface GraphMetrics {
  files: number;
  edges: number;
  externalPackages: number;
  entryPoints: number;
  leafModules: number;
  circularDependencies: number;
  maxDependencies: number;
  maxDependents: number;
}

export interface AnalysisWarning {
  file?: string;
  code: string;
  message: string;
}

export interface AnalysisResult {
  root: string;
  graph: DependencyGraph;
  cycles: DependencyCycle[];
  metrics: GraphMetrics;
  durationMs: number;
  warnings: AnalysisWarning[];
  unresolved: Array<{ from: ModuleId; source: string }>;
}

export interface AnalyzeOptions {
  root: string;
  ignore?: string[];
  includeTypeImports?: boolean;
}

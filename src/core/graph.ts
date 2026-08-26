import type { DependencyEdge, DependencyGraph, ModuleId, ModuleNode } from "../shared/types.js";

export class DependencyGraphStore {
  private readonly nodes = new Map<ModuleId, ModuleNode>();
  private readonly edges: DependencyEdge[] = [];
  private readonly edgeKeys = new Set<string>();

  addNode(node: Omit<ModuleNode, "dependencies" | "inDegree" | "outDegree">): void {
    if (!this.nodes.has(node.id)) this.nodes.set(node.id, { ...node, dependencies: [], inDegree: 0, outDegree: 0 });
  }

  addEdge(edge: DependencyEdge): void {
    const key = `${edge.from}\0${edge.to}`;
    if (this.edgeKeys.has(key)) return;
    const source = this.nodes.get(edge.from);
    const target = this.nodes.get(edge.to);
    if (!source || !target) throw new Error(`Cannot add an edge for an unknown module: ${edge.from} -> ${edge.to}`);
    this.edgeKeys.add(key);
    this.edges.push(edge);
    if (!source.dependencies.includes(edge.to)) {
      source.dependencies.push(edge.to);
      source.dependencies.sort();
      source.outDegree += 1;
      target.inDegree += 1;
    }
  }

  getDependencies(id: ModuleId): readonly ModuleId[] {
    return this.nodes.get(id)?.dependencies ?? [];
  }

  getNode(id: ModuleId): ModuleNode | undefined {
    return this.nodes.get(id);
  }

  getDependents(id: ModuleId): ModuleId[] {
    return [...this.nodes.values()].filter((node) => node.dependencies.includes(id)).map((node) => node.id).sort();
  }

  getNodes(): ModuleNode[] {
    return [...this.nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  }

  getEdges(): DependencyEdge[] {
    return [...this.edges].sort((left, right) => `${left.from}\0${left.to}\0${left.type}`.localeCompare(`${right.from}\0${right.to}\0${right.type}`));
  }

  toGraph(): DependencyGraph {
    return { nodes: new Map(this.getNodes().map((node) => [node.id, node])), edges: this.getEdges() };
  }
}

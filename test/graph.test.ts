import { describe, expect, it } from "vitest";
import { DependencyGraphStore } from "../src/core/graph.js";
import { calculateMetrics } from "../src/core/metrics.js";

function addNode(graph: DependencyGraphStore, id: string): void {
  graph.addNode({ id, path: `/project/${id}`, extension: ".ts", externalDependencies: [] });
}

describe("DependencyGraphStore", () => {
  it("tracks adjacency, degrees, dependents, and stable edges", () => {
    const store = new DependencyGraphStore();
    ["a", "b", "c"].forEach((id) => addNode(store, id));
    store.addEdge({ from: "a", to: "b", type: "static-import" });
    store.addEdge({ from: "a", to: "c", type: "static-import" });
    store.addEdge({ from: "b", to: "c", type: "static-import" });
    expect(store.getDependencies("a")).toEqual(["b", "c"]);
    expect(store.getDependents("c")).toEqual(["a", "b"]);
    expect(store.getNode("a")?.outDegree).toBe(2);
    expect(store.getNode("c")?.inDegree).toBe(2);
    expect(store.getEdges()).toHaveLength(3);
  });

  it("calculates entry, leaf, package, and degree metrics", () => {
    const store = new DependencyGraphStore();
    store.addNode({ id: "a", path: "/a", extension: ".ts", externalDependencies: ["react"] });
    store.addNode({ id: "b", path: "/b", extension: ".ts", externalDependencies: ["react", "zod"] });
    store.addEdge({ from: "a", to: "b", type: "static-import" });
    expect(calculateMetrics(store.toGraph(), [])).toEqual({
      files: 2, edges: 1, externalPackages: 2, entryPoints: 1, leafModules: 1,
      circularDependencies: 0, maxDependencies: 1, maxDependents: 1
    });
  });
});

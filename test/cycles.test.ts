import { describe, expect, it } from "vitest";
import { detectCycles } from "../src/core/cycles.js";
import { DependencyGraphStore } from "../src/core/graph.js";

function graphWithEdges(edges: Array<[string, string]>): ReturnType<DependencyGraphStore["toGraph"]> {
  const store = new DependencyGraphStore();
  const ids = new Set(edges.flat());
  ids.forEach((id) => store.addNode({ id, path: id, extension: ".ts", externalDependencies: [] }));
  edges.forEach(([from, to]) => store.addEdge({ from, to, type: "static-import" }));
  return store.toGraph();
}

describe("detectCycles", () => {
  it("returns no cycles for an acyclic graph", () => {
    expect(detectCycles(graphWithEdges([["a", "b"], ["b", "c"]]))).toEqual([]);
  });

  it("returns canonical actual paths for simple and long cycles", () => {
    const graph = graphWithEdges([["a", "b"], ["b", "a"], ["c", "d"], ["d", "e"], ["e", "c"]]);
    expect(detectCycles(graph)).toEqual([
      { nodes: ["a", "b", "a"] },
      { nodes: ["c", "d", "e", "c"] }
    ]);
  });
});

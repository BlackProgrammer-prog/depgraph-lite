import type { DependencyCycle, DependencyGraph, ModuleId } from "../shared/types.js";

function canonicalizeCycle(nodes: ModuleId[]): DependencyCycle {
  const ring = nodes.at(-1) === nodes[0] ? nodes.slice(0, -1) : [...nodes];
  let smallestIndex = 0;
  for (let index = 1; index < ring.length; index += 1) {
    if ((ring[index] ?? "").localeCompare(ring[smallestIndex] ?? "") < 0) smallestIndex = index;
  }
  const rotated = [...ring.slice(smallestIndex), ...ring.slice(0, smallestIndex)];
  return { nodes: [...rotated, rotated[0] ?? ""] };
}

export function detectCycles(graph: DependencyGraph): DependencyCycle[] {
  const state = new Map<ModuleId, "gray" | "black">();
  const stack: ModuleId[] = [];
  const cycleKeys = new Set<string>();
  const cycles: DependencyCycle[] = [];

  function visit(id: ModuleId): void {
    state.set(id, "gray");
    stack.push(id);
    for (const dependency of graph.nodes.get(id)?.dependencies ?? []) {
      if (!state.has(dependency)) visit(dependency);
      else if (state.get(dependency) === "gray") {
        const cycleStart = stack.lastIndexOf(dependency);
        const cycle = canonicalizeCycle([...stack.slice(cycleStart), dependency]);
        const key = cycle.nodes.slice(0, -1).join("\0");
        if (!cycleKeys.has(key)) {
          cycleKeys.add(key);
          cycles.push(cycle);
        }
      }
    }
    stack.pop();
    state.set(id, "black");
  }

  for (const id of [...graph.nodes.keys()].sort()) if (!state.has(id)) visit(id);
  return cycles.sort((left, right) => left.nodes.join("\0").localeCompare(right.nodes.join("\0")));
}

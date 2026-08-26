import { HTML_GRAPH_NODE_LIMIT } from "../shared/constants.js";
import type { AnalysisResult, ModuleNode } from "../shared/types.js";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function renderGraph(result: AnalysisResult): string {
  const nodes = [...result.graph.nodes.values()].slice(0, HTML_GRAPH_NODE_LIMIT);
  if (nodes.length === 0) return "<p class=\"muted\">No source modules found.</p>";
  const included = new Set(nodes.map((node) => node.id));
  const width = 900;
  const height = Math.max(480, Math.ceil(nodes.length / 10) * 90);
  const columns = Math.min(10, Math.ceil(Math.sqrt(nodes.length * 1.8)));
  const positions = new Map(nodes.map((node, index) => [node.id, {
    x: 70 + (index % columns) * ((width - 140) / Math.max(1, columns - 1)),
    y: 55 + Math.floor(index / columns) * 90
  }]));
  const cyclicNodes = new Set(result.cycles.flatMap((cycle) => cycle.nodes));
  const edges = result.graph.edges.filter((edge) => included.has(edge.from) && included.has(edge.to)).map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return "";
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" marker-end="url(#arrow)" />`;
  }).join("");
  const nodeElements = nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return "";
    const label = node.id.length > 24 ? `…${node.id.slice(-23)}` : node.id;
    return `<g class="node${cyclicNodes.has(node.id) ? " cycle" : ""}"><circle cx="${position.x}" cy="${position.y}" r="22"/><title>${escapeHtml(node.id)}</title><text x="${position.x}" y="${position.y + 37}" text-anchor="middle">${escapeHtml(label)}</text></g>`;
  }).join("");
  const notice = result.graph.nodes.size > HTML_GRAPH_NODE_LIMIT
    ? `<p class="notice">Graph visualization limited to the first ${HTML_GRAPH_NODE_LIMIT} modules. Full statistics are shown below.</p>`
    : "";
  return `${notice}<div class="graph"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Module dependency graph"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="26" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z"/></marker></defs>${edges}${nodeElements}</svg></div>`;
}

function hotspotRows(nodes: ModuleNode[]): string {
  return nodes
    .sort((left, right) => right.inDegree - left.inDegree || right.outDegree - left.outDegree || left.id.localeCompare(right.id))
    .slice(0, 20)
    .map((node) => `<tr><td><code>${escapeHtml(node.id)}</code></td><td>${node.inDegree}</td><td>${node.outDegree}</td><td>${node.externalDependencies.length}</td></tr>`)
    .join("");
}

export function generateHtmlReport(result: AnalysisResult): string {
  const metrics = [
    ["Files", result.metrics.files], ["Dependencies", result.metrics.edges],
    ["External packages", result.metrics.externalPackages], ["Circular dependencies", result.metrics.circularDependencies]
  ];
  const cycles = result.cycles.length > 0
    ? result.cycles.map((cycle, index) => `<article class="cycle-card"><strong>Cycle ${index + 1}</strong>${cycle.nodes.map((node) => `<code>${escapeHtml(node)}</code>`).join("<span>↓</span>")}</article>`).join("")
    : "<p class=\"healthy\">No circular dependencies found.</p>";
  const cards = metrics.map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DepGraph Lite report</title><style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#141b2d;--muted:#91a0bd;--line:#293654;--accent:#67e8f9;--ok:#86efac;--danger:#fb7185}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#edf2ff;font:15px/1.6 ui-sans-serif,system-ui,sans-serif}main{width:min(1100px,calc(100% - 32px));margin:48px auto}h1{margin:0;font-size:30px}header p,.muted{color:var(--muted);margin:3px 0}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.cards article,section,.cycle-card{background:var(--panel);border:1px solid var(--line);border-radius:12px}.cards article{padding:18px}.cards strong{display:block;color:var(--accent);font-size:25px}.cards span{color:var(--muted)}section{padding:20px;margin-top:18px;overflow:hidden}h2{font-size:18px;margin:0 0 14px}.graph{overflow:auto;border:1px solid var(--line);border-radius:8px;background:#0d1426}.graph svg{display:block;min-width:760px}line{stroke:#435171;stroke-width:1.2}marker path{fill:#607092}.node circle{fill:#273451;stroke:#7583a3}.node.cycle circle{fill:#4c2132;stroke:var(--danger);stroke-width:2}.node text{fill:#cbd5e1;font-size:10px}.healthy{color:var(--ok)}.notice{color:#facc15}.cycles{display:grid;gap:10px}.cycle-card{display:flex;flex-direction:column;padding:14px}.cycle-card span{color:var(--danger);padding-left:12px}code{color:#c4b5fd}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid var(--line);padding:9px}th{color:var(--muted);font-weight:500}@media(max-width:650px){.cards{grid-template-columns:1fr 1fr}main{margin-top:24px}}
</style></head><body><main><header><h1>DepGraph Lite</h1><p>${escapeHtml(result.root)}</p><p>Analyzed in ${result.durationMs} ms</p></header><div class="cards">${cards}</div><section><h2>Dependency graph</h2>${renderGraph(result)}</section><section><h2>Hotspot modules</h2><table><thead><tr><th>Module</th><th>Imported by</th><th>Imports</th><th>Packages</th></tr></thead><tbody>${hotspotRows([...result.graph.nodes.values()])}</tbody></table></section><section><h2>Circular dependencies</h2><div class="cycles">${cycles}</div></section><section><h2>Project statistics</h2><p>Entry points: <strong>${result.metrics.entryPoints}</strong> · Leaf modules: <strong>${result.metrics.leafModules}</strong> · Maximum fan-in: <strong>${result.metrics.maxDependents}</strong> · Maximum fan-out: <strong>${result.metrics.maxDependencies}</strong></p></section></main></body></html>`;
}

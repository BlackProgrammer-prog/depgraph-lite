export const SOURCE_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"
] as const;

export const IGNORED_DIRECTORIES = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".next", ".nuxt", "out", ".cache"
]);

export const HTML_GRAPH_NODE_LIMIT = 150;

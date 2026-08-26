import path from "node:path";

export function normalizeAbsolutePath(value: string): string {
  return path.resolve(value).replaceAll("\\", "/");
}

export function relativeModuleId(root: string, value: string): string {
  return path.relative(root, value).replaceAll("\\", "/") || path.basename(value);
}

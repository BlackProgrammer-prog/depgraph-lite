import { stat } from "node:fs/promises";
import path from "node:path";
import { SOURCE_EXTENSIONS } from "../shared/constants.js";
import { normalizeAbsolutePath } from "../shared/path.js";

export interface Resolution {
  resolved: string | null;
  external: boolean;
}

export function externalPackageName(source: string): string {
  const parts = source.split("/");
  return source.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0] ?? source;
}

export class ImportResolver {
  private readonly cache = new Map<string, string | null>();

  async resolve(importer: string, source: string): Promise<Resolution> {
    if (!source.startsWith(".") && !path.isAbsolute(source)) return { resolved: null, external: true };
    const importerDirectory = path.dirname(importer);
    const cacheKey = `${normalizeAbsolutePath(importerDirectory)}|${source}`;
    if (this.cache.has(cacheKey)) return { resolved: this.cache.get(cacheKey) ?? null, external: false };

    const basePath = normalizeAbsolutePath(path.resolve(importerDirectory, source));
    const suppliedExtension = path.extname(basePath);
    const candidates = [basePath];
    if (!suppliedExtension) {
      SOURCE_EXTENSIONS.forEach((extension) => candidates.push(`${basePath}${extension}`));
      SOURCE_EXTENSIONS.forEach((extension) => candidates.push(`${basePath}/index${extension}`));
    } else if ([".js", ".jsx", ".mjs", ".cjs"].includes(suppliedExtension)) {
      const stem = basePath.slice(0, -suppliedExtension.length);
      SOURCE_EXTENSIONS.forEach((extension) => candidates.push(`${stem}${extension}`));
    }

    for (const candidate of candidates) {
      try {
        if ((await stat(candidate)).isFile()) {
          const resolved = normalizeAbsolutePath(candidate);
          this.cache.set(cacheKey, resolved);
          return { resolved, external: false };
        }
      } catch (error: unknown) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
      }
    }
    this.cache.set(cacheKey, null);
    return { resolved: null, external: false };
  }
}

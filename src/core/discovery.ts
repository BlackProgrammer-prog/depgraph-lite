import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { IGNORED_DIRECTORIES, SOURCE_EXTENSIONS } from "../shared/constants.js";
import { normalizeAbsolutePath } from "../shared/path.js";

function globToRegExp(glob: string): RegExp {
  const normalized = glob.replaceAll("\\", "/").replace(/^\.\//, "");
  let expression = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index] ?? "";
    if (character === "*" && normalized[index + 1] === "*" && normalized[index + 2] === "/") {
      expression += "(?:.*/)?";
      index += 2;
    } else if (character === "*" && normalized[index + 1] === "*") {
      expression += ".*";
      index += 1;
    } else if (character === "*") expression += "[^/]*";
    else if (character === "?") expression += "[^/]";
    else expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }
  return new RegExp(`^(?:${expression})(?:/.*)?$`);
}

export async function discoverSourceFiles(root: string, ignore: string[] = []): Promise<string[]> {
  const absoluteRoot = normalizeAbsolutePath(root);
  const rootStats = await stat(absoluteRoot);
  if (rootStats.isFile()) {
    return SOURCE_EXTENSIONS.includes(path.extname(absoluteRoot) as typeof SOURCE_EXTENSIONS[number])
      ? [absoluteRoot]
      : [];
  }

  const ignoredPatterns = ignore.map(globToRegExp);
  const files: string[] = [];
  const pending = [absoluteRoot];

  // Directory traversal is iterative to avoid a large recursive Promise.all on big repositories.
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink() || (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name))) continue;
      const absolutePath = normalizeAbsolutePath(path.join(directory, entry.name));
      const relativePath = path.relative(absoluteRoot, absolutePath).replaceAll("\\", "/");
      if (ignoredPatterns.some((pattern) => pattern.test(relativePath))) continue;
      if (entry.isDirectory()) pending.push(absolutePath);
      else if (entry.isFile() && SOURCE_EXTENSIONS.includes(path.extname(entry.name) as typeof SOURCE_EXTENSIONS[number])) {
        files.push(absolutePath);
      }
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

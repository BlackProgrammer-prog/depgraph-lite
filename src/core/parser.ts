import { parse, type ParserPlugin } from "@babel/parser";
import path from "node:path";
import type { ParsedDependency } from "../shared/types.js";

interface AstNode {
  type?: string;
  source?: { type?: string; value?: unknown };
  importKind?: string;
  exportKind?: string;
  callee?: { type?: string; name?: string };
  arguments?: Array<{ type?: string; value?: unknown }>;
  [key: string]: unknown;
}

function parserPlugins(filename: string): ParserPlugin[] {
  const extension = path.extname(filename);
  const plugins: ParserPlugin[] = ["dynamicImport", "decorators-legacy", "importAttributes"];
  if ([".ts", ".tsx", ".mts", ".cts"].includes(extension)) plugins.push("typescript");
  if ([".jsx", ".tsx"].includes(extension)) plugins.push("jsx");
  return plugins;
}

function stringSource(node: AstNode["source"]): string | null {
  return node?.type === "StringLiteral" && typeof node.value === "string" ? node.value : null;
}

export function parseDependencies(
  source: string,
  filename: string,
  includeTypeImports = false
): ParsedDependency[] {
  const ast = parse(source, {
    sourceType: "unambiguous",
    sourceFilename: filename,
    errorRecovery: false,
    plugins: parserPlugins(filename)
  });
  const dependencies: ParsedDependency[] = [];
  const seen = new Set<string>();

  function add(dependencySource: string | null, type: ParsedDependency["type"]): void {
    if (!dependencySource) return;
    const key = `${type}:${dependencySource}`;
    if (!seen.has(key)) {
      seen.add(key);
      dependencies.push({ source: dependencySource, type });
    }
  }

  function visit(value: unknown): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const node = value as AstNode;
    if (node.type === "ImportDeclaration") {
      if (includeTypeImports || node.importKind !== "type") add(stringSource(node.source), "static-import");
      return;
    }
    if (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
      if (includeTypeImports || node.exportKind !== "type") add(stringSource(node.source), "re-export");
    } else if (node.type === "ImportExpression") {
      add(stringSource(node.source), "dynamic-import");
      return;
    } else if (node.type === "CallExpression") {
      const firstArgument = node.arguments?.[0];
      const literal = firstArgument?.type === "StringLiteral" && typeof firstArgument.value === "string"
        ? firstArgument.value
        : null;
      if (node.callee?.type === "Import") add(literal, "dynamic-import");
      else if (node.callee?.type === "Identifier" && node.callee.name === "require") add(literal, "require");
    }
    Object.values(node).forEach(visit);
  }

  visit(ast.program);
  return dependencies;
}

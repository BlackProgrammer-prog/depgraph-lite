export interface CliOptions {
  root: string;
  output: "terminal" | "json" | "html";
  outputFile?: string;
  ignore: string[];
  includeTypes: boolean;
  failOnCycle: boolean;
  color: boolean;
}

function requiredValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) throw new Error(`${flag} expects a value`);
  return value;
}

export function parseCliOptions(args: string[]): CliOptions | "help" | "version" {
  const options: CliOptions = { root: ".", output: "terminal", ignore: [], includeTypes: false, failOnCycle: false, color: true };
  let hasRoot = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] ?? "";
    if (argument === "--help" || argument === "-h") return "help";
    if (argument === "--version" || argument === "-v") return "version";
    if (argument === "--json") options.output = "json";
    else if (argument === "--html") {
      options.output = "html";
      const possibleFile = args[index + 1];
      if (possibleFile && !possibleFile.startsWith("-")) {
        options.outputFile = possibleFile;
        index += 1;
      } else options.outputFile = "depgraph-report.html";
    } else if (argument === "--format" || argument === "-f") {
      const format = requiredValue(args, index, argument);
      if (!(["terminal", "json", "html"] as string[]).includes(format)) throw new Error(`Unknown format: ${format}`);
      options.output = format as CliOptions["output"];
      index += 1;
    } else if (argument === "--output" || argument === "-o") {
      options.outputFile = requiredValue(args, index, argument);
      index += 1;
    } else if (argument === "--ignore" || argument === "-i") {
      options.ignore.push(requiredValue(args, index, argument));
      index += 1;
    } else if (argument === "--include-types") options.includeTypes = true;
    else if (argument === "--fail-on-cycle") options.failOnCycle = true;
    else if (argument === "--no-color") options.color = false;
    else if (argument.startsWith("-")) throw new Error(`Unknown option: ${argument}`);
    else if (!hasRoot) {
      options.root = argument;
      hasRoot = true;
    } else throw new Error(`Unexpected argument: ${argument}`);
  }
  return options;
}

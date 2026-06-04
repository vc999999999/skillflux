#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  buildHarnessRequest,
  currentSession,
  detectRequestShape,
  loadHarnessConfig,
  resetSession,
  runLegalWriterCheck
} from "../../core/src/index.ts";

type JsonObject = Record<string, unknown>;

const [, , command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case "detect":
      writeJson({ request_type: detectRequestShape(readInput(args)) });
      return;
    case "check":
      writeJson(runLegalWriterCheck(JSON.stringify(readInput(args))));
      return;
    case "debug":
      writeJson(await buildHarnessRequest(readInput(args), {
        client: readFlag(args, "--client") ?? "http-proxy",
        sessionKey: readFlag(args, "--session-key") ?? "cli",
        config: loadHarnessConfig({})
      }));
      return;
    case "session":
      handleSession(args);
      return;
    case "doctor":
      writeJson({
        ok: true,
        profile: "legal-writer",
        supported_requests: ["chat", "claude", "responses"]
      });
      return;
    default:
      printHelp();
      process.exitCode = command ? 1 : 0;
  }
}

function handleSession(args: string[]): void {
  const action = args[0];
  const key = readFlag(args, "--session-key") ?? "cli";
  if (action === "reset") {
    resetSession(key);
    writeJson({ reset: true, session_key: key });
    return;
  }
  if (action === "current") {
    writeJson({ session_id: currentSession(key), session_key: key });
    return;
  }
  printHelp();
  process.exitCode = 1;
}

function readInput(args: string[]): JsonObject {
  const inputPath = readFlag(args, "--input");
  if (!inputPath) {
    throw new Error("missing --input <request.json>");
  }
  return JSON.parse(readFileSync(inputPath, "utf8")) as JsonObject;
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp(): void {
  process.stdout.write(`skillflux-harness

Commands:
  detect --input request.json
  check --input request.json
  debug --input request.json [--client codex]
  session current [--session-key key]
  session reset [--session-key key]
  doctor
`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

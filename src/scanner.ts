import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SWEAR_WORDS, APOLOGY_PATTERNS, SYCOPHANCY_PATTERNS, type Pattern } from "./patterns.js";

export interface Counts {
  swears: Record<string, number>;
  apologies: Record<string, number>;
  sycophancy: Record<string, number>;
  totalSwears: number;
  totalApologies: number;
  totalSycophancy: number;
  filesScanned: number;
  worstConversation: { project: string; swears: number } | null;
}

function countMatches(text: string, patterns: Pattern[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of patterns) {
    const matches = text.match(p.regex);
    if (matches) {
      counts[p.label] = (counts[p.label] || 0) + matches.length;
    }
  }
  return counts;
}

function mergeInto(target: Record<string, number>, source: Record<string, number>) {
  for (const [k, v] of Object.entries(source)) {
    target[k] = (target[k] || 0) + v;
  }
}

function findJsonlFiles(): string[] {
  const projectsDir = join(homedir(), ".claude", "projects");
  const files: string[] = [];

  try {
    for (const project of readdirSync(projectsDir)) {
      const projectPath = join(projectsDir, project);
      if (!statSync(projectPath).isDirectory()) continue;

      for (const file of readdirSync(projectPath)) {
        if (file.endsWith(".jsonl") && !file.includes("subagent")) {
          files.push(join(projectPath, file));
        }
      }
    }
  } catch {
    // ~/.claude/projects may not exist
  }

  return files;
}

function extractUserText(msg: any): string | null {
  if (msg.type !== "user") return null;
  // Skip tool results
  if (Array.isArray(msg.message?.content)) {
    return msg.message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join(" ");
  }
  if (typeof msg.message?.content === "string") return msg.message.content;
  if (typeof msg.message === "string") return msg.message;
  return null;
}

function extractAssistantText(msg: any): string | null {
  if (msg.type !== "assistant") return null;
  if (Array.isArray(msg.message?.content)) {
    return msg.message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join(" ");
  }
  if (typeof msg.message?.content === "string") return msg.message.content;
  return null;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function scan(): Counts {
  const counts: Counts = {
    swears: {},
    apologies: {},
    sycophancy: {},
    totalSwears: 0,
    totalApologies: 0,
    totalSycophancy: 0,
    filesScanned: 0,
    worstConversation: null,
  };

  const files = findJsonlFiles();
  counts.filesScanned = files.length;
  let frame = 0;

  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    process.stderr.write(`\r  ${SPINNER[frame++ % SPINNER.length]} Scanning ${fi + 1}/${files.length} conversations...`);
    let fileSwears = 0;
    const content = readFileSync(file, "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      let msg: any;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }

      const userText = extractUserText(msg);
      if (userText) {
        const matched = countMatches(userText, SWEAR_WORDS);
        mergeInto(counts.swears, matched);
        fileSwears += Object.values(matched).reduce((a, b) => a + b, 0);
      }

      const assistantText = extractAssistantText(msg);
      if (assistantText) {
        mergeInto(counts.apologies, countMatches(assistantText, APOLOGY_PATTERNS));
        mergeInto(counts.sycophancy, countMatches(assistantText, SYCOPHANCY_PATTERNS));
      }
    }

    if (fileSwears > 0 && (!counts.worstConversation || fileSwears > counts.worstConversation.swears)) {
      const project = file.split("/").slice(-2, -1)[0].replace(/-Users-[^-]+-/, "").replace(/-/g, "/");
      counts.worstConversation = { project, swears: fileSwears };
    }
  }

  process.stderr.write(`\r${" ".repeat(50)}\r`);

  counts.totalSwears = Object.values(counts.swears).reduce((a, b) => a + b, 0);
  counts.totalApologies = Object.values(counts.apologies).reduce((a, b) => a + b, 0);
  counts.totalSycophancy = Object.values(counts.sycophancy).reduce((a, b) => a + b, 0);

  return counts;
}

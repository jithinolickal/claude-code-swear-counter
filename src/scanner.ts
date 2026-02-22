import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SWEAR_WORDS, APOLOGY_PATTERNS, SYCOPHANCY_PATTERNS, type Pattern } from "./patterns.js";
import { findFuzzyMatches, getBaseSwearWords } from "./fuzzy.js";
import { detectIndirectSwearing } from "./semantic.js";

export interface Counts {
  swears: Record<string, number>;
  apologies: Record<string, number>;
  sycophancy: Record<string, number>;
  fuzzyMatches: Record<string, number>;
  indirectSwearing: number;
  totalSwears: number;
  totalApologies: number;
  totalSycophancy: number;
  filesScanned: number;
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

export function scan(): Counts {
  const counts: Counts = {
    swears: {},
    apologies: {},
    sycophancy: {},
    fuzzyMatches: {},
    indirectSwearing: 0,
    totalSwears: 0,
    totalApologies: 0,
    totalSycophancy: 0,
    filesScanned: 0,
  };

  const files = findJsonlFiles();
  counts.filesScanned = files.length;
  const baseSwearWords = getBaseSwearWords();

  for (const file of files) {
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
        // Original regex-based matching
        mergeInto(counts.swears, countMatches(userText, SWEAR_WORDS));

        // Fuzzy matching for obfuscated swear words
        const fuzzyMatches = findFuzzyMatches(userText, baseSwearWords, 0.7);
        for (const match of fuzzyMatches) {
          const label = `${match.label} (fuzzy)`;
          counts.fuzzyMatches[label] = (counts.fuzzyMatches[label] || 0) + 1;
        }

        // Semantic detection for indirect swearing
        const semantic = detectIndirectSwearing(userText, 0.5);
        if (semantic.totalScore > 0.5) {
          counts.indirectSwearing++;
        }
      }

      const assistantText = extractAssistantText(msg);
      if (assistantText) {
        mergeInto(counts.apologies, countMatches(assistantText, APOLOGY_PATTERNS));
        mergeInto(counts.sycophancy, countMatches(assistantText, SYCOPHANCY_PATTERNS));
      }
    }
  }

  counts.totalSwears = Object.values(counts.swears).reduce((a, b) => a + b, 0);
  counts.totalApologies = Object.values(counts.apologies).reduce((a, b) => a + b, 0);
  counts.totalSycophancy = Object.values(counts.sycophancy).reduce((a, b) => a + b, 0);

  return counts;
}

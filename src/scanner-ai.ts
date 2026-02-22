/**
 * AI-powered scanner using simple-engram for semantic detection
 * Requires: LLM API key (OpenAI, Anthropic, etc.)
 * Usage: --ai flag
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Counts } from "./scanner.js";

export interface AIConfig {
  llm: (prompt: string) => Promise<string>;
  embed?: (text: string) => Promise<number[]>;
}

/**
 * Analyze text using LLM to detect frustration/swearing
 */
async function analyzeWithLLM(text: string, llm: (prompt: string) => Promise<string>): Promise<{
  isSwearing: boolean;
  isIndirect: boolean;
  severity: number; // 0-1
  reason: string;
}> {
  const prompt = `Analyze this message for frustration, hostility, or swearing (direct or indirect).

Message: "${text}"

Respond in JSON format:
{
  "isSwearing": boolean,
  "isIndirect": boolean,
  "severity": 0-1 (0=polite, 1=very hostile),
  "reason": "brief explanation"
}

Consider:
- Direct swearing: fuck, shit, damn, etc.
- Obfuscated: f***k, $hit, a$$
- Indirect: "what is wrong with you", "this makes no sense", "are you serious"
- Frustration: "I give up", "this is unbelievable", hostil e imperatives
- Punctuation: multiple !!!, ???, ALL CAPS

JSON:`;

  try {
    const response = await llm(prompt);
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { isSwearing: false, isIndirect: false, severity: 0, reason: "parse error" };
  } catch (error) {
    return { isSwearing: false, isIndirect: false, severity: 0, reason: "error" };
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

export async function scanWithAI(config: AIConfig): Promise<Counts & {
  aiDetected: {
    direct: number;
    indirect: number;
    obfuscated: number;
    averageSeverity: number;
  };
}> {
  const counts: Counts & {
    aiDetected: {
      direct: number;
      indirect: number;
      obfuscated: number;
      averageSeverity: number;
    };
  } = {
    swears: {},
    apologies: {},
    sycophancy: {},
    fuzzyMatches: {},
    indirectSwearing: 0,
    totalSwears: 0,
    totalApologies: 0,
    totalSycophancy: 0,
    filesScanned: 0,
    aiDetected: {
      direct: 0,
      indirect: 0,
      obfuscated: 0,
      averageSeverity: 0,
    },
  };

  const files = findJsonlFiles();
  counts.filesScanned = files.length;

  let totalSeverity = 0;
  let severityCount = 0;

  console.log("🤖 Analyzing with AI (this may take a while)...\n");

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    let processed = 0;

    for (const line of lines) {
      let msg: any;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }

      const userText = extractUserText(msg);
      if (userText && userText.length > 10) {
        // Skip very short messages
        const analysis = await analyzeWithLLM(userText, config.llm);

        if (analysis.isSwearing) {
          if (analysis.isIndirect) {
            counts.aiDetected.indirect++;
            counts.indirectSwearing++;
          } else {
            counts.aiDetected.direct++;
          }

          totalSeverity += analysis.severity;
          severityCount++;
        }

        processed++;
        if (processed % 10 === 0) {
          process.stdout.write(`\rProcessed ${processed}/${lines.length} messages...`);
        }
      }
    }

    process.stdout.write(`\rProcessed ${processed}/${lines.length} messages ✓\n`);
  }

  if (severityCount > 0) {
    counts.aiDetected.averageSeverity = totalSeverity / severityCount;
  }

  counts.totalSwears = counts.aiDetected.direct + counts.aiDetected.indirect;

  return counts;
}

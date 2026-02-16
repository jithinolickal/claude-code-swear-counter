#!/usr/bin/env node

import { scan } from "./scanner.js";
import { report } from "./reporter.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  Usage: claude-code-swear-counter [options]

  Scans your Claude Code conversation logs for swearing and Claude's apologies.

  Options:
    --breakdown  Show full word-by-word breakdown tables
    --me         Only show your swearing
    --claude     Only show Claude's apologies/sycophancy
    --json       Output as JSON
    --help       Show this help
`);
  process.exit(0);
}

const meOnly = args.includes("--me");
const claudeOnly = args.includes("--claude");
const json = args.includes("--json");
const breakdown = args.includes("--breakdown");

const showUser = meOnly || !claudeOnly;
const showClaude = claudeOnly || !meOnly;

const counts = scan();
report(counts, { showUser, showClaude, json, breakdown });

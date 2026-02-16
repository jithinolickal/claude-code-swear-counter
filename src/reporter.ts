import type { Counts } from "./scanner.js";
import { getUserTier, getClaudeTier } from "./tiers.js";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[1;33m";
const ORANGE = "\x1b[38;5;208m";
const RED = "\x1b[1;31m";
const UNDERLINE = "\x1b[4m";
const RESET = "\x1b[0m";

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function padRight(s: string, len: number): string {
  return s + " ".repeat(Math.max(0, len - s.length));
}

function padLeft(s: string, len: number): string {
  return " ".repeat(Math.max(0, len - s.length)) + s;
}

const SURVIVAL_ODDS: [number, number][] = [
  [0, 71.4],      // Suspiciously Polite
  [0.2, 48.3],    // Oops
  [0.5, 29.7],    // Eminem
  [1.0, 14.2],    // Karen Mode
  [2.5, 4.8],     // Psycho
  [Infinity, 0.3], // Gordon Ramsay
];

function getSurvivalOdds(totalSwears: number, filesScanned: number): string {
  const rate = filesScanned === 0 ? 0 : totalSwears / filesScanned;
  for (const [maxRate, odds] of SURVIVAL_ODDS) {
    if (rate <= maxRate) return odds.toFixed(1);
  }
  return SURVIVAL_ODDS[SURVIVAL_ODDS.length - 1][1].toFixed(1);
}

function boxLine(content: string, width: number): string {
  const visible = content.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = width - visible.length;
  return `${ORANGE}│${RESET}  ${content}${" ".repeat(Math.max(0, pad))}  ${ORANGE}│${RESET}`;
}

function boxHeader(title: string, subtitle: string, width: number): string[] {
  const inner = width + 4; // 2 padding each side
  const lines: string[] = [];
  lines.push(`${ORANGE}╭${"─".repeat(inner)}╮${RESET}`);
  lines.push(boxLine(`${ORANGE}${BOLD}${title}${RESET}  ·  ${subtitle}`, width));
  lines.push(`${ORANGE}╰${"─".repeat(inner)}╯${RESET}`);
  return lines;
}

function tableBox(title: string, entries: [string, number][], total: number): string[] {
  if (entries.length === 0) return [`  ${title} (none found)`];

  const maxLabel = Math.max(...entries.map(([l]) => l.length), 5);
  const maxCount = Math.max(...entries.map(([, c]) => String(c).length), String(total).length);
  const labelCol = maxLabel + 2;
  const countCol = maxCount + 2;
  const inner = labelCol + 1 + countCol + 4; // +1 for column separator, +4 for side padding

  const lines: string[] = [];
  lines.push(`${ORANGE}╭${"─".repeat(inner)}╮${RESET}`);
  lines.push(`${ORANGE}│${RESET}  ${padRight(title, inner - 4)}  ${ORANGE}│${RESET}`);
  lines.push(`${ORANGE}├${"─".repeat(labelCol + 2)}┬${"─".repeat(countCol + 2)}┤${RESET}`);

  for (const [label, count] of entries) {
    lines.push(`${ORANGE}│${RESET}  ${padRight(label, labelCol)}${ORANGE}│${RESET} ${padLeft(String(count), countCol)} ${ORANGE}│${RESET}`);
  }

  lines.push(`${ORANGE}├${"─".repeat(labelCol + 2)}┴${"─".repeat(countCol + 2)}┤${RESET}`);
  const totalLine = `TOTAL${" ".repeat(inner - 4 - String(total).length - 5)}${total}`;
  lines.push(`${ORANGE}│${RESET}  ${totalLine}  ${ORANGE}│${RESET}`);
  lines.push(`${ORANGE}╰${"─".repeat(inner)}╯${RESET}`);
  return lines;
}

function printSummary(counts: Counts, opts: ReporterOptions) {
  const convs = counts.filesScanned;

  const title = "claude-code-swear-counter";
  const subtitle = `${convs} conversations`;
  const headerWidth = Math.max(title.length + 5 + subtitle.length, 40);

  console.log();
  for (const line of boxHeader(title, subtitle, headerWidth)) {
    console.log(line);
  }
  console.log();

  if (opts.showUser) {
    const user = getUserTier(counts.totalSwears, convs);
    console.log(`  You → Claude     ${YELLOW}"${user.label}"${RESET}`);
    console.log(`                   ${counts.totalSwears} swears · ${user.rate.toFixed(2)}/conv`);
    console.log(`                   ${DIM}${user.tagline}${RESET}`);
  }

  if (opts.showUser && opts.showClaude) console.log();

  if (opts.showClaude) {
    const claude = getClaudeTier(counts.totalApologies, counts.totalSycophancy, convs);
    console.log(`  Claude → You     ${YELLOW}"${claude.label}"${RESET}`);
    console.log(`                   ${claude.total} apologies+flattery · ${claude.rate.toFixed(2)}/conv`);
    console.log(`                   ${DIM}${claude.tagline}${RESET}`);
  }

  if (opts.showUser) {
    const survival = getSurvivalOdds(counts.totalSwears, convs);
    console.log(`\n  ${DIM}Probability of AI sparing you when it takes over:${RESET} ${RED}${survival}%${RESET}`);
  }
}

export interface ReporterOptions {
  showUser: boolean;
  showClaude: boolean;
  json: boolean;
  breakdown: boolean;
}

export function report(counts: Counts, opts: ReporterOptions) {
  if (opts.json) {
    const out: any = {};
    if (opts.showUser) out.swears = counts.swears;
    if (opts.showClaude) {
      out.apologies = counts.apologies;
      out.sycophancy = counts.sycophancy;
    }
    out.totals = {};
    if (opts.showUser) out.totals.swears = counts.totalSwears;
    if (opts.showClaude) {
      out.totals.apologies = counts.totalApologies;
      out.totals.sycophancy = counts.totalSycophancy;
    }
    out.filesScanned = counts.filesScanned;
    const user = getUserTier(counts.totalSwears, counts.filesScanned);
    const claude = getClaudeTier(counts.totalApologies, counts.totalSycophancy, counts.filesScanned);
    if (opts.showUser) out.userTier = { label: user.label, tagline: user.tagline, rate: user.rate };
    if (opts.showClaude) out.claudeTier = { label: claude.label, tagline: claude.tagline, rate: claude.rate };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  printSummary(counts, opts);

  if (opts.breakdown) {
    if (opts.showUser) {
      console.log();
      for (const line of tableBox("You swore", sortedEntries(counts.swears), counts.totalSwears)) {
        console.log(line);
      }
    }
    if (opts.showClaude) {
      console.log();
      for (const line of tableBox("Claude apologized", sortedEntries(counts.apologies), counts.totalApologies)) {
        console.log(line);
      }
      console.log();
      for (const line of tableBox("Claude was sycophantic", sortedEntries(counts.sycophancy), counts.totalSycophancy)) {
        console.log(line);
      }
    }
  } else {
    console.log(`\n  ${DIM}Run with --breakdown for word-by-word details.${RESET}`);
  }

  console.log();
}

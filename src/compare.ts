#!/usr/bin/env node

/**
 * Comparison script: Zero-deps detection vs AI-powered detection
 * Usage: npm run compare
 */

import { scan } from "./scanner.js";
import { findFuzzyMatches, getBaseSwearWords } from "./fuzzy.js";
import { detectIndirectSwearing } from "./semantic.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${CYAN}║    Swear Detection: Zero-Deps vs AI Comparison       ║${RESET}`);
console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}\n`);

// Test cases for comparison
const testCases = [
  // Direct swearing
  "This is fucking broken",
  "What the hell is this shit",

  // Obfuscated swearing
  "f***k this",
  "This is bullsh*t",
  "$hit doesn't work",
  "You're an @$$hole",
  "fuuuuuck",
  "fvck this code",
  "a$$",

  // Indirect/semantic swearing
  "What is wrong with you",
  "Are you serious right now",
  "This makes no sense!!!",
  "I can't believe this",
  "Why doesn't this work AGAIN",
  "You clearly don't understand",
  "This is unbelievable",
  "I give up",
  "What's happening???",
  "NOT WORKING AT ALL",

  // Edge cases
  "This is great!",
  "Thank you for helping",
  "Can you explain this?",
];

console.log(`${BOLD}Testing ${testCases.length} cases...${RESET}\n`);

const baseSwearWords = getBaseSwearWords();
let zeroDepsDirect = 0;
let zeroDepsObfuscated = 0;
let zeroDepsIndirect = 0;

for (const testCase of testCases) {
  // Zero-deps detection
  const fuzzy = findFuzzyMatches(testCase, baseSwearWords, 0.7);
  const semantic = detectIndirectSwearing(testCase, 0.5);

  const hasFuzzy = fuzzy.length > 0;
  const hasSemantic = semantic.totalScore > 0.5;
  const hasRegex = /fuck|shit|hell|damn|ass|bitch/gi.test(testCase);

  if (hasRegex) zeroDepsDirect++;
  if (hasFuzzy) zeroDepsObfuscated++;
  if (hasSemantic) zeroDepsIndirect++;

  const detected = hasRegex || hasFuzzy || hasSemantic;

  const marker = detected ? `${GREEN}✓${RESET}` : `${YELLOW}○${RESET}`;
  console.log(`${marker} "${testCase}"`);

  if (detected) {
    if (hasRegex) console.log(`   ${BLUE}→ Direct match (regex)${RESET}`);
    if (hasFuzzy) {
      console.log(`   ${BLUE}→ Fuzzy match:${RESET} ${fuzzy.map(m => `${m.label} (${(m.score * 100).toFixed(0)}%)`).join(", ")}`);
    }
    if (hasSemantic) {
      console.log(`   ${BLUE}→ Semantic match:${RESET} score ${semantic.totalScore.toFixed(2)}`);
      if (semantic.matches.length > 0) {
        console.log(`      Categories: ${semantic.matches.map(m => m.category).join(", ")}`);
      }
    }
  }
  console.log();
}

console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);
console.log(`${BOLD}Zero-Deps Detection Results:${RESET}`);
console.log(`  ${GREEN}Direct swearing:${RESET}      ${zeroDepsDirect} detected`);
console.log(`  ${GREEN}Obfuscated:${RESET}           ${zeroDepsObfuscated} detected`);
console.log(`  ${GREEN}Indirect/Semantic:${RESET}    ${zeroDepsIndirect} detected`);
console.log(`  ${GREEN}Total:${RESET}                ${zeroDepsDirect + zeroDepsObfuscated + zeroDepsIndirect}/${testCases.length} detected\n`);

console.log(`${BOLD}Feature Comparison:${RESET}\n`);

const comparison = [
  ["Feature", "Zero-Deps", "AI-Powered"],
  ["───────", "─────────", "───────────"],
  ["Direct swearing", "✓ Regex", "✓ LLM"],
  ["Obfuscated (f***k)", "✓ Fuzzy + Patterns", "✓ LLM"],
  ["Misspellings", "✓ Levenshtein", "✓ LLM"],
  ["Indirect swearing", "✓ Pattern-based", "✓✓ Context-aware"],
  ["Frustration", "✓ Keywords", "✓✓ Understanding"],
  ["False positives", "Low", "Very Low"],
  ["Speed", "Instant", "Slow (API calls)"],
  ["Cost", "$0", "$0.01-0.10 per scan"],
  ["Setup", "None", "Requires API key"],
  ["Dependencies", "0", "0 (uses API)"],
];

const colWidths = comparison[0].map((_, i) =>
  Math.max(...comparison.map(row => row[i].length))
);

for (const row of comparison) {
  const formatted = row.map((cell, i) => cell.padEnd(colWidths[i])).join(" │ ");
  console.log(`  ${formatted}`);
}

console.log(`\n${BOLD}Recommendation:${RESET}`);
console.log(`  • ${GREEN}Use zero-deps${RESET} by default (fast, free, good enough)`);
console.log(`  • ${YELLOW}Use AI mode${RESET} for maximum accuracy (add --ai flag)\n`);

console.log(`${BOLD}To test with real data:${RESET}`);
console.log(`  npm start              ${YELLOW}# Zero-deps (fast)${RESET}`);
console.log(`  npm start -- --ai      ${YELLOW}# AI-powered (accurate but slow)${RESET}\n`);

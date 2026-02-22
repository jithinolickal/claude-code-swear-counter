/**
 * Fuzzy matching for obfuscated and misspelled swear words
 * Zero dependencies - just good old string algorithms
 */

export interface FuzzyMatch {
  word: string;
  score: number; // 0-1, higher is better match
  label: string;
}

/**
 * Levenshtein distance - how many edits to transform one string into another
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize text for matching:
 * - Remove common obfuscation characters (*, @, $, etc.)
 * - Collapse repeated characters (f***k -> fk, fuuuuck -> fuck)
 * - Lowercase
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@$*#_\-]+/g, "") // Remove obfuscation symbols
    .replace(/(.)\1{2,}/g, "$1$1") // Collapse 3+ repeats to 2 (fuuuck -> fuuck)
    .trim();
}

/**
 * Check if a word is an obfuscated version of a swear word
 * Uses Levenshtein distance and character substitution patterns
 */
export function fuzzyMatch(
  word: string,
  targetWord: string,
  threshold: number = 0.7
): { match: boolean; score: number } {
  const normalizedWord = normalize(word);
  const normalizedTarget = normalize(targetWord);

  // Exact match after normalization
  if (normalizedWord === normalizedTarget) {
    return { match: true, score: 1.0 };
  }

  // Skip if lengths are too different
  if (Math.abs(normalizedWord.length - normalizedTarget.length) > 3) {
    return { match: false, score: 0 };
  }

  // Calculate similarity using Levenshtein distance
  const distance = levenshtein(normalizedWord, normalizedTarget);
  const maxLength = Math.max(normalizedWord.length, normalizedTarget.length);
  const similarity = 1 - distance / maxLength;

  return {
    match: similarity >= threshold,
    score: similarity,
  };
}

/**
 * Common character substitutions used in obfuscation
 */
const LEETSPEAK_MAP: Record<string, string[]> = {
  a: ["@", "4", "/-\\"],
  e: ["3"],
  i: ["1", "!", "|"],
  o: ["0"],
  s: ["$", "5"],
  t: ["7", "+"],
  l: ["1", "|"],
  g: ["9"],
  b: ["8"],
};

/**
 * Generate common leetspeak/obfuscation variants of a word
 */
function generateVariants(word: string): string[] {
  const variants: Set<string> = new Set([word]);
  const chars = word.toLowerCase().split("");

  // Generate single-character substitutions
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const substitutions = LEETSPEAK_MAP[char];
    if (substitutions) {
      for (const sub of substitutions) {
        const variant = chars.slice();
        variant[i] = sub;
        variants.add(variant.join(""));
      }
    }
  }

  // Generate with asterisks in the middle
  if (word.length > 3) {
    variants.add(word[0] + "***" + word.slice(-1));
    variants.add(word[0] + word[1] + "**" + word.slice(-1));
    variants.add(word.slice(0, 2) + "*".repeat(word.length - 3) + word.slice(-1));
  }

  return Array.from(variants);
}

/**
 * Pattern-based detection for creative obfuscations:
 * - f***k, f**k, fvck
 * - sh!t, $hit
 * - @ss, a$$
 */
export const OBFUSCATION_PATTERNS: { base: string; pattern: RegExp }[] = [
  { base: "fuck", pattern: /f[@u\*]{1,3}[ck\*]{1,2}/gi },
  { base: "shit", pattern: /[s\$][h\*]{0,2}[i!1\*][t\*]/gi },
  { base: "ass", pattern: /[@a][s\$]{1,2}/gi },
  { base: "damn", pattern: /d[@a][m\*]{1,2}n/gi },
  { base: "hell", pattern: /h[e3][l1|]{1,2}/gi },
  { base: "bitch", pattern: /b[i!1][t7][c\*]h/gi },
];

/**
 * Find all potential swear words in text using fuzzy matching
 */
export function findFuzzyMatches(
  text: string,
  swearWords: string[],
  threshold: number = 0.7
): FuzzyMatch[] {
  const words = text.toLowerCase().match(/\b[\w@$*#_\-]+\b/g) || [];
  const matches: FuzzyMatch[] = [];

  for (const word of words) {
    // Check exact patterns first
    for (const { base, pattern } of OBFUSCATION_PATTERNS) {
      if (pattern.test(word)) {
        matches.push({ word, score: 0.95, label: base });
        continue;
      }
    }

    // Then check fuzzy matching
    for (const swear of swearWords) {
      const result = fuzzyMatch(word, swear, threshold);
      if (result.match) {
        matches.push({ word, score: result.score, label: swear });
      }
    }
  }

  return matches;
}

/**
 * Get base swear words (without variations)
 */
export function getBaseSwearWords(): string[] {
  return [
    "fuck",
    "shit",
    "bullshit",
    "damn",
    "dammit",
    "goddamn",
    "hell",
    "crap",
    "asshole",
    "bitch",
    "pissed",
    "wtf",
    "ffs",
    "stfu",
    "stupid",
    "dumb",
    "dumbass",
    "idiot",
    "idiotic",
  ];
}

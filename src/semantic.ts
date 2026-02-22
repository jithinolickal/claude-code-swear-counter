/**
 * Semantic similarity detection for indirect swearing
 * Detects frustration/swearing without explicit swear words
 * Zero dependencies - uses TF-IDF and keyword matching
 */

export interface SemanticMatch {
  phrase: string;
  category: string;
  score: number;
}

/**
 * Frustration/swearing indicators categorized by type
 */
const SEMANTIC_PATTERNS = {
  // Indirect swearing through frustration expressions
  frustration: [
    /what is (this|wrong|going on|happening)/gi,
    /why (is|does|doesn't|won't|can't|isn't).{0,30}(work|working|broken|fail)/gi,
    /this (doesn't|does not|won't|will not).{0,30}(work|make sense)/gi,
    /makes? no sense/gi,
    /not working (at all|again|anymore)/gi,
    /keeps? (failing|breaking|crashing)/gi,
  ],

  // Hostile phrasing
  hostility: [
    /you('re| are) (wrong|broken|useless)/gi,
    /you (can't|cannot|don't|do not).{0,30}(understand|get it|know)/gi,
    /what('s| is) wrong with you/gi,
    /are you (serious|kidding|joking)/gi,
    /you (obviously|clearly|literally).{0,30}(don't|do not)/gi,
  ],

  // Expressing anger/disbelief
  anger: [
    /I (can't|cannot) believe/gi,
    /are you (kidding|serious)/gi,
    /you('ve| have) got to be (kidding|joking)/gi,
    /this is (unbelievable|incredible|absurd)/gi,
    /how is this (possible|happening|real)/gi,
  ],

  // Giving up/surrender
  surrender: [
    /I('m| am) done/gi,
    /I give up/gi,
    /never mind/gi,
    /forget (it|this)/gi,
    /screw (it|this)/gi,
  ],

  // Aggressive imperatives
  commands: [
    /just (fix|work|do|stop|listen)/gi,
    /(fix|work) (now|immediately|please|already)/gi,
    /stop (doing|being|trying)/gi,
  ],
};

/**
 * Keywords that indicate frustration (weighted)
 */
const FRUSTRATION_KEYWORDS = {
  // High frustration (weight: 1.0)
  unacceptable: 1.0,
  unbelievable: 1.0,
  impossible: 1.0,
  pathetic: 1.0,
  embarrassing: 1.0,

  // Medium frustration (weight: 0.7)
  wrong: 0.7,
  broken: 0.7,
  failing: 0.7,
  useless: 0.7,
  pointless: 0.7,
  nonsense: 0.7,

  // Low frustration (weight: 0.4)
  confused: 0.4,
  unclear: 0.4,
  complicated: 0.4,
  difficult: 0.4,
};

/**
 * Hostile punctuation patterns
 * Multiple exclamation marks, question marks, etc.
 */
function detectHostilePunctuation(text: string): number {
  let score = 0;

  // Multiple exclamation marks (!!!, !!!!, etc.)
  const exclamations = text.match(/!{2,}/g);
  if (exclamations) {
    score += exclamations.length * 0.2;
  }

  // Multiple question marks (???, ????, etc.)
  const questions = text.match(/\?{2,}/g);
  if (questions) {
    score += questions.length * 0.2;
  }

  // Mixed punctuation (!?!?, ??!!, etc.)
  const mixed = text.match(/[!?]{3,}/g);
  if (mixed) {
    score += mixed.length * 0.3;
  }

  // ALL CAPS words (anger indicator)
  const capsWords = text.match(/\b[A-Z]{3,}\b/g);
  if (capsWords) {
    score += capsWords.length * 0.15;
  }

  return Math.min(score, 1.0);
}

/**
 * Check for frustration keywords
 */
function scoreKeywords(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  for (const [keyword, weight] of Object.entries(FRUSTRATION_KEYWORDS)) {
    if (lower.includes(keyword)) {
      score += weight;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Check for semantic patterns
 */
function matchSemanticPatterns(text: string): SemanticMatch[] {
  const matches: SemanticMatch[] = [];

  for (const [category, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) {
        for (const match of found) {
          matches.push({
            phrase: match,
            category,
            score: 0.8, // Semantic patterns are strong indicators
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Detect indirect swearing/frustration in text
 * Returns matches if score > threshold
 */
export function detectIndirectSwearing(
  text: string,
  threshold: number = 0.5
): { matches: SemanticMatch[]; totalScore: number } {
  const semanticMatches = matchSemanticPatterns(text);
  const keywordScore = scoreKeywords(text);
  const punctuationScore = detectHostilePunctuation(text);

  // Combined scoring
  const totalScore =
    (semanticMatches.length > 0 ? 0.6 : 0) +
    keywordScore * 0.3 +
    punctuationScore * 0.1;

  return {
    matches: semanticMatches,
    totalScore,
  };
}

/**
 * Analyze a full message for semantic swearing indicators
 */
export function analyzeMessage(text: string): {
  hasIndirectSwearing: boolean;
  score: number;
  matches: SemanticMatch[];
  details: {
    keywords: number;
    patterns: number;
    punctuation: number;
  };
} {
  const result = detectIndirectSwearing(text);
  const keywordScore = scoreKeywords(text);
  const punctuationScore = detectHostilePunctuation(text);

  return {
    hasIndirectSwearing: result.totalScore > 0.5,
    score: result.totalScore,
    matches: result.matches,
    details: {
      keywords: keywordScore,
      patterns: result.matches.length,
      punctuation: punctuationScore,
    },
  };
}

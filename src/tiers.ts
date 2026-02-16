export interface Tier {
  label: string;
  tagline: string;
}

interface TierThreshold {
  maxRate: number;
  tier: Tier;
}

const USER_TIERS: TierThreshold[] = [
  { maxRate: 0, tier: { label: "Suspiciously Polite", tagline: "Not a single swear. Are you even using Claude Code?" } },
  { maxRate: 0.2, tier: { label: "Oops", tagline: "One or two slipped out. We've all been there." } },
  { maxRate: 0.5, tier: { label: "Eminem", tagline: "Every conversation has a few f-bombs. It's not anger, it's rhythm." } },
  { maxRate: 1.0, tier: { label: "Karen Mode", tagline: "You want to speak to the code's manager. And yes, you're mad." } },
  { maxRate: 2.5, tier: { label: "Psycho", tagline: "Most conversations involve swearing. Claude is walking on eggshells." } },
  { maxRate: Infinity, tier: { label: "Gordon Ramsay Mode", tagline: "The code is RAW. And Claude knows it." } },
];

const CLAUDE_TIERS: TierThreshold[] = [
  { maxRate: 0, tier: { label: "Stone Cold", tagline: "Zero apologies. Claude said what it said." } },
  { maxRate: 0.5, tier: { label: "Straight Shooter", tagline: "Minimal flattery. Refreshingly blunt." } },
  { maxRate: 1.2, tier: { label: "Smooth Operator", tagline: "Claude is being polite. Suspiciously polite." } },
  { maxRate: 2.5, tier: { label: "People Pleaser", tagline: "Claude really wants you to like it." } },
  { maxRate: 4.0, tier: { label: "Therapist Mode", tagline: "Claude validates your feelings more than your code." } },
  { maxRate: Infinity, tier: { label: "Golden Retriever", tagline: "Claude would apologize for apologizing. And then compliment you about it." } },
];

function getTier(rate: number, tiers: TierThreshold[]): Tier {
  for (const t of tiers) {
    if (rate <= t.maxRate) return t.tier;
  }
  return tiers[tiers.length - 1].tier;
}

export function getUserTier(totalSwears: number, filesScanned: number): Tier & { rate: number } {
  const rate = filesScanned === 0 ? 0 : totalSwears / filesScanned;
  return { ...getTier(rate, USER_TIERS), rate };
}

export function getClaudeTier(totalApologies: number, totalSycophancy: number, filesScanned: number): Tier & { rate: number; total: number } {
  const total = totalApologies + totalSycophancy;
  const rate = filesScanned === 0 ? 0 : total / filesScanned;
  return { ...getTier(rate, CLAUDE_TIERS), rate, total };
}

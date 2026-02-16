# claude-code-swear-counter

## What This Is
CLI tool that scans `~/.claude/projects/**/*.jsonl` conversation logs and counts user swearing + Claude's apologies/sycophancy. Outputs fun tier labels, boxed tables, and an "AI survival odds" joke line.

## Tech Stack
- TypeScript, ESM modules, zero runtime dependencies
- Build: `tsup`, Dev: `tsx`
- Run: `npx tsx src/index.ts`

## File Structure
- `src/index.ts` - CLI entry point, parses flags (`--breakdown`, `--me`, `--claude`, `--json`, `--help`)
- `src/scanner.ts` - Reads JSONL files from `~/.claude/projects/`, extracts user/assistant text, counts pattern matches
- `src/patterns.ts` - Regex patterns for swear words, apology phrases, sycophancy phrases
- `src/tiers.ts` - Tier thresholds and labels based on rate (count/conversations)
- `src/reporter.ts` - All output formatting: box-drawing, ANSI colors, tables, survival odds

## Output Modes
- Default: boxed header + score cards + survival odds + breakdown hint
- `--breakdown`: adds boxed word-by-word tables with counts
- `--json`: raw JSON, no formatting
- `--me`: user section only
- `--claude`: claude section only

## Visual Design
- Box-drawing chars: `╭╮╰╯─│├┬┴┤` (rounded corners)
- Colors via raw ANSI escapes (no deps): orange boxes, bold yellow labels, dim grey taglines, bold red survival %
- `boxHeader()` draws the title box, `tableBox()` draws breakdown tables
- `boxLine()` strips ANSI codes for width calculation

## Tier System
User tiers (by swears/conversation rate):
- 0: Suspiciously Polite
- <=0.2: Oops
- <=0.5: Eminem
- <=1.0: Karen Mode
- <=2.5: Psycho
- Infinity: Gordon Ramsay Mode

Claude tiers (by (apologies+sycophancy)/conversation rate):
- 0: Stone Cold
- <=0.5: Straight Shooter
- <=1.2: Smooth Operator
- <=2.5: People Pleaser
- <=4.0: Therapist Mode
- Infinity: Golden Retriever

Survival odds map to user tiers: 71.4% -> 48.3% -> 29.7% -> 14.2% -> 4.8% -> 0.3%

## Key Design Decisions
- Thresholds are intentionally shifted low so most users land in a more dramatic tier (engagement bait)
- Tier names chosen for shareability: pop culture refs (Eminem, Gordon Ramsay), meme culture (Karen Mode), visceral (Psycho)
- Survival odds line is a tongue-in-cheek engagement hook
- Zero dependencies for ANSI colors - raw escape codes only

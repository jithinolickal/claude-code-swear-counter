export interface Pattern {
  label: string;
  regex: RegExp;
}

export const SWEAR_WORDS: Pattern[] = [
  // Hard swears
  { label: "fuck", regex: /\bfuck(?:ing|ed|s)?\b/gi },
  { label: "shit", regex: /\bshit(?:ty|s)?\b/gi },
  { label: "bullshit", regex: /\bbullshit\b/gi },
  { label: "dogshit", regex: /\bdogshit\b/gi },
  { label: "damn", regex: /\bdamn(?:it|ed)?\b/gi },
  { label: "dammit", regex: /\bdammit\b/gi },
  { label: "goddamn", regex: /\bgoddamn(?:it)?\b/gi },
  { label: "hell", regex: /\bwhat the hell\b|\bhell\b/gi },
  { label: "crap", regex: /\bcrap(?:py|s)?\b/gi },
  { label: "ass", regex: /\basshole\b/gi },
  { label: "bitch", regex: /\bbitch(?:es|ing)?\b/gi },
  { label: "bastard", regex: /\bbastard\b/gi },
  { label: "dick", regex: /\bdick(?:head)?\b/gi },
  { label: "pissed", regex: /\bpissed?\b/gi },
  { label: "wanker", regex: /\bwanker\b/gi },
  { label: "bloody", regex: /\bbloody\b/gi },

  // Internet shorthand
  { label: "wtf", regex: /\bwtf\b/gi },
  { label: "ffs", regex: /\bffs\b/gi },
  { label: "stfu", regex: /\bstfu\b/gi },
  { label: "fml", regex: /\bfml\b/gi },
  { label: "smh", regex: /\bsmh\b/gi },
  { label: "jfc", regex: /\bjfc\b/gi },
  { label: "lmao", regex: /\blmao\b/gi },
  { label: "omfg", regex: /\bomfg\b/gi },

  // Insults
  { label: "stupid", regex: /\bstupid\b/gi },
  { label: "dumb", regex: /\bdumb(?:ass)?\b/gi },
  { label: "idiot", regex: /\bidiot(?:ic)?\b/gi },
  { label: "moron", regex: /\bmoron(?:ic)?\b/gi },

  // Frustration words
  { label: "ridiculous", regex: /\bridiculous\b/gi },
  { label: "terrible", regex: /\bterrible\b/gi },
  { label: "awful", regex: /\bawful\b/gi },
  { label: "horrible", regex: /\bhorrible\b/gi },
  { label: "atrocious", regex: /\batrocious\b/gi },
  { label: "garbage", regex: /\bgarbage\b/gi },
  { label: "trash", regex: /\btrash\b/gi },
  { label: "useless", regex: /\buseless\b/gi },
  { label: "worthless", regex: /\bworthless\b/gi },
  { label: "pointless", regex: /\bpointless\b/gi },
  { label: "pathetic", regex: /\bpathetic\b/gi },
  { label: "broken", regex: /\bbroken\b/gi },
  { label: "sucks", regex: /\bsucks?\b/gi },
  { label: "screw", regex: /\bscrew(?:ed|ing)?\b/gi },
  { label: "ugh", regex: /\bugh+\b/gi },
  { label: "omg", regex: /\bomg\b/gi },
  { label: "lame", regex: /\blame\b/gi },
  { label: "insane", regex: /\binsane\b/gi },
  { label: "hate", regex: /\bhate\b/gi },
  { label: "annoying", regex: /\bannoying\b/gi },
  { label: "nightmare", regex: /\bnightmare\b/gi },
  { label: "rubbish", regex: /\brubbish\b/gi },
  { label: "absurd", regex: /\babsurd\b/gi },
  { label: "braindead", regex: /\bbrain\s?dead\b/gi },
];

export const APOLOGY_PATTERNS: Pattern[] = [
  { label: "I apologize", regex: /\bI apologize\b/gi },
  { label: "I'm sorry", regex: /\bI'?m sorry\b/gi },
  { label: "my mistake", regex: /\bmy mistake\b/gi },
  { label: "my apologies", regex: /\bmy apologies\b/gi },
  { label: "sorry about", regex: /\bsorry about\b/gi },
  { label: "sorry for", regex: /\bsorry for\b/gi },
];

export const SYCOPHANCY_PATTERNS: Pattern[] = [
  { label: "You're absolutely right", regex: /\byou'?re absolutely right\b/gi },
  { label: "You're right", regex: /\byou'?re right\b/gi },
  { label: "Great question", regex: /\bgreat question\b/gi },
  { label: "Good question", regex: /\bgood question\b/gi },
  { label: "Excellent question", regex: /\bexcellent question\b/gi },
  { label: "That's a great point", regex: /\bthat'?s a great point\b/gi },
];

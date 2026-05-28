// List of popular email domains to match against
const KNOWN_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'rediffmail.com',
  'comcast.net',
  'verizon.net',
  'att.net',
  'me.com',
  'mac.com',
  'fastmail.com',
  'tutanota.com',
  'hey.com',
  'pm.me',
];

// Simple Levenshtein distance implementation
export const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
};

// Returns typo suggestion if edit distance <= 2
export const getDidYouMean = (email) => {
  if (!email || typeof email !== 'string') {
    return { suggestion: null, originalDomain: null, suggestedDomain: null };
  }

  const parts = email.trim().split('@');
  if (parts.length !== 2) {
    return { suggestion: null, originalDomain: null, suggestedDomain: null };
  }

  const [localPart, domain] = parts;
  const domainLower = domain.toLowerCase();

  if (KNOWN_DOMAINS.includes(domainLower)) {
    return { suggestion: null, originalDomain: domainLower, suggestedDomain: null };
  }

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const knownDomain of KNOWN_DOMAINS) {
    const distance = levenshteinDistance(domainLower, knownDomain);
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = knownDomain;
    }
  }

  if (bestMatch) {
    return {
      suggestion: `${localPart}@${bestMatch}`,
      originalDomain: domainLower,
      suggestedDomain: bestMatch,
    };
  }

  return { suggestion: null, originalDomain: domainLower, suggestedDomain: null };
};

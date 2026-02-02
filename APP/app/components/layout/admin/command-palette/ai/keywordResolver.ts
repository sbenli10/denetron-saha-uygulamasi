import intentMap from "../config/intentMap.json";

// basit levenshtein
function levenshtein(a: string, b: string): number {
  const matrix = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function resolveKeywordIntent(query: string): {
  intent: string | null;
  score: number;
} {
  const q = query.toLowerCase();

  let bestIntent = null;
  let highestScore = 0;

  for (const [intent, data] of Object.entries(intentMap)) {
    for (const keyword of data.keywords) {
      const distance = levenshtein(q, keyword.toLowerCase());
      const maxLen = Math.max(q.length, keyword.length);
      const similarity = 1 - distance / maxLen;

      if (similarity > highestScore) {
        highestScore = similarity;
        bestIntent = intent;
      }
    }
  }

  return {
    intent: highestScore > 0.55 ? bestIntent : null,
    score: highestScore
  };
}

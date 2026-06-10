export const MOVIES = ["Inception", "Toy Story", "Matrix", "Frozen", "Interstellar", "Moana"];

export const USER_RATINGS: Record<string, (number | null)[]> = {
  Alice: [5, 4, 5, null, 4, null],
  Bob: [4, 5, null, 3, null, 4],
  Carol: [5, null, 4, null, 5, 3],
  Dave: [null, 4, 5, 2, 4, null],
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function findRecommendations(activeUser: string): {
  similarUsers: { user: string; similarity: number }[];
  recommendation: { movie: string; predictedRating: number } | null;
} {
  const users = Object.keys(USER_RATINGS);
  const activeRatings = USER_RATINGS[activeUser];

  const similarities: { user: string; similarity: number }[] = [];

  users.forEach((user) => {
    if (user === activeUser) return;
    const other = USER_RATINGS[user];
    const sharedA: number[] = [];
    const sharedB: number[] = [];
    for (let i = 0; i < activeRatings.length; i++) {
      if (activeRatings[i] !== null && other[i] !== null) {
        sharedA.push(activeRatings[i]!);
        sharedB.push(other[i]!);
      }
    }
    if (sharedA.length >= 2) {
      similarities.push({ user, similarity: cosineSimilarity(sharedA, sharedB) });
    }
  });

  similarities.sort((a, b) => b.similarity - a.similarity);

  let bestMovie: string | null = null;
  let bestScore = 0;

  for (let i = 0; i < MOVIES.length; i++) {
    if (activeRatings[i] !== null) continue;
    let weightedSum = 0;
    let weightTotal = 0;
    similarities.forEach(({ user, similarity }) => {
      const rating = USER_RATINGS[user][i];
      if (rating !== null && similarity > 0) {
        weightedSum += similarity * rating;
        weightTotal += similarity;
      }
    });
    if (weightTotal > 0) {
      const predicted = weightedSum / weightTotal;
      if (predicted > bestScore) {
        bestScore = predicted;
        bestMovie = MOVIES[i];
      }
    }
  }

  return {
    similarUsers: similarities.slice(0, 3),
    recommendation: bestMovie ? { movie: bestMovie, predictedRating: Math.round(bestScore * 10) / 10 } : null,
  };
}

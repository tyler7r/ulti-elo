// Helper for Circle Method Pairing (Handles even/odd)
function generateRoundRobinPairs(
  squadIds: string[]
): { squad_a_id: string; squad_b_id: string }[][] {
  if (squadIds.length < 2) return [];

  const teams = [...squadIds];
  const isOdd = teams.length % 2 !== 0;
  if (isOdd) {
    teams.push("BYE"); // Add a dummy opponent for byes
  }

  const n = teams.length;
  const rounds: { squad_a_id: string; squad_b_id: string }[][] = [];
  //   const schedule: { home: string; away: string }[] = [];

  //   // Generate all unique pairs using the circle method logic base
  //   // For simplicity here, let's generate pairs ensuring each team plays others
  //   // A strict playable order requires more complex scheduling logic (field availability etc)
  //   // This generates the set of games to be played in the round-robin.
  //   const uniquePairs: { squad_a_id: string; squad_b_id: string }[] = [];
  //   for (let i = 0; i < squadIds.length; i++) {
  //     for (let j = i + 1; j < squadIds.length; j++) {
  //       uniquePairs.push({ squad_a_id: squadIds[i], squad_b_id: squadIds[j] });
  //     }
  //   }
  //   // Simple approach: return all pairs in one "round" for scheduling purposes.
  //   // The user can re-order them via Drag and Drop.
  //   // A more advanced implementation would interleave games based on available fields.
  //   if (uniquePairs.length > 0) {
  //     rounds.push(uniquePairs);
  //   }

  // --- Circle Method Implementation (More complex for strict order) ---
  // This part is more complex to guarantee playable order without clashes
  // Sticking to generating all unique pairs for now, user can reorder
  const mid = n / 2;
  for (let r = 0; r < n - 1; r++) {
    const roundPairs: { squad_a_id: string; squad_b_id: string }[] = [];
    for (let i = 0; i < mid; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        // Alternate home/away for fairness if needed
        roundPairs.push({ squad_a_id: home, squad_b_id: away });
      }
    }
    rounds.push(roundPairs);
    // Rotate teams, keeping the first one fixed
    const last = teams.pop();
    if (last) teams.splice(1, 0, last);
  }
  // --- End Circle Method ---

  return rounds;
}

export default generateRoundRobinPairs;

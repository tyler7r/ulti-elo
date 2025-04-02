export function getTeamSizeCounteractionFactor(
  teamSizeA: number,
  teamSizeB: number
): number {
  const sizeDifference = teamSizeA - teamSizeB;
  const absDifference = Math.abs(sizeDifference);
  const MAX_TEAM_SIZE_DIFFERENCE = 3;

  if (absDifference === 0 || absDifference > MAX_TEAM_SIZE_DIFFERENCE) {
    return 1.0; // No counteraction if sizes are equal or difference is too large
  }

  const scalingFactor = 0.35;

  if (absDifference > 0) {
    return Math.max(0.55, 1.0 - absDifference * scalingFactor);
  } else return 1.0;
}

function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const lengthA = a.length;
  const lengthB = b.length;
  if (lengthA === 0 || lengthB === 0) return 0;

  const matchDistance = Math.floor(Math.max(lengthA, lengthB) / 2) - 1;
  const aMatches = new Array<boolean>(lengthA).fill(false);
  const bMatches = new Array<boolean>(lengthB).fill(false);

  let matches = 0;
  for (let i = 0; i < lengthA; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, lengthB);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < lengthA; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  return (matches / lengthA + matches / lengthB + (matches - transpositions) / matches) / 3;
}

const WINKLER_PREFIX_SCALE = 0.1;
const WINKLER_MAX_PREFIX_LENGTH = 4;

export function jaroWinklerSimilarity(a: string, b: string): number {
  const jaro = jaroSimilarity(a, b);

  let prefixLength = 0;
  const maxPrefix = Math.min(WINKLER_MAX_PREFIX_LENGTH, a.length, b.length);
  while (prefixLength < maxPrefix && a[prefixLength] === b[prefixLength]) prefixLength++;

  return jaro + prefixLength * WINKLER_PREFIX_SCALE * (1 - jaro);
}

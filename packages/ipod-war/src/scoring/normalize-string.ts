const PARENTHETICAL_SUFFIX_PATTERN =
  /\((feat\.?|with|remaster(ed)?|live|deluxe|explicit|clean|radio edit|single version|bonus track)[^)]*\)/gi;
const COMBINING_DIACRITIC_PATTERN = /[̀-ͯ]/g;

export function normalizeForComparison(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_DIACRITIC_PATTERN, '')
    .toLowerCase()
    .replace(PARENTHETICAL_SUFFIX_PATTERN, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

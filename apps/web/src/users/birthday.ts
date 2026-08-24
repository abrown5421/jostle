// Birthdays travel as ISO date-time strings (JSON.stringify(Date) on the
// server). Formatting/parsing goes through the UTC date parts directly
// rather than a local-timezone Date getter, so a stored "1996-02-25"
// never shifts a day depending on the viewer's timezone.
export function toDateInputValue(birthday: string | undefined): string {
  return birthday ? birthday.slice(0, 10) : '';
}

export function formatBirthdayDisplay(
  birthday: string | undefined,
): string | null {
  if (!birthday) return null;
  const [year, month, day] = birthday.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

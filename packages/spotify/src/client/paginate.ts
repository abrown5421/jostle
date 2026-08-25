import { getJsonWithBearerToken } from '@jostle/integrations';

interface SpotifyPagedResponse<TItem> {
  items: TItem[];
  next: string | null;
}

export async function getAllPages<TItem>(
  accessToken: string,
  firstUrl: string,
): Promise<TItem[]> {
  const results: TItem[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const page: SpotifyPagedResponse<TItem> = await getJsonWithBearerToken<SpotifyPagedResponse<TItem>>(
      url,
      accessToken,
    );
    results.push(...page.items);
    url = page.next;
  }

  return results;
}

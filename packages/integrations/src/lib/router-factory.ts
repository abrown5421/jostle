import { Router } from 'express';
import { MediaProvider } from '@inithium/types';

interface RouterFactoryDependencies {
  providers: MediaProvider[];
  onSaveConnection: (userId: string, providerId: string, providerAccountId: string, credentials: any) => Promise<void>;
  onLookupCredentials: (userId: string, providerId: string) => Promise<string>;
  frontendSuccessUrl: string;
}

export function createMediaIntegrationsRouter({
  providers,
  onSaveConnection,
  onLookupCredentials,
  frontendSuccessUrl
}: RouterFactoryDependencies): Router {
  const router = Router();
  const providerMap = new Map(providers.map(p => [p.id, p]));

  router.get('/:provider/connect', (req, res) => {
    const provider = providerMap.get(req.params.provider);
    const userId = req.query.userId as string;
    
    if (!provider || !userId) {
      res.status(400).json({ error: 'Invalid provider or parameter context' });
      return;
    }
    
    res.redirect(provider.getAuthorizationUrl(userId));
  });

  router.get('/:provider/callback', async (req, res) => {
    const provider = providerMap.get(req.params.provider);
    const code = req.query.code as string;
    const userId = req.query.state as string;

    if (!provider || !code || !userId) {
        res.redirect(`${frontendSuccessUrl}?error=invalid_callback`);
        return;
    }

    try {
        const { providerAccountId, credentials } = await provider.handleCallback(code);
        await onSaveConnection(userId, provider.id, providerAccountId, credentials);
        
        res.redirect(`${frontendSuccessUrl}/${userId}?success=${provider.id}`);
    } catch (err: any) {
        res.redirect(`${frontendSuccessUrl}?error=${encodeURIComponent(err.message)}`);
    }
  });
  
  router.get('/search/artists', async (req, res) => {
    const { userId, provider: providerId, q } = req.query;
    const provider = providerMap.get(providerId as string);
    
    if (!provider) {
      res.status(400).json({ error: 'Missing platform mapping' });
      return;
    }

    const token = await onLookupCredentials(userId as string, providerId as string);
    const results = await provider.searchArtists(q as string, token);
    res.json(results);
  });

  router.post('/song-bank', async (req, res) => {
    const { userId, provider: providerId, sourceIds, type, limit } = req.body;
    const provider = providerMap.get(providerId);
    
    if (!provider) {
      res.status(400).json({ error: 'Missing platform mapping' });
      return;
    }

    const token = await onLookupCredentials(userId, providerId);
    const bank = await provider.generateSongBank({ sourceIds, type, limit }, token);
    res.json(bank);
  });

  return router;
}
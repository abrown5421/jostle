import { useReadAllGamesQuery } from '@inithium/store';
import { Box, Button, Loader, Pagination, Text, Dialog } from '@inithium/ui';
import { Clock, Users, Sliders, Hash } from 'lucide-react';
import React, { useState } from 'react';

const ITEMS_PER_PAGE = 12;  

type GameItem = NonNullable<ReturnType<typeof useReadAllGamesQuery>['data']>['data'][number];

const GamesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const { data, isLoading } = useReadAllGamesQuery({ page: currentPage, limit: ITEMS_PER_PAGE });

  if (isLoading) {
    return (
      <Box flex justify="center" align="center" className="h-full w-full">
        <Loader variant="spinner" size="lg" color="primary" />
      </Box>
    );
  }

  console.log(data);
  
  const games = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleCardClick = (game: GameItem) => () => {
    setSelectedGame(game);
  };

  const handleCloseDialog = () => {
    setSelectedGame(null);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Box flex direction="col" padding="lg" fullWidth>
      <Box overrideClassName="flex flex-row flex-wrap gap-4 w-full items-stretch justify-start">
        {games.map((game) => (
          <Box
            key={game._id}
            flex
            direction="col"
            border
            borderWidth="thin"
            borderRadius="lg"
            padding="md"
            onClick={handleCardClick(game)}
            overrideClassName="rounded p-4 bg-surface4 w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] cursor-pointer hover:opacity-95 transition-opacity"
          >
            <Box overrideClassName="w-full h-40 max-h-40 overflow-hidden rounded-md mb-4 flex items-center justify-center bg-black">
              {game.thumbnailAsset && (
                <img 
                  src={import.meta.env['VITE_API_ORIGIN'] + game.thumbnailAsset} 
                  alt={game.name} 
                  className="w-full h-full object-contain"
                />
              )}
            </Box>
            <Box flex direction="row" justify="between" fullWidth>
              <Box flex direction="row" align="center">
                <Clock size={14} className="mr-2" />
                <Text variant="caption">{game.estimatedMinutes} min</Text>
              </Box>

              <Box flex direction="row" align="center">
                <Users size={14} className="mr-2" />
                <Text color="accent" variant="caption">
                  {game.minPlayers}-{game.maxPlayers} players
                </Text>
              </Box>
            </Box>
            <Text variant="body2" color="surface4-contrast" overrideClassName="my-2">
              {game.description ?? ''}
            </Text>
            <Button color="primary" fullWidth className="my-2" onClick={handlePlayClick}>
              Play Game
            </Button>
          </Box>
        ))}
      </Box>

      {total > ITEMS_PER_PAGE && (
        <Box flex justify="center" margin="lg">
          <Pagination
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </Box>
      )}

      <Dialog
        open={Boolean(selectedGame)}
        onClose={handleCloseDialog}
        title={selectedGame?.name}
        size="xl"
        actions={[
          {
            label: 'Close',
            onClick: handleCloseDialog,
            color: 'surface4-contrast',
            variant: 'outline',
          },
          {
            label: 'Play Now',
            onClick: () => {},
            color: 'primary',
            variant: 'solid',
          },
        ]}
      >
        {selectedGame && (
          <Box flex direction="col" overrideClassName="gap-4">
            <Box overrideClassName="w-full max-h-64 overflow-hidden rounded-lg flex justify-center bg-black">
              {selectedGame.thumbnailAsset && (
                <img
                  src={import.meta.env['VITE_API_ORIGIN'] + selectedGame.thumbnailAsset}
                  alt={selectedGame.name}
                  className="object-contain h-full max-h-64 w-auto mx-auto"
                />
              )}
            </Box>

            <Box flex direction="row" justify="between" fullWidth className='my-6'>
              <Box flex direction="row" align="center">
                <Clock size={14} className="mr-2" />
                <Text variant="caption">{selectedGame.estimatedMinutes} min</Text>
              </Box>

              <Box flex direction="row" align="center">
                <Users size={14} className="mr-2" />
                <Text color="accent" variant="caption">
                  {selectedGame.minPlayers}-{selectedGame.maxPlayers} players
                </Text>
              </Box>
            </Box>

            <Box overrideClassName="border-t border-surface3-contrast/20 pt-4">
              {(selectedGame.category || (selectedGame.tags && selectedGame.tags.length > 0)) && (
                <Box flex direction="row" justify="between" align="center" overrideClassName="flex flex-row justify-between items-center pb-2 gap-4 w-full">
                  <Box flex direction="row" align="center" overrideClassName="flex flex-row items-center w-auto shrink-0">
                    {selectedGame.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary-contrast border border-primary/20 capitalize whitespace-nowrap">
                        {selectedGame.category}
                      </span>
                    )}
                  </Box>

                  <Box flex direction="row" justify="end" overrideClassName="flex flex-row flex-wrap gap-2 justify-end items-center flex-1 w-auto">
                    {selectedGame.tags?.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface4 text-accent border border-surface3-contrast/10 whitespace-nowrap"
                      >
                        <Hash size={10} className="mr-1 opacity-70" />
                        {tag}
                      </span>
                    ))}
                  </Box>
                </Box>
              )}
              <Text variant="body2" color='surface4-contrast'>
                {selectedGame.description}
              </Text>
            </Box>

            {selectedGame.settings && selectedGame.settings.length > 0 && (
              <Box overrideClassName="border-t border-surface3-contrast/20 pt-4 mt-2">
                <Box flex direction="row" align="center" className='mb-3'>
                  <Sliders size={14} className="mr-2" />
                  <Text variant="body2" overrideClassName="font-semibold tracking-wide uppercase text-xs">
                    Host Settings
                  </Text>
                </Box>
                <Box overrideClassName="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedGame.settings.map((setting: any) => (
                    <Box 
                      key={setting.key} 
                      overrideClassName="bg-surface4/40 border border-surface3-contrast/5 rounded-md p-3 flex flex-col justify-between"
                    >
                      <div>
                        <Text variant="body2" overrideClassName="font-medium text-sm block">
                          {setting.label}
                        </Text>
                        <Text variant="caption" overrideClassName="opacity-60 block text-xs mt-0.5 leading-normal">
                          {setting.description}
                        </Text>
                      </div>
                      <div className="mt-2 pt-2 border-t border-surface3-contrast/5 flex items-center justify-between text-xs opacity-80">
                        <span>Range: {setting.min} - {setting.max}</span>
                        <span className="font-semibold text-accent">Default: {setting.default}</span>
                      </div>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default GamesPage;
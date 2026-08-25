export class HostSpotifyNotConnectedError extends Error {
  constructor() {
    super('The host must connect Spotify before starting Ipod War.');
    this.name = 'HostSpotifyNotConnectedError';
  }
}

export class NotEnoughPlayersError extends Error {
  constructor(minPlayers: number) {
    super(`Ipod War needs at least ${minPlayers} players to start.`);
    this.name = 'NotEnoughPlayersError';
  }
}

export class NoPlaylistSelectedError extends Error {
  constructor() {
    super('Select a playlist before starting Ipod War.');
    this.name = 'NoPlaylistSelectedError';
  }
}

export class InsufficientSongsError extends Error {
  readonly available: number;
  readonly required: number;

  constructor(available: number, required: number) {
    super(`The selected playlist only has ${available} usable songs, but ${required} are needed.`);
    this.name = 'InsufficientSongsError';
    this.available = available;
    this.required = required;
  }
}

export class SessionNotInLobbyError extends Error {
  constructor() {
    super('This session has already started or ended.');
    this.name = 'SessionNotInLobbyError';
  }
}

export class GameNotConfiguredError extends Error {
  constructor() {
    super('Configure Ipod War for this session before starting it.');
    this.name = 'GameNotConfiguredError';
  }
}

export class RoundNotAcceptingSubmissionsError extends Error {
  constructor() {
    super('This round is not currently accepting submissions.');
    this.name = 'RoundNotAcceptingSubmissionsError';
  }
}

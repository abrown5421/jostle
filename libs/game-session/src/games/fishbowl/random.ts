// Team deals and bowl shuffles are random; specs pin this for repeatable games.
let source: () => number = Math.random;

export const fishbowlRandom = (): number => source();

export const setFishbowlRandomForTesting = (next: () => number): void => {
  source = next;
};

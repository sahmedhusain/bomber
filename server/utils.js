import { gameState } from './state.js';

export function getUniqueNickname(desiredNickname) {
  const existingNicknames = new Set();

  Object.values(gameState.players).forEach(player => {
    existingNicknames.add(player.nickname);
  });

  Object.values(gameState.spectators).forEach(spectator => {
    existingNicknames.add(spectator.nickname);
  });

  if (!existingNicknames.has(desiredNickname)) {
    return desiredNickname;
  }

  let counter = 2;
  let uniqueNickname = `${desiredNickname}${counter}`;

  while (existingNicknames.has(uniqueNickname)) {
    counter++;
    uniqueNickname = `${desiredNickname}${counter}`;
  }

  return uniqueNickname;
}

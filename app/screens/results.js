import { createElement } from '../../picojs/framework/core.js';
import { getIconSVG } from '../icons/iconComponent.js';

const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

const sortPlayers = (players) => [...players].sort((a, b) => {
  if (a.status !== b.status) return a.status === 'alive' ? -1 : 1;
  return (b.lives || 0) - (a.lives || 0);
});

const formatPlace = (place) => {
  const mod10 = place % 10;
  const mod100 = place % 100;
  if (mod10 === 1 && mod100 !== 11) return `${place}st`;
  if (mod10 === 2 && mod100 !== 12) return `${place}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${place}rd`;
  return `${place}th`;
};

const buildStandings = (game) => {
  const playersById = game?.players || {};
  const playersList = Object.values(playersById);
  const finalStandings = Array.isArray(game?.finalStandings) ? game.finalStandings : [];
  const rows = [];
  const seenIds = new Set();
  let nextPlace = 1;

  if (finalStandings.length > 0) {
    finalStandings.forEach(group => {
      const groupPlayers = group
        .map(id => playersById[id])
        .filter(Boolean);
      if (groupPlayers.length === 0) return;
      groupPlayers.forEach(player => {
        rows.push({
          player,
          place: nextPlace,
          tieCount: groupPlayers.length,
          avatarIndex: playersList.indexOf(player)
        });
        seenIds.add(player.id);
      });
      nextPlace += groupPlayers.length;
    });
  }

  if (rows.length === 0) {
    return sortPlayers(playersList).map((player, index) => ({
      player,
      place: index + 1,
      tieCount: 1,
      avatarIndex: playersList.indexOf(player)
    }));
  }

  playersList.forEach(player => {
    if (seenIds.has(player.id)) return;
    rows.push({
      player,
      place: nextPlace,
      tieCount: 1,
      avatarIndex: playersList.indexOf(player)
    });
    nextPlace += 1;
  });

  return rows;
};

const joinNames = (names) => {
  if (!names || names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const head = names.slice(0, -1).join(', ');
  const tail = names[names.length - 1];
  return `${head} & ${tail}`;
};

const confirmModal = (store) => {
  const modal = {
    kind: 'confirm',
    title: 'Leave lobby?',
    description: 'You will return to the nickname screen.',
    action: 'leaveLobby',
    confirmLabel: 'Leave'
  };
  const curr = store.getState();
  store.setState({ ...curr, ui: { ...(curr.ui || {}), modal } });
};

const playerRow = (player, place, tieCount, sessionId, avatarIndex) => createElement('div', {
  className: `standing-row ${player.id === sessionId ? 'is-you' : ''} ${player.status} place-${place}`,
  key: player.id
},
  createElement('div', { className: 'standing-rank' },
    place === 1 ? icon('trophy', 'gold') :
      place === 2 ? icon('star', 'silver') :
        place === 3 ? icon('star', 'bronze') :
          formatPlace(place),
    tieCount > 1 ? createElement('span', { className: 'standing-draw-label' }, place === 1 ? 'DRAW' : 'TIED') : null
  ),
  createElement('div', { className: `standing-avatar player-${avatarIndex}` },
    player.nickname.charAt(0).toUpperCase()
  ),
  createElement('div', { className: 'standing-name' },
    player.nickname,
    player.id === sessionId ? createElement('span', { className: 'you-label' }, 'YOU') : null
  ),
  createElement('div', { className: 'standing-stats' },
    createElement('span', {}, icon('heart'), player.lives || 0),
    createElement('span', {}, icon('bomb'), player.bombCapacity || 1),
    createElement('span', {}, icon('fire'), player.bombRange || 1)
  ),
  createElement('div', { className: `standing-status ${player.status}` },
    tieCount > 1 ? (place === 1 ? 'DRAW' : 'TIED') :
      (player.status === 'alive' ? 'ALIVE' : 'OUT')
  )
);

export function ResultsScreen(state, store) {
  const { game, session } = state;
  const players = Object.values(game?.players || {});
  const winnerIds = Array.isArray(game?.winnerIds) && game.winnerIds.length
    ? game.winnerIds
    : (game?.winnerId ? [game.winnerId] : []);
  const winnersFromPayload = Array.isArray(game?.winners) ? game.winners.filter(Boolean) : [];
  const winners = winnersFromPayload.length
    ? winnersFromPayload
    : winnerIds
      .map(id => game?.players?.[id])
      .filter(Boolean);
  const winnerNames = winners.map(w => w.nickname);
  const isDraw = winners.length > 1;
  const isWinner = session?.playerId ? winnerIds.includes(session.playerId) : false;
  const wasPlayer = players.some(p => p.id === session?.playerId);
  const userIntention = session?.intention;
  const standingsRows = buildStandings(game);
  const titleText = isDraw ? 'DRAW!' : (isWinner ? 'VICTORY!' : 'GAME OVER');
  const titleClass = isDraw ? 'draw' : (isWinner ? 'victory' : 'gameover');

  return createElement('section', { className: `screen results-screen ${titleClass}`, key: 'screen-results' },
    createElement('div', { className: 'results-container' },

      createElement('div', { className: `results-title-section ${titleClass}` },
        createElement('h1', { className: 'results-big-title' }, titleText)
      ),

      winners.length ? createElement('div', { className: 'winner-announce' },
        createElement('div', { className: 'winner-trophy' }, icon('trophy')),
        createElement('div', { className: 'winner-text' },
          createElement('span', { className: 'winner-prefix' }, isDraw ? 'DRAW BETWEEN' : 'CHAMPION'),
          createElement('span', { className: 'winner-name' }, isDraw ? joinNames(winnerNames) : winners[0].nickname),
          isWinner ? createElement('span', { className: 'winner-you' }, '(YOU!)') : null
        )
      ) : null,

      createElement('div', { className: 'standings-box' },
        createElement('div', { className: 'standings-header' },
          createElement('span', {}, 'RANK'),
          createElement('span', {}),
          createElement('span', {}, 'PLAYER'),
          createElement('span', {}, 'STATS'),
          createElement('span', {}, 'STATUS')
        ),
        createElement('div', { className: 'standings-list' },
          standingsRows.map(({ player, place, tieCount, avatarIndex }) =>
            playerRow(
              player,
              place,
              tieCount,
              session?.playerId,
              avatarIndex >= 0 ? avatarIndex : players.indexOf(player)
            )
          )
        )
      ),

      createElement('div', { className: 'results-actions' },
        userIntention
          ? createElement('div', { className: 'action-confirmed' },
            icon(userIntention === 'play_again' ? 'refresh' : userIntention === 'join_game' ? 'arrowRight' : 'door'),
            createElement('span', {},
              userIntention === 'play_again' ? 'READY TO PLAY!' :
                userIntention === 'join_game' ? 'JOINING GAME...' : 'LEAVING...'
            )
          )
          : createElement('div', { className: 'action-buttons' },
            createElement('button', {
              className: 'arcade-btn primary',
              onclick: () => {
                if (wasPlayer) {
                  session?.playerId && window.sendMessage({ type: 'play_again', player_id: session.playerId });
                } else {
                  session?.playerId && window.sendMessage({ type: 'join_game', player_id: session.playerId });
                }
              }
            },
              icon(wasPlayer ? 'refresh' : 'arrowRight'),
              createElement('span', {}, wasPlayer ? 'PLAY AGAIN' : 'JOIN GAME')
            ),
            createElement('button', {
              className: 'arcade-btn secondary',
              onclick: () => session?.playerId && confirmModal(store)
            },
              icon('door'),
              createElement('span', {}, 'EXIT')
            )
          )
      )
    ),

    createElement('div', { className: 'scanlines' })
  );
}

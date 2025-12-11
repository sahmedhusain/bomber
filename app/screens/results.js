import { createElement } from '../../framework/core.js';

const sortPlayers = (players) => [...players].sort((a, b) => {
  if (a.status !== b.status) return a.status === 'alive' ? -1 : 1;
  return (b.lives || 0) - (a.lives || 0);
});

const rankingItem = (player, index, sessionId, avatarIndex) => createElement('div', {
  className: `ranking-item ${player.id === sessionId ? 'self' : ''} ${player.status}`,
  key: player.id
},
  createElement('div', { className: 'rank' }, `#${index + 1}`),
  createElement('div', { className: `player-avatar player-${avatarIndex}` },
    player.nickname.charAt(0).toUpperCase()
  ),
  createElement('div', { className: 'player-info' },
    createElement('div', { className: 'player-name' },
      player.nickname,
      player.id === sessionId ? createElement('span', { className: 'you-badge' }, 'YOU') : null
    ),
    createElement('div', { className: 'player-stats' },
      createElement('span', { className: 'stat' }, `HP ${player.lives || 0} lives`),
      createElement('span', { className: 'stat' }, `BMB ${player.bombCapacity || 1} bombs`),
      createElement('span', { className: 'stat' }, `RNG ${player.bombRange || 1} range`)
    )
  ),
  createElement('div', { className: 'player-status' }, player.status === 'alive' ? 'Alive' : 'Eliminated')
);

const rankingsSection = (players, sessionId) => players.length === 0 ? null :
  createElement('div', { className: 'player-rankings' },
    createElement('h3', {}, 'Final Rankings'),
    createElement('div', { className: 'rankings-list' },
      sortPlayers(players).map((player, index) => rankingItem(player, index, sessionId, players.indexOf(player)))
    )
  );

const winnerSection = (winner, isWinner) => winner
  ? createElement('div', { className: 'winner-section' },
      createElement('div', { className: 'winner-trophy' }, '★'),
      createElement('h2', {}, `Champion: ${winner.nickname}`),
      createElement('p', { className: 'winner-text' },
        isWinner ? 'Congratulations! You are the last bomber standing!' :
          `${winner.nickname} proved to be the ultimate bomber!`
      )
    )
  : createElement('div', { className: 'no-winner' },
      createElement('h2', {}, 'No Winner Yet'),
      createElement('p', {}, 'The battle continues...')
    );

const titleSection = (isWinner, winner) => createElement('div', { className: 'results-title' },
  createElement('div', { className: 'title-icon' }, isWinner ? '★' : '▣'),
  createElement('h1', {}, isWinner ? 'VICTORY!' : 'GAME OVER'),
  createElement('p', { className: 'subtitle' },
    winner ? `${winner.nickname} dominated the battlefield!` : 'Battle results and statistics'
  )
);

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

const actionButton = (label, className, handler) => createElement('button', { className, onclick: handler }, label);

const playerActions = (session, store) => createElement('div', { className: 'player-actions' },
  createElement('p', { className: 'action-hint' }, 'You were a player in this match'),
  actionButton('Play Again', 'button-primary', () => session?.playerId && window.sendMessage({ type: 'play_again', player_id: session.playerId })),
  actionButton('Leave Lobby', 'button-secondary', () => session?.playerId && confirmModal(store))
);

const spectatorActions = (session, store) => createElement('div', { className: 'spectator-actions' },
  createElement('p', { className: 'action-hint' }, 'You were a spectator in this match'),
  actionButton('Join Game', 'button-primary', () => session?.playerId && window.sendMessage({ type: 'join_game', player_id: session.playerId })),
  actionButton('Leave Lobby', 'button-secondary', () => session?.playerId && confirmModal(store))
);

const intentionBlock = (userIntention) => createElement('div', { className: 'intention-confirmed' },
  createElement('div', { className: 'confirmation-message' },
    createElement('div', { className: 'confirmation-icon' },
      userIntention === 'play_again' ? '↻' : userIntention === 'join_game' ? '►' : '◄'
    ),
    createElement('p', { className: 'confirmation-text' },
      userIntention === 'play_again' ? 'Ready to play again! Waiting for next match...' :
        userIntention === 'join_game' ? 'Requesting to join as player! Waiting for next match...' :
          'Leaving lobby...'
    )
  ),
  createElement('p', { className: 'priority-info' },
    userIntention === 'play_again' ? 'Priority as previous player' :
      userIntention === 'join_game' ? 'You will get a player slot if available' : ''
  )
);

const actionsSection = (userIntention, wasPlayer, session, store) => createElement('div', { className: 'results-actions' },
  userIntention ? intentionBlock(userIntention) : wasPlayer ? playerActions(session, store) : spectatorActions(session, store)
);

export function ResultsScreen(state, store) {
  const { game, session } = state;
  const winner = game?.winnerId ? Object.values(game.players).find(p => p.id === game.winnerId) : null;
  const players = Object.values(game?.players || {});
  const isWinner = winner?.id === session?.playerId;
  const wasPlayer = players.some(p => p.id === session?.playerId);
  const userIntention = session?.intention;

  return createElement('section', { className: 'screen results' },
    createElement('div', { className: 'card results-card' },
      titleSection(isWinner, winner),
      createElement('div', { className: 'card-divider' }),
      winnerSection(winner, isWinner),
      rankingsSection(players, session?.playerId),
      actionsSection(userIntention, wasPlayer, session, store)
    )
  );
}

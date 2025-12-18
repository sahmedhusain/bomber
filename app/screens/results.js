import { createElement } from '../../framework/core.js';
import { getIconSVG } from '../icons/iconComponent.js';

// Helper to create icon element
const icon = (name, className = '') => createElement('span', {
  className: `icon-wrapper ${className}`.trim(),
  innerHTML: getIconSVG(name)
});

// Sort players by status (alive first) then by lives
const sortPlayers = (players) => [...players].sort((a, b) => {
  if (a.status !== b.status) return a.status === 'alive' ? -1 : 1;
  return (b.lives || 0) - (a.lives || 0);
});

// Confirm modal helper
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

// Player row for standings table
const playerRow = (player, rank, sessionId, avatarIndex) => createElement('div', {
  className: `standing-row ${player.id === sessionId ? 'is-you' : ''} ${player.status} rank-${rank}`,
  key: player.id
},
  createElement('div', { className: 'standing-rank' },
    rank === 0 ? icon('trophy', 'gold') :
      rank === 1 ? icon('star', 'silver') :
        rank === 2 ? icon('star', 'bronze') :
          `#${rank + 1}`
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
    player.status === 'alive' ? 'ALIVE' : 'OUT'
  )
);

export function ResultsScreen(state, store) {
  const { game, session } = state;
  const winner = game?.winnerId ? Object.values(game.players).find(p => p.id === game.winnerId) : null;
  const players = Object.values(game?.players || {});
  const isWinner = winner?.id === session?.playerId;
  const wasPlayer = players.some(p => p.id === session?.playerId);
  const userIntention = session?.intention;
  const sortedPlayers = sortPlayers(players);

  return createElement('section', { className: 'screen results-screen', key: 'screen-results' },
    createElement('div', { className: 'results-container' },

      // Big title section
      createElement('div', { className: 'results-title-section' },
        createElement('div', { className: 'title-deco left' }),
        createElement('h1', { className: 'results-big-title' },
          isWinner ? 'VICTORY!' : 'GAME OVER'
        ),
        createElement('div', { className: 'title-deco right' })
      ),

      // Winner announcement (if there's a winner)
      winner ? createElement('div', { className: 'winner-announce' },
        createElement('div', { className: 'winner-trophy' }, icon('trophy')),
        createElement('div', { className: 'winner-text' },
          createElement('span', { className: 'winner-prefix' }, 'CHAMPION'),
          createElement('span', { className: 'winner-name' }, winner.nickname),
          isWinner ? createElement('span', { className: 'winner-you' }, '(YOU!)') : null
        )
      ) : null,

      // Standings table
      createElement('div', { className: 'standings-box' },
        createElement('div', { className: 'standings-header' },
          createElement('span', {}, 'RANK'),
          createElement('span', {}),
          createElement('span', {}, 'PLAYER'),
          createElement('span', {}, 'STATS'),
          createElement('span', {}, 'STATUS')
        ),
        createElement('div', { className: 'standings-list' },
          sortedPlayers.map((player, index) =>
            playerRow(player, index, session?.playerId, players.indexOf(player))
          )
        )
      ),

      // Action buttons
      createElement('div', { className: 'results-actions' },
        userIntention
          ? createElement('div', { className: 'action-confirmed' },
            icon(userIntention === 'play_again' ? 'refresh' : userIntention === 'join_game' ? 'gamepad' : 'door'),
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
              icon(wasPlayer ? 'refresh' : 'gamepad'),
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

    // Scanlines
    createElement('div', { className: 'scanlines' })
  );
}

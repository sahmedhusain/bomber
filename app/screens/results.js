import { createElement } from '../../framework/core.js';

export function ResultsScreen(state, store) {
  const { game, session } = state;
  const winner = game?.winnerId ? Object.values(game.players).find(p => p.id === game.winnerId) : null;
  const players = Object.values(game?.players || {});
  const isWinner = winner?.id === session?.playerId;

  return createElement('section', { className: 'screen results' },
    createElement('div', { className: 'results-header' },
      createElement('h1', {}, isWinner ? '🎉 Victory!' : '💥 Game Over'),
      createElement('p', { className: 'subtitle' }, 
        winner ? `${winner.nickname} dominated the battlefield!` : 'Battle results and statistics'
      )
    ),

    createElement('div', { className: 'card results-card' },
      winner ? 
        createElement('div', { className: 'winner-section' },
          createElement('div', { className: 'winner-trophy' }, '🏆'),
          createElement('h2', {}, `Champion: ${winner.nickname}`),
          createElement('p', { className: 'winner-text' }, 
            isWinner ? 'Congratulations! You are the last bomber standing!' : 
            `${winner.nickname} proved to be the ultimate bomber!`
          )
        ) :
        createElement('div', { className: 'no-winner' },
          createElement('h2', {}, '🤝 No Winner Yet'),
          createElement('p', {}, 'The battle continues...')
        ),

      players.length > 0 ? 
        createElement('div', { className: 'player-rankings' },
          createElement('h3', {}, '📊 Final Rankings'),
          createElement('div', { className: 'rankings-list' },
            players
              .sort((a, b) => {
                // Sort by: alive status, then by lives, then by name
                if (a.status !== b.status) return a.status === 'alive' ? -1 : 1;
                return (b.lives || 0) - (a.lives || 0);
              })
              .map((player, index) => 
                createElement('div', { 
                  className: `ranking-item ${player.id === session?.playerId ? 'self' : ''} ${player.status}`,
                  key: player.id 
                },
                  createElement('div', { className: 'rank' }, `#${index + 1}`),
                  createElement('div', { className: `player-avatar player-${players.indexOf(player)}` },
                    player.nickname.charAt(0).toUpperCase()
                  ),
                  createElement('div', { className: 'player-info' },
                    createElement('div', { className: 'player-name' }, 
                      player.nickname,
                      player.id === session?.playerId ? 
                        createElement('span', { className: 'you-badge' }, 'YOU') : null
                    ),
                    createElement('div', { className: 'player-stats' },
                      createElement('span', { className: 'stat' }, `❤️ ${player.lives || 0} lives`),
                      createElement('span', { className: 'stat' }, `💣 ${player.bombCapacity || 1} bombs`),
                      createElement('span', { className: 'stat' }, `🔥 ${player.bombRange || 1} range`)
                    )
                  ),
                  createElement('div', { className: 'player-status' },
                    player.status === 'alive' ? '✅ Alive' : '💀 Eliminated'
                  )
                )
              )
          )
        ) : null,

      createElement('div', { className: 'results-actions' },
        createElement('button', {
          className: 'button-primary',
          onclick: () => {
            // Send message to server to start new game
            if (session?.playerId) {
              window.sendMessage({
                type: 'play_again',
                player_id: session.playerId
              });
            }
          }
        }, '🔄 Play Again'),
        createElement('button', {
          className: 'button-secondary',
          onclick: () => {
            // Send disconnect message to server
            if (session?.playerId) {
              window.sendMessage({
                type: 'disconnect',
                player_id: session.playerId
              });
            }
            // Reset local state
            store.setState({
              session: { connected: false },
              route: '#/',
              game: { status: 'waiting', players: {}, winnerId: undefined }
            });
            window.location.hash = '#/';
          }
        }, '🏠 Leave Game')
      )
    )
  );
}

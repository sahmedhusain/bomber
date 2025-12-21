import { ICON_SIZE } from './icons.js';

const SVG_ICONS = {
  bomb: `<svg class="retro-icon icon-bomb" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="6" width="6" height="6" fill="#1a1a1a"/>
    <rect x="4" y="7" width="8" height="4" fill="#1a1a1a"/>
    <rect x="6" y="5" width="4" height="8" fill="#1a1a1a"/>
    <rect x="7" y="3" width="2" height="2" fill="#8b4513"/>
    <rect x="8" y="1" width="2" height="3" fill="#ff6b35"/>
    <rect x="9" y="0" width="2" height="2" fill="#ffd700"/>
    <rect x="5" y="7" width="2" height="2" fill="#404040"/>
  </svg>`,

  fire: `<svg class="retro-icon icon-fire" viewBox="0 0 16 16" fill="none">
    <rect x="7" y="1" width="2" height="2" fill="#ff6b35"/>
    <rect x="6" y="3" width="4" height="2" fill="#ff6b35"/>
    <rect x="5" y="5" width="6" height="2" fill="#ff4500"/>
    <rect x="4" y="7" width="8" height="3" fill="#ff4500"/>
    <rect x="5" y="10" width="6" height="2" fill="#ff6347"/>
    <rect x="6" y="12" width="4" height="2" fill="#ffd700"/>
    <rect x="7" y="14" width="2" height="2" fill="#ffff00"/>
    <rect x="7" y="5" width="2" height="4" fill="#ffd700"/>
  </svg>`,

  speed: `<svg class="retro-icon icon-speed" viewBox="0 0 16 16" fill="none">
    <rect x="8" y="0" width="3" height="2" fill="#ffd700"/>
    <rect x="7" y="2" width="3" height="2" fill="#ffd700"/>
    <rect x="6" y="4" width="4" height="2" fill="#ffd700"/>
    <rect x="4" y="6" width="6" height="2" fill="#ffd700"/>
    <rect x="6" y="8" width="4" height="2" fill="#ffd700"/>
    <rect x="7" y="10" width="3" height="2" fill="#ffd700"/>
    <rect x="8" y="12" width="3" height="2" fill="#ffd700"/>
    <rect x="9" y="14" width="2" height="2" fill="#ffd700"/>
  </svg>`,

  heart: `<svg class="retro-icon icon-heart" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="4" width="4" height="2" fill="#ff4d6d"/>
    <rect x="10" y="4" width="4" height="2" fill="#ff4d6d"/>
    <rect x="1" y="5" width="6" height="4" fill="#ff4d6d"/>
    <rect x="9" y="5" width="6" height="4" fill="#ff4d6d"/>
    <rect x="2" y="9" width="12" height="2" fill="#ff4d6d"/>
    <rect x="3" y="11" width="10" height="2" fill="#ff4d6d"/>
    <rect x="5" y="13" width="6" height="2" fill="#ff4d6d"/>
    <rect x="7" y="15" width="2" height="1" fill="#ff4d6d"/>
    <rect x="3" y="5" width="2" height="2" fill="#ff8a9f"/>
  </svg>`,

  trophy: `<svg class="retro-icon icon-trophy" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="1" width="6" height="2" fill="#ffd700"/>
    <rect x="4" y="3" width="8" height="4" fill="#ffd700"/>
    <rect x="2" y="3" width="3" height="3" fill="#ffd700"/>
    <rect x="11" y="3" width="3" height="3" fill="#ffd700"/>
    <rect x="5" y="7" width="6" height="2" fill="#ffd700"/>
    <rect x="6" y="9" width="4" height="2" fill="#b8860b"/>
    <rect x="5" y="11" width="6" height="2" fill="#b8860b"/>
    <rect x="4" y="13" width="8" height="2" fill="#8b4513"/>
    <rect x="6" y="3" width="2" height="2" fill="#ffed4a"/>
  </svg>`,

  gamepad: `<svg class="retro-icon icon-gamepad" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="5" width="12" height="8" fill="#4a5568"/>
    <rect x="1" y="6" width="2" height="6" fill="#4a5568"/>
    <rect x="13" y="6" width="2" height="6" fill="#4a5568"/>
    <rect x="3" y="7" width="1" height="3" fill="#2d3748"/>
    <rect x="4" y="8" width="3" height="1" fill="#2d3748"/>
    <rect x="10" y="7" width="2" height="2" fill="#ff4d6d"/>
    <rect x="12" y="8" width="2" height="2" fill="#4bf3ff"/>
    <rect x="6" y="10" width="4" height="1" fill="#2d3748"/>
  </svg>`,

  door: `<svg class="retro-icon icon-door" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="10" height="12" fill="#8b4513"/>
    <rect x="4" y="3" width="8" height="10" fill="#a0522d"/>
    <rect x="5" y="4" width="6" height="8" fill="#654321"/>
    <rect x="10" y="7" width="2" height="2" fill="#ffd700"/>
    <rect x="1" y="8" width="3" height="2" fill="#4bf3ff"/>
    <rect x="0" y="7" width="2" height="1" fill="#4bf3ff"/>
    <rect x="0" y="10" width="2" height="1" fill="#4bf3ff"/>
  </svg>`,

  check: `<svg class="retro-icon icon-check" viewBox="0 0 16 16" fill="none">
    <rect x="12" y="3" width="2" height="2" fill="#4ee59f"/>
    <rect x="11" y="5" width="2" height="2" fill="#4ee59f"/>
    <rect x="10" y="7" width="2" height="2" fill="#4ee59f"/>
    <rect x="9" y="9" width="2" height="2" fill="#4ee59f"/>
    <rect x="7" y="10" width="3" height="2" fill="#4ee59f"/>
    <rect x="5" y="9" width="3" height="2" fill="#4ee59f"/>
    <rect x="3" y="7" width="3" height="2" fill="#4ee59f"/>
    <rect x="2" y="6" width="2" height="2" fill="#4ee59f"/>
  </svg>`,

  cancel: `<svg class="retro-icon icon-cancel" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="3" width="2" height="2" fill="#ff4d6d"/>
    <rect x="5" y="5" width="2" height="2" fill="#ff4d6d"/>
    <rect x="7" y="7" width="2" height="2" fill="#ff4d6d"/>
    <rect x="9" y="9" width="2" height="2" fill="#ff4d6d"/>
    <rect x="11" y="11" width="2" height="2" fill="#ff4d6d"/>
    <rect x="11" y="3" width="2" height="2" fill="#ff4d6d"/>
    <rect x="9" y="5" width="2" height="2" fill="#ff4d6d"/>
    <rect x="5" y="9" width="2" height="2" fill="#ff4d6d"/>
    <rect x="3" y="11" width="2" height="2" fill="#ff4d6d"/>
  </svg>`,

  chat: `<svg class="retro-icon icon-chat" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="8" fill="#4bf3ff"/>
    <rect x="3" y="4" width="10" height="6" fill="#1a3a4a"/>
    <rect x="2" y="11" width="4" height="2" fill="#4bf3ff"/>
    <rect x="2" y="13" width="2" height="2" fill="#4bf3ff"/>
    <rect x="4" y="5" width="8" height="1" fill="rgba(75,243,255,0.3)"/>
    <rect x="4" y="7" width="6" height="1" fill="rgba(75,243,255,0.3)"/>
  </svg>`,

  arrowRight: `<svg class="retro-icon icon-arrow-right" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="7" width="8" height="2" fill="#f8e71c"/>
    <rect x="8" y="5" width="2" height="6" fill="#f8e71c"/>
    <rect x="10" y="6" width="2" height="4" fill="#f8e71c"/>
    <rect x="12" y="7" width="2" height="2" fill="#f8e71c"/>
  </svg>`,

  refresh: `<svg class="retro-icon icon-refresh" viewBox="0 0 16 16" fill="none">
    <rect x="6" y="2" width="6" height="2" fill="#4bf3ff"/>
    <rect x="10" y="4" width="2" height="2" fill="#4bf3ff"/>
    <rect x="12" y="5" width="2" height="4" fill="#4bf3ff"/>
    <rect x="10" y="9" width="2" height="2" fill="#4bf3ff"/>
    <rect x="4" y="10" width="6" height="2" fill="#4bf3ff"/>
    <rect x="2" y="7" width="2" height="4" fill="#4bf3ff"/>
    <rect x="4" y="5" width="2" height="3" fill="#4bf3ff"/>
    <rect x="6" y="4" width="2" height="2" fill="#4bf3ff"/>
    <rect x="2" y="11" width="4" height="2" fill="#4bf3ff"/>
    <rect x="0" y="10" width="3" height="2" fill="#4bf3ff"/>
  </svg>`,

  star: `<svg class="retro-icon icon-star" viewBox="0 0 16 16" fill="none">
    <rect x="7" y="1" width="2" height="3" fill="#ffd700"/>
    <rect x="6" y="4" width="4" height="2" fill="#ffd700"/>
    <rect x="2" y="5" width="12" height="2" fill="#ffd700"/>
    <rect x="4" y="7" width="8" height="2" fill="#ffd700"/>
    <rect x="5" y="9" width="6" height="2" fill="#ffd700"/>
    <rect x="4" y="11" width="3" height="2" fill="#ffd700"/>
    <rect x="9" y="11" width="3" height="2" fill="#ffd700"/>
    <rect x="3" y="13" width="2" height="2" fill="#ffd700"/>
    <rect x="11" y="13" width="2" height="2" fill="#ffd700"/>
  </svg>`,

  players: `<svg class="retro-icon icon-players" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="1" width="6" height="4" fill="#4bf3ff"/>
    <rect x="4" y="3" width="2" height="2" fill="#4bf3ff"/>
    <rect x="10" y="3" width="2" height="2" fill="#4bf3ff"/>
    <rect x="6" y="5" width="4" height="2" fill="#e8e8e8"/>
    <rect x="5" y="7" width="6" height="4" fill="#4a5568"/>
    <rect x="1" y="10" width="4" height="3" fill="#ff4d6d"/>
    <rect x="11" y="10" width="4" height="3" fill="#4ee59f"/>
    <rect x="2" y="8" width="2" height="3" fill="#ff4d6d"/>
    <rect x="12" y="8" width="2" height="3" fill="#4ee59f"/>
  </svg>`,

  stats: `<svg class="retro-icon icon-stats" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="13" width="14" height="2" fill="#4a5568"/>
    <rect x="2" y="8" width="3" height="5" fill="#4bf3ff"/>
    <rect x="6" y="4" width="3" height="9" fill="#ffd700"/>
    <rect x="10" y="6" width="3" height="7" fill="#ff4d6d"/>
    <rect x="2" y="7" width="3" height="1" fill="#6bf3ff"/>
    <rect x="6" y="3" width="3" height="1" fill="#ffe34d"/>
    <rect x="10" y="5" width="3" height="1" fill="#ff6d8d"/>
  </svg>`,

  chatBubble: `<svg class="retro-icon icon-chat-bubble" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="14" height="9" fill="#4bf3ff"/>
    <rect x="2" y="3" width="12" height="7" fill="#0a1a2a"/>
    <rect x="1" y="11" width="5" height="2" fill="#4bf3ff"/>
    <rect x="1" y="13" width="3" height="2" fill="#4bf3ff"/>
    <rect x="4" y="4" width="8" height="1" fill="rgba(75,243,255,0.4)"/>
    <rect x="4" y="6" width="6" height="1" fill="rgba(75,243,255,0.4)"/>
    <rect x="4" y="8" width="4" height="1" fill="rgba(75,243,255,0.4)"/>
  </svg>`,

  bomberman: `<svg class="retro-icon icon-bomberman" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="1" width="6" height="2" fill="#f8e71c"/>
    <rect x="4" y="3" width="8" height="3" fill="#e8e8e8"/>
    <rect x="5" y="3" width="2" height="2" fill="#1a1a1a"/>
    <rect x="9" y="3" width="2" height="2" fill="#1a1a1a"/>
    <rect x="6" y="6" width="4" height="1" fill="#ff4d6d"/>
    <rect x="4" y="7" width="8" height="4" fill="#4a5568"/>
    <rect x="3" y="8" width="2" height="3" fill="#4a5568"/>
    <rect x="11" y="8" width="2" height="3" fill="#4a5568"/>
    <rect x="5" y="11" width="2" height="3" fill="#2d3748"/>
    <rect x="9" y="11" width="2" height="3" fill="#2d3748"/>
  </svg>`,

  checkmark: `<svg class="retro-icon icon-checkmark" viewBox="0 0 16 16" fill="none">
    <rect x="12" y="2" width="2" height="2" fill="#4ee59f"/>
    <rect x="11" y="4" width="2" height="2" fill="#4ee59f"/>
    <rect x="10" y="6" width="2" height="2" fill="#4ee59f"/>
    <rect x="9" y="8" width="2" height="2" fill="#4ee59f"/>
    <rect x="7" y="9" width="3" height="2" fill="#4ee59f"/>
    <rect x="5" y="8" width="3" height="2" fill="#4ee59f"/>
    <rect x="3" y="6" width="3" height="2" fill="#4ee59f"/>
    <rect x="2" y="5" width="2" height="2" fill="#4ee59f"/>
  </svg>`,

  skull: `<svg class="retro-icon icon-skull" viewBox="0 0 16 16" fill="none">
    <rect x="4" y="2" width="8" height="2" fill="#e8e8e8"/>
    <rect x="3" y="4" width="10" height="6" fill="#e8e8e8"/>
    <rect x="4" y="10" width="8" height="2" fill="#e8e8e8"/>
    <rect x="4" y="4" width="3" height="3" fill="#1a1a1a"/>
    <rect x="9" y="4" width="3" height="3" fill="#1a1a1a"/>
    <rect x="6" y="8" width="4" height="2" fill="#1a1a1a"/>
    <rect x="5" y="12" width="2" height="2" fill="#e8e8e8"/>
    <rect x="9" y="12" width="2" height="2" fill="#e8e8e8"/>
    <rect x="7" y="11" width="2" height="2" fill="#e8e8e8"/>
  </svg>`
};

const ICON_ALIASES = {
  flame: 'fire',
  lightning: 'speed',
  life: 'heart',
  game: 'gamepad',
  leave: 'door',
  ready: 'check',
  x: 'cancel',
  message: 'chat',
  send: 'arrowRight',
  replay: 'refresh',
  users: 'players',
  chart: 'stats',
  chatTitle: 'chatBubble',
  logo: 'bomberman',
  alive: 'checkmark',
  dead: 'skull',
  eliminated: 'skull'
};

export function getIconSVG(name) {
  const resolvedName = ICON_ALIASES[name] || name;
  return SVG_ICONS[resolvedName] || '';
}

export function iconProps(name, className = '') {
  return {
    className: `icon-wrapper ${className}`.trim(),
    innerHTML: getIconSVG(name)
  };
}

export function icon(name, size = 'md') {
  const svg = getIconSVG(name);
  if (!svg) return '';
  return svg.replace('class="retro-icon', `class="retro-icon" data-size="${size}"`);
}

export { SVG_ICONS, ICON_ALIASES };
export default getIconSVG;

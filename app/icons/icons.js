/**
 * Retro Pixel Art SVG Icons
 * Consistent icon system for the entire Bomberman app
 * All icons are inline SVG for crisp pixelated rendering
 */

// Icon size constants
export const ICON_SIZE = {
  XS: 12,
  SM: 16,
  MD: 24,
  LG: 32,
  XL: 48,
  XXL: 64
};

// Create SVG element helper
const createSVG = (content, size = ICON_SIZE.MD, viewBox = '0 0 16 16', className = '') => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('class', `retro-icon ${className}`.trim());
  svg.innerHTML = content;
  return svg;
};

// ============================================
// GAME ICONS
// ============================================

// Bomb icon - classic black bomb with fuse
export const bombIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="5" y="6" width="6" height="6" fill="#1a1a1a"/>
  <rect x="4" y="7" width="8" height="4" fill="#1a1a1a"/>
  <rect x="6" y="5" width="4" height="8" fill="#1a1a1a"/>
  <rect x="7" y="3" width="2" height="2" fill="#8b4513"/>
  <rect x="8" y="1" width="2" height="3" fill="#ff6b35"/>
  <rect x="9" y="0" width="2" height="2" fill="#ffd700"/>
  <rect x="5" y="7" width="2" height="2" fill="#404040"/>
`, size, '0 0 16 16', 'icon-bomb');

// Fire/Flame icon
export const fireIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="7" y="1" width="2" height="2" fill="#ff6b35"/>
  <rect x="6" y="3" width="4" height="2" fill="#ff6b35"/>
  <rect x="5" y="5" width="6" height="2" fill="#ff4500"/>
  <rect x="4" y="7" width="8" height="3" fill="#ff4500"/>
  <rect x="5" y="10" width="6" height="2" fill="#ff6347"/>
  <rect x="6" y="12" width="4" height="2" fill="#ffd700"/>
  <rect x="7" y="14" width="2" height="2" fill="#ffff00"/>
  <rect x="7" y="5" width="2" height="4" fill="#ffd700"/>
`, size, '0 0 16 16', 'icon-fire');

// Lightning/Speed icon
export const speedIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="8" y="0" width="3" height="2" fill="#ffd700"/>
  <rect x="7" y="2" width="3" height="2" fill="#ffd700"/>
  <rect x="6" y="4" width="4" height="2" fill="#ffd700"/>
  <rect x="4" y="6" width="6" height="2" fill="#ffd700"/>
  <rect x="6" y="8" width="4" height="2" fill="#ffd700"/>
  <rect x="7" y="10" width="3" height="2" fill="#ffd700"/>
  <rect x="8" y="12" width="3" height="2" fill="#ffd700"/>
  <rect x="9" y="14" width="2" height="2" fill="#ffd700"/>
`, size, '0 0 16 16', 'icon-speed');

// Heart/Life icon
export const heartIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="2" y="4" width="4" height="2" fill="#ff4d6d"/>
  <rect x="10" y="4" width="4" height="2" fill="#ff4d6d"/>
  <rect x="1" y="5" width="6" height="4" fill="#ff4d6d"/>
  <rect x="9" y="5" width="6" height="4" fill="#ff4d6d"/>
  <rect x="2" y="9" width="12" height="2" fill="#ff4d6d"/>
  <rect x="3" y="11" width="10" height="2" fill="#ff4d6d"/>
  <rect x="5" y="13" width="6" height="2" fill="#ff4d6d"/>
  <rect x="7" y="15" width="2" height="1" fill="#ff4d6d"/>
  <rect x="3" y="5" width="2" height="2" fill="#ff8a9f"/>
`, size, '0 0 16 16', 'icon-heart');

// ============================================
// UI ICONS
// ============================================

// Trophy icon
export const trophyIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="5" y="1" width="6" height="2" fill="#ffd700"/>
  <rect x="4" y="3" width="8" height="4" fill="#ffd700"/>
  <rect x="2" y="3" width="3" height="3" fill="#ffd700"/>
  <rect x="11" y="3" width="3" height="3" fill="#ffd700"/>
  <rect x="5" y="7" width="6" height="2" fill="#ffd700"/>
  <rect x="6" y="9" width="4" height="2" fill="#b8860b"/>
  <rect x="5" y="11" width="6" height="2" fill="#b8860b"/>
  <rect x="4" y="13" width="8" height="2" fill="#8b4513"/>
  <rect x="6" y="3" width="2" height="2" fill="#ffed4a"/>
`, size, '0 0 16 16', 'icon-trophy');

// Gamepad icon
export const gamepadIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="2" y="5" width="12" height="8" fill="#4a5568"/>
  <rect x="1" y="6" width="2" height="6" fill="#4a5568"/>
  <rect x="13" y="6" width="2" height="6" fill="#4a5568"/>
  <rect x="3" y="7" width="1" height="3" fill="#2d3748"/>
  <rect x="4" y="8" width="3" height="1" fill="#2d3748"/>
  <rect x="10" y="7" width="2" height="2" fill="#ff4d6d"/>
  <rect x="12" y="8" width="2" height="2" fill="#4bf3ff"/>
  <rect x="6" y="10" width="4" height="1" fill="#2d3748"/>
`, size, '0 0 16 16', 'icon-gamepad');

// Door/Leave icon
export const doorIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="3" y="2" width="10" height="12" fill="#8b4513"/>
  <rect x="4" y="3" width="8" height="10" fill="#a0522d"/>
  <rect x="5" y="4" width="6" height="8" fill="#654321"/>
  <rect x="10" y="7" width="2" height="2" fill="#ffd700"/>
  <rect x="1" y="8" width="3" height="2" fill="#4bf3ff"/>
  <rect x="0" y="7" width="2" height="1" fill="#4bf3ff"/>
  <rect x="0" y="10" width="2" height="1" fill="#4bf3ff"/>
`, size, '0 0 16 16', 'icon-door');

// Check/Ready icon
export const checkIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="12" y="3" width="2" height="2" fill="#4ee59f"/>
  <rect x="11" y="5" width="2" height="2" fill="#4ee59f"/>
  <rect x="10" y="7" width="2" height="2" fill="#4ee59f"/>
  <rect x="9" y="9" width="2" height="2" fill="#4ee59f"/>
  <rect x="7" y="10" width="3" height="2" fill="#4ee59f"/>
  <rect x="5" y="9" width="3" height="2" fill="#4ee59f"/>
  <rect x="3" y="7" width="3" height="2" fill="#4ee59f"/>
  <rect x="2" y="6" width="2" height="2" fill="#4ee59f"/>
`, size, '0 0 16 16', 'icon-check');

// X/Cancel icon
export const cancelIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="3" y="3" width="2" height="2" fill="#ff4d6d"/>
  <rect x="5" y="5" width="2" height="2" fill="#ff4d6d"/>
  <rect x="7" y="7" width="2" height="2" fill="#ff4d6d"/>
  <rect x="9" y="9" width="2" height="2" fill="#ff4d6d"/>
  <rect x="11" y="11" width="2" height="2" fill="#ff4d6d"/>
  <rect x="11" y="3" width="2" height="2" fill="#ff4d6d"/>
  <rect x="9" y="5" width="2" height="2" fill="#ff4d6d"/>
  <rect x="5" y="9" width="2" height="2" fill="#ff4d6d"/>
  <rect x="3" y="11" width="2" height="2" fill="#ff4d6d"/>
`, size, '0 0 16 16', 'icon-cancel');

// Chat/Message icon
export const chatIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="2" y="3" width="12" height="8" fill="#4bf3ff"/>
  <rect x="3" y="4" width="10" height="6" fill="#1a3a4a"/>
  <rect x="2" y="11" width="4" height="2" fill="#4bf3ff"/>
  <rect x="2" y="13" width="2" height="2" fill="#4bf3ff"/>
  <rect x="4" y="5" width="8" height="1" fill="#4bf3ff50"/>
  <rect x="4" y="7" width="6" height="1" fill="#4bf3ff50"/>
`, size, '0 0 16 16', 'icon-chat');

// Arrow right icon
export const arrowRightIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="2" y="7" width="8" height="2" fill="#f8e71c"/>
  <rect x="8" y="5" width="2" height="6" fill="#f8e71c"/>
  <rect x="10" y="6" width="2" height="4" fill="#f8e71c"/>
  <rect x="12" y="7" width="2" height="2" fill="#f8e71c"/>
`, size, '0 0 16 16', 'icon-arrow-right');

// Refresh/Replay icon
export const refreshIcon = (size = ICON_SIZE.MD) => createSVG(`
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
`, size, '0 0 16 16', 'icon-refresh');

// Star icon
export const starIcon = (size = ICON_SIZE.MD) => createSVG(`
  <rect x="7" y="1" width="2" height="3" fill="#ffd700"/>
  <rect x="6" y="4" width="4" height="2" fill="#ffd700"/>
  <rect x="2" y="5" width="12" height="2" fill="#ffd700"/>
  <rect x="4" y="7" width="8" height="2" fill="#ffd700"/>
  <rect x="5" y="9" width="6" height="2" fill="#ffd700"/>
  <rect x="4" y="11" width="3" height="2" fill="#ffd700"/>
  <rect x="9" y="11" width="3" height="2" fill="#ffd700"/>
  <rect x="3" y="13" width="2" height="2" fill="#ffd700"/>
  <rect x="11" y="13" width="2" height="2" fill="#ffd700"/>
`, size, '0 0 16 16', 'icon-star');

// ============================================
// HELPER: Create icon element for framework
// ============================================
export const createIconElement = (iconFn, size = ICON_SIZE.MD) => {
  const wrapper = document.createElement('span');
  wrapper.className = 'icon-wrapper';
  wrapper.appendChild(iconFn(size));
  return wrapper;
};

// Icon map for easy access by name
export const ICONS = {
  bomb: bombIcon,
  fire: fireIcon,
  flame: fireIcon,
  speed: speedIcon,
  lightning: speedIcon,
  heart: heartIcon,
  life: heartIcon,
  trophy: trophyIcon,
  gamepad: gamepadIcon,
  game: gamepadIcon,
  door: doorIcon,
  leave: doorIcon,
  check: checkIcon,
  ready: checkIcon,
  cancel: cancelIcon,
  x: cancelIcon,
  chat: chatIcon,
  message: chatIcon,
  arrowRight: arrowRightIcon,
  send: arrowRightIcon,
  refresh: refreshIcon,
  replay: refreshIcon,
  star: starIcon
};

// Get icon SVG string (for innerHTML usage)
export const getIconSVG = (name, size = ICON_SIZE.MD) => {
  const iconFn = ICONS[name];
  if (!iconFn) return '';
  const svg = iconFn(size);
  return svg.outerHTML;
};

export default ICONS;

import { render } from './vdom.js';
import { createStore } from './store.js';
import { eventRegistry, attachDelegatedListener } from './events.js';

// Initializes the application with state management and rendering
// This is the main entry point that wires everything together
export function createApp({ view, initialState, rootElement }) {
  const store = createStore(initialState);

  // Set up event delegation root
  eventRegistry.root = rootElement;
  eventRegistry.events.forEach(ev => attachDelegatedListener(rootElement, ev));

  // Continuous render loop for smooth 60fps
  let isRunning = true;
  let lastState = null;

  function gameLoop() {
    if (!isRunning) return;

    const state = store.getState();
    const vNode = view(state);
    render(vNode, rootElement);
    lastState = state;

    requestAnimationFrame(gameLoop);
  }

  // Start the continuous render loop
  requestAnimationFrame(gameLoop);

  // Return store with stop method
  const extendedStore = {
    ...store,
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    stop: () => { isRunning = false; }
  };

  return extendedStore;
}

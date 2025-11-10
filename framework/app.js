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

    // Prevent concurrent renders to avoid race conditions
    let isRendering = false;
    let pendingRender = false;

    function renderLoop() {
        // If already rendering, schedule another render after this one
        if (isRendering) {
            pendingRender = true;
            return;
        }

        isRendering = true;

        const state = store.getState();
        const vNode = view(state);
        render(vNode, rootElement);

        isRendering = false;

        // Process pending render if state changed during render
        if (pendingRender) {
            pendingRender = false;
            requestAnimationFrame(renderLoop);
        }
    }

    // Subscribe to state changes to trigger re-renders
    store.subscribe(renderLoop);

    // Initial render
    renderLoop();

    return store;
}

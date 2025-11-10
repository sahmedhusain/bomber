// Hash-based routing system
// Synchronizes URL hash (#/, #/active, #/completed) with application state
export function createRouter(store) {
    function updateRoute() {
        const hash = window.location.hash || '#/';
        // Update state to trigger re-render with new filter
        store.setState({ currentFilter: hash });
    }

    // Listen for hash changes (browser back/forward, manual changes)
    window.addEventListener('hashchange', updateRoute);
    updateRoute(); // Set initial route
}

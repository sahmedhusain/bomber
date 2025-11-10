// Creates a reactive state store with pub/sub pattern
// State updates automatically notify all subscribers
export function createStore(initialState) {
    let state = initialState;
    const listeners = [];

    return {
        // Add a listener that will be called on every state change
        subscribe(listener) {
            listeners.push(listener);
        },

        // Get current state (immutable reference)
        getState() {
            return state;
        },

        // Update state and notify all listeners
        // Uses shallow merge to maintain immutability
        setState(newState) {
            state = { ...state, ...newState };
            listeners.forEach(listener => listener());
        }
    };
}

// Helper for two-way data binding on input elements
// Returns attrs object with value and oninput handler
export function bindInput(store, path) {
    return {
        value: getNestedValue(store.getState(), path),
        oninput: (event) => {
            setNestedValue(store, path, event.target.value);
        }
    };
}

// Safely get nested property using dot notation (e.g., "user.name")
function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current == null) return undefined;
        current = current[key];
    }
    return current;
}

// Safely set nested property while maintaining immutability
function setNestedValue(store, path, value) {
    const keys = path.split('.');
    const state = store.getState();
    const newState = { ...state };
    let current = newState;

    // Clone nested objects to maintain immutability
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    store.setState(newState);
}

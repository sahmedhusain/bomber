// Event delegation registry - central hub for all event handlers
// This approach uses a single listener per event type on the root element
// instead of attaching individual listeners to every element
export const eventRegistry = {
    nextId: 1,                          // Auto-incrementing ID for handlers
    handlers: Object.create(null),      // Map of handler IDs to functions
    handlerToId: new WeakMap(),         // Deduplication: function → ID
    events: new Set(),                  // Tracks which event types we handle
    root: null,                         // Root DOM element for delegation
    attached: new Set()                 // Tracks attached event listeners
};

// Registers an event handler and returns its unique ID
// Handlers are deduplicated - same function always gets same ID
export function registerEventHandler(eventName, handler) {
    // Check if this exact handler function was already registered
    if (eventRegistry.handlerToId.has(handler)) {
        const existingId = eventRegistry.handlerToId.get(handler);
        eventRegistry.events.add(eventName);
        if (eventRegistry.root && !eventRegistry.attached.has(eventName)) {
            attachDelegatedListener(eventRegistry.root, eventName);
        }
        return existingId;
    }

    // Register new handler
    const id = `ev${eventRegistry.nextId++}`;
    eventRegistry.handlers[id] = handler;
    eventRegistry.handlerToId.set(handler, id);
    eventRegistry.events.add(eventName);

    // Attach delegated listener if root exists and not already attached
    if (eventRegistry.root && !eventRegistry.attached.has(eventName)) {
        attachDelegatedListener(eventRegistry.root, eventName);
    }

    return id;
}

// Attaches a single delegated event listener to the root element
// This listener handles all events of this type via event bubbling
export function attachDelegatedListener(root, eventName) {
    if (eventRegistry.attached.has(eventName)) return;

    root.addEventListener(eventName, (event) => {
        let el = event.target;
        
        // Bubble up the DOM tree looking for an element with our handler
        while (el && el !== root) {
            const handlerId = el.getAttribute(`data-ev-${eventName}`);
            if (handlerId) {
                const handler = eventRegistry.handlers[handlerId];
                if (typeof handler === 'function') {
                    try {
                        handler.call(el, event);
                    } catch (e) {
                        console.error(e);
                    }
                }
                break; // Stop bubbling after finding first handler
            }
            el = el.parentElement;
        }
    });

    eventRegistry.attached.add(eventName);
}

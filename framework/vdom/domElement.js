import { TEXT_ELEMENT } from './createElement.js';
import { registerEventHandler } from '../events.js';

// Creates actual DOM elements from Virtual DOM nodes
// Recursively processes children and sets up event handlers
export function createDOMElement(vNode) {
    // Handle text nodes
    if (vNode.tag === TEXT_ELEMENT) {
        return document.createTextNode(vNode.children[0] || '');
    }

    // Create element with proper namespace for SVG
    const element = document.createElement(vNode.tag);

    // Set attributes and properties
    for (const key in vNode.attrs) {
        const value = vNode.attrs[key];

        if (key.startsWith('on') && typeof value === 'function') {
            // Event handler: register with delegation system
            const eventName = key.substring(2).toLowerCase();
            const handlerId = registerEventHandler(eventName, value);
            element.setAttribute(`data-ev-${eventName}`, handlerId);
        } else if (key === 'checked') {
            element.checked = value === true || value === 'true' || value === '';
        } else if (key === 'value') {
            element.value = value ?? '';
        } else if (typeof value === 'boolean') {
            if (value) {
                element.setAttribute(key, '');
            }
        } else if (key in element && key !== 'list' && key !== 'type' && key !== 'draggable' && key !== 'key') {
            element[key] = value;
        } else if (key !== 'key') {
            element.setAttribute(key, value);
        }
    }

    // Recursively create and append child elements
    if (vNode.children) {
        vNode.children.forEach(child => {
            if (child != null && child !== false) {
                element.appendChild(createDOMElement(child));
            }
        });
    }

    return element;
}

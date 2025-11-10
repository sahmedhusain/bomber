import { patch } from './patch.js';
import { createDOMElement } from './domElement.js';

// Main render function that updates the DOM while preserving focus and cursor position
// Uses data-focuskey attribute to track and restore input focus across renders
export function render(vNode, container) {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
    let focusKey = null;
    let activeSelectionStart = null;
    let activeSelectionEnd = null;

    // Capture focus state before updating DOM
    if (isInputFocused && activeElement.closest('#root')) {
        focusKey = activeElement.getAttribute('data-focuskey');
        if (!focusKey) {
            // Generate unique key if not present
            focusKey = `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            activeElement.setAttribute('data-focuskey', focusKey);
        }
        // Save cursor position for restoration
        activeSelectionStart = activeElement.selectionStart;
        activeSelectionEnd = activeElement.selectionEnd;
    }

    if (!container.__oldVNode) {
        // First render: create DOM from vNode
        container.innerHTML = '';
        const domElement = createDOMElement(vNode);
        container.appendChild(domElement);
        container.__oldVNode = vNode;
    } else {
        // Subsequent renders: patch existing DOM efficiently
        patch(container, container.__oldVNode, vNode, 0);
        container.__oldVNode = vNode;
    }

    // Restore focus and cursor position after DOM update
    if (focusKey) {
        const newElement = container.querySelector(`[data-focuskey="${focusKey}"]`);
        if (newElement && (newElement.tagName === 'INPUT' || newElement.tagName === 'TEXTAREA')) {
            newElement.focus();
            if (activeSelectionStart !== null && activeSelectionEnd !== null) {
                try {
                    newElement.setSelectionRange(activeSelectionStart, activeSelectionEnd);
                } catch (e) {
                    // Silently ignore if setSelectionRange fails (e.g., input type doesn't support it)
                }
            }
        }
    }
}

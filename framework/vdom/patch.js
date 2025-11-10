import { patchAttrs } from './attrs.js';
import { createDOMElement } from './domElement.js';
import { TEXT_ELEMENT } from './createElement.js';

// Core diffing algorithm - compares old and new Virtual DOM nodes and updates real DOM
// Minimizes DOM operations by only patching differences
export function patch(parent, oldVNode, newVNode, index = 0) {
    const domNode = parent.childNodes[index];

    // Node removed
    if (!newVNode || newVNode === false || newVNode === null || newVNode === undefined) {
        if (domNode) {
            parent.removeChild(domNode);
        }
        return;
    }

    // Node added
    if (!oldVNode || oldVNode === false || oldVNode === null || oldVNode === undefined) {
        const newElement = createDOMElement(newVNode);
        parent.appendChild(newElement);
        return;
    }

    // Handle primitive children (strings/numbers)
    if (typeof oldVNode === 'string' || typeof oldVNode === 'number' || typeof newVNode === 'string' || typeof newVNode === 'number') {
        if (oldVNode !== newVNode) {
            const newElement = createDOMElement(newVNode);
            if (domNode) {
                parent.replaceChild(newElement, domNode);
            } else {
                parent.appendChild(newElement);
            }
        }
        return;
    }

    if (typeof oldVNode !== 'object' || typeof newVNode !== 'object') {
        return;
    }

    // Different tag type - replace entire subtree
    if (oldVNode.tag !== newVNode.tag) {
        const newElement = createDOMElement(newVNode);
        if (domNode) {
            parent.replaceChild(newElement, domNode);
        } else {
            parent.appendChild(newElement);
        }
        return;
    }

    // Text node - update content if changed
    if (oldVNode.tag === TEXT_ELEMENT) {
        if (oldVNode.children && newVNode.children && oldVNode.children[0] !== newVNode.children[0]) {
            if (domNode && domNode.nodeType === Node.TEXT_NODE) {
                domNode.nodeValue = newVNode.children[0] || '';
            }
        }
        return;
    }

    if (!domNode) {
        const newElement = createDOMElement(newVNode);
        parent.appendChild(newElement);
        return;
    }

    // Same tag - patch attributes and recurse into children
    patchAttrs(domNode, oldVNode.attrs || {}, newVNode.attrs || {});

    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];

    // Use keyed reconciliation if any children have keys
    const oldHasKeys = oldChildren.some(child => child && typeof child === 'object' && child.key !== undefined);
    const newHasKeys = newChildren.some(child => child && typeof child === 'object' && child.key !== undefined);

    if (oldHasKeys || newHasKeys) {
        patchKeyedChildren(domNode, oldChildren, newChildren);
    } else {
        // Simple index-based reconciliation for unkeyed children
        const maxLength = Math.max(oldChildren.length, newChildren.length);
        for (let i = 0; i < maxLength; i++) {
            patch(domNode, oldChildren[i], newChildren[i], i);
        }
    }
}

// Advanced diffing for keyed children - preserves DOM nodes by matching keys
// Uses Maps for O(1) lookups instead of O(n) array searches
export function patchKeyedChildren(parent, oldChildren, newChildren) {
    // Build lookup maps for keyed nodes
    const oldKeyToNode = new Map();
    const oldKeyToVNode = new Map();
    const oldUnkeyedNodes = [];
    const oldUnkeyedVNodes = [];
    
    for (let i = 0; i < oldChildren.length; i++) {
        const child = oldChildren[i];
        const key = child && typeof child === 'object' ? child.key : undefined;
        const domNode = parent.childNodes[i];
        
        if (key !== undefined) {
            oldKeyToNode.set(key, domNode);
            oldKeyToVNode.set(key, child);
        } else {
            oldUnkeyedNodes.push(domNode);
            oldUnkeyedVNodes.push(child);
        }
    }

    let unkeyedIndex = 0;

    // Process new children in order
    for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const newKey = newChild && typeof newChild === 'object' ? newChild.key : undefined;
        
        if (newKey !== undefined) {
            // Keyed node: reuse existing DOM node if found
            const oldDomNode = oldKeyToNode.get(newKey);
            const oldChild = oldKeyToVNode.get(newKey);
            
            if (oldDomNode && oldChild) {
                const currentDomNodeAtPosition = parent.childNodes[i];
                
                // Move node to correct position if needed
                if (oldDomNode !== currentDomNodeAtPosition) {
                    parent.insertBefore(oldDomNode, currentDomNodeAtPosition || null);
                }
                
                // Patch the node's attributes and children
                if (oldChild.tag === 'TEXT_ELEMENT') {
                    if (oldChild.attrs.nodeValue !== newChild.attrs.nodeValue) {
                        oldDomNode.nodeValue = newChild.attrs.nodeValue;
                    }
                } else {
                    patchAttrs(oldDomNode, oldChild.attrs || {}, newChild.attrs || {});
                    
                    const oldGrandChildren = oldChild.children || [];
                    const newGrandChildren = newChild.children || [];
                    const maxGrandChildren = Math.max(oldGrandChildren.length, newGrandChildren.length);
                    
                    for (let j = 0; j < maxGrandChildren; j++) {
                        patch(oldDomNode, oldGrandChildren[j], newGrandChildren[j], j);
                    }
                }
                
                // Mark this key as processed
                oldKeyToNode.delete(newKey);
            } else {
                // New keyed node: create and insert
                const newElement = createDOMElement(newChild);
                const currentDomNodeAtPosition = parent.childNodes[i];
                parent.insertBefore(newElement, currentDomNodeAtPosition || null);
            }
        } else {
            // Unkeyed node: reuse from unkeyed pool
            if (unkeyedIndex < oldUnkeyedVNodes.length) {
                const oldChild = oldUnkeyedVNodes[unkeyedIndex];
                const oldDomNode = oldUnkeyedNodes[unkeyedIndex];
                unkeyedIndex++;
                
                const currentDomNodeAtPosition = parent.childNodes[i];
                
                if (oldDomNode !== currentDomNodeAtPosition) {
                    parent.insertBefore(oldDomNode, currentDomNodeAtPosition || null);
                }
                
                patch(parent, oldChild, newChild, i);
            } else {
                // No unkeyed nodes left: create new
                const newElement = createDOMElement(newChild);
                const currentDomNodeAtPosition = parent.childNodes[i];
                parent.insertBefore(newElement, currentDomNodeAtPosition || null);
            }
        }
    }

    // Remove old keyed nodes that weren't reused
    for (const domNode of oldKeyToNode.values()) {
        if (domNode && domNode.parentNode === parent) {
            parent.removeChild(domNode);
        }
    }
    
    // Remove excess unkeyed nodes
    for (let i = unkeyedIndex; i < oldUnkeyedNodes.length; i++) {
        const domNode = oldUnkeyedNodes[i];
        if (domNode && domNode.parentNode === parent) {
            parent.removeChild(domNode);
        }
    }
}


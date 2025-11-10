// Special symbol for text nodes in the Virtual DOM tree
export const TEXT_ELEMENT = Symbol('TEXT_ELEMENT');

// Creates a Virtual DOM node (vNode) from tag, attributes, and children
// vNode structure: { tag, attrs, children, key }
// Text strings are automatically converted to TEXT_ELEMENT nodes
export function createElement(tag, attrs = {}, ...children) {
    const key = attrs && attrs.key;
    
    // Flatten nested arrays and convert text to TEXT_ELEMENT nodes
    const flatChildren = children
        .flat(Infinity)
        .map(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                // Wrap primitive values in TEXT_ELEMENT for uniform handling
                return { tag: TEXT_ELEMENT, attrs: {}, children: [String(child)] };
            }
            return child;
        })
        .filter(child => child != null && child !== false);

    const vNode = {
        tag,
        attrs: attrs || {},
        children: flatChildren
    };
    
    if (key !== undefined) {
        vNode.key = key;
        vNode.attrs.key = key;
    }
    
    return vNode;
}

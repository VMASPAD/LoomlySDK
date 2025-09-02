/**
 * New Component Registry System for localStorage serialization
 * Based on registry + snapshot serializable pattern
 */
import type { ComponentType } from 'react';
import type { ComponentConfig } from '@/config/ComponentsConfig';
import { REACT_COMPONENTS_CONFIG } from '@/config/ComponentsConfig';

// Import available components
import Prism from '@/components/Backgrounds/Prism/Prism';
import Waves from '@/components/Backgrounds/Waves/Waves';

// Registry of available components
export const componentRegistry = {
    Prism: Prism,
    Waves: Waves,
    // Add more components as they become available
} as const;

// Handler registry for event handlers (for serializable storage)
export const handlerRegistry = {
    onDefaultClick: (id: string) => console.log('🖱️ Component clicked:', id),
    onDefaultHover: (id: string) => console.log('🔍 Component hovered:', id),
    // Add more handlers as needed
} as const;

// Type definitions for saved elements
export type SavedElement = {
    id: string;                                    // Unique element ID
    name: keyof typeof componentRegistry;          // Component name in registry  
    props: Record<string, any>;                    // Serializable props only
    position: {                                    // Element position and transform
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        scale?: number;
    };
    styles?: Record<string, any>;                  // Additional CSS styles
    version?: number;                              // For future migrations
    timestamp?: number;                            // When it was saved
};

export type SavedProject = {
    id: string;
    name: string;
    elements: SavedElement[];
    canvas: {
        width: number;
        height: number;
    };
    version: number;
    timestamp: number;
};

const STORAGE_KEY = 'loomly_saved_elements';
const PROJECT_STORAGE_KEY = 'loomly_saved_projects';

/**
 * Save a single element to localStorage
 */
export function saveElement(element: SavedElement): void {
    try {
        const allElements = loadAllElements();
        const existingIndex = allElements.findIndex(el => el.id === element.id);
        
        if (existingIndex >= 0) {
            allElements[existingIndex] = { ...element, timestamp: Date.now() };
        } else {
            allElements.push({ ...element, timestamp: Date.now() });
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allElements));
        console.log('💾 Element saved to localStorage:', element.name, element.id);
    } catch (error) {
        console.error('❌ Error saving element:', error);
    }
}

/**
 * Load all saved elements from localStorage
 */
export function loadAllElements(): SavedElement[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ Error loading elements:', error);
        return [];
    }
}

/**
 * Load a specific element by ID
 */
export function loadElement(id: string): SavedElement | undefined {
    const allElements = loadAllElements();
    return allElements.find(el => el.id === id);
}

/**
 * Remove an element from localStorage
 */
export function removeElement(id: string): void {
    try {
        const allElements = loadAllElements().filter(el => el.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allElements));
        console.log('🗑️ Element removed from localStorage:', id);
    } catch (error) {
        console.error('❌ Error removing element:', error);
    }
}

/**
 * Save a complete project
 */
export function saveProject(project: SavedProject): void {
    try {
        const allProjects = loadAllProjects();
        const existingIndex = allProjects.findIndex(p => p.id === project.id);
        
        const projectToSave = { 
            ...project, 
            timestamp: Date.now(),
            version: 1 
        };
        
        if (existingIndex >= 0) {
            allProjects[existingIndex] = projectToSave;
        } else {
            allProjects.push(projectToSave);
        }
        
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(allProjects));
        console.log('💾 Project saved to localStorage:', project.name);
    } catch (error) {
        console.error('❌ Error saving project:', error);
    }
}

/**
 * Load all saved projects
 */
export function loadAllProjects(): SavedProject[] {
    try {
        const data = localStorage.getItem(PROJECT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        return [];
    }
}

/**
 * Load a specific project by ID
 */
export function loadProject(id: string): SavedProject | undefined {
    const allProjects = loadAllProjects();
    return allProjects.find(p => p.id === id);
}

/**
 * Create a SavedElement from a DOM element and component info
 */
export function createSavedElement(
    domElement: HTMLElement,
    componentName: keyof typeof componentRegistry,
    props: Record<string, any> = {}
): SavedElement {
    const rect = domElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(domElement);
    const transform = computedStyle.transform;
    
    // Parse transform matrix to get rotation and scale
    let rotation = 0;
    let scale = 1;
    
    if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
            const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
            if (values.length >= 6) {
                // Extract rotation from matrix
                rotation = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
                // Extract scale from matrix
                scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
            }
        }
    }
    
    return {
        id: domElement.id || `${componentName}-${Date.now()}`,
        name: componentName,
        props: serializeProps(props),
        position: {
            x: parseInt(domElement.style.left) || 0,
            y: parseInt(domElement.style.top) || 0,
            width: parseInt(domElement.style.width) || rect.width,
            height: parseInt(domElement.style.height) || rect.height,
            rotation: rotation !== 0 ? rotation : undefined,
            scale: scale !== 1 ? scale : undefined,
        },
        styles: extractSerializableStyles(computedStyle),
        version: 1,
        timestamp: Date.now()
    };
}

/**
 * Serialize props to make them localStorage-safe
 */
function serializeProps(props: Record<string, any>): Record<string, any> {
    const serialized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'function') {
            // Convert functions to handler references
            const handlerName = findHandlerName(value);
            if (handlerName) {
                serialized[key] = `handler:${handlerName}`;
            }
        } else if (value !== undefined && value !== null) {
            try {
                // Test if value is serializable
                JSON.stringify(value);
                serialized[key] = value;
            } catch {
                // Skip non-serializable values
                console.warn('⚠️ Skipping non-serializable prop:', key);
            }
        }
    }
    
    return serialized;
}

/**
 * Find handler name in registry
 */
function findHandlerName(func: Function): string | null {
    for (const [name, handler] of Object.entries(handlerRegistry)) {
        if (handler === func) {
            return name;
        }
    }
    return null;
}

/**
 * Extract serializable CSS styles
 */
function extractSerializableStyles(computedStyle: CSSStyleDeclaration): Record<string, any> {
    const serializableStyles: Record<string, any> = {};
    
    // List of CSS properties we want to preserve
    const preserveProperties = [
        'backgroundColor', 'color', 'fontSize', 'fontFamily', 'fontWeight',
        'textAlign', 'borderRadius', 'padding', 'margin', 'border',
        'boxShadow', 'opacity', 'zIndex', 'overflow'
    ];
    
    for (const property of preserveProperties) {
        const value = computedStyle.getPropertyValue(property);
        if (value && value !== 'initial' && value !== 'inherit') {
            serializableStyles[property] = value;
        }
    }
    
    return serializableStyles;
}

/**
 * Get component from registry
 */
export function getComponent(name: keyof typeof componentRegistry): ComponentType<any> | null {
    return componentRegistry[name] || null;
}

/**
 * Check if component exists in registry
 */
export function isComponentInRegistry(name: string): name is keyof typeof componentRegistry {
    return name in componentRegistry;
}

/**
 * Get component configuration
 */
export function getComponentConfigFromRegistry(name: keyof typeof componentRegistry): ComponentConfig | null {
    return REACT_COMPONENTS_CONFIG[name as string] || null;
}

/**
 * Clear all saved data
 */
export function clearAllSavedData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROJECT_STORAGE_KEY);
        console.log('🧹 All saved data cleared');
    } catch (error) {
        console.error('❌ Error clearing saved data:', error);
    }
}
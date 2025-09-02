/**
 * Component recreator for restoring saved elements from localStorage
 */
import React, { type JSX } from 'react';
import { 
    componentRegistry, 
    handlerRegistry, 
    loadElement, 
    type SavedElement 
} from '@/services/ComponentRegistry.v2';

interface RecreateElementProps {
    elementId: string;
    onError?: (error: string) => void;
}

/**
 * Recreate a saved component from localStorage
 */
export function RecreateElement({ elementId, onError }: RecreateElementProps): JSX.Element | null {
    const savedElement = loadElement(elementId);
    
    if (!savedElement) {
        const errorMsg = `Element not found: ${elementId}`;
        console.error('❌', errorMsg);
        onError?.(errorMsg);
        return null;
    }

    const Component = componentRegistry[savedElement.name];
    
    if (!Component) {
        const errorMsg = `Component not found in registry: ${savedElement.name}`;
        console.error('❌', errorMsg);
        onError?.(errorMsg);
        return null;
    }

    // Deserialize props and restore handlers
    const props = deserializeProps(savedElement.props);
    
    // Apply position and styles
    const elementStyle: React.CSSProperties = {
        position: 'absolute',
        left: savedElement.position.x,
        top: savedElement.position.y,
        width: savedElement.position.width,
        height: savedElement.position.height,
        transform: buildTransform(savedElement.position),
        ...savedElement.styles,
    };

    return (
        <div
            id={savedElement.id}
            style={elementStyle}
            data-react-component={savedElement.name}
            data-component-version={savedElement.version}
            className="moveable-element"
        >
            <Component {...props} />
        </div>
    );
}

/**
 * Recreate multiple elements at once
 */
interface RecreateElementsProps {
    elementIds: string[];
    onError?: (elementId: string, error: string) => void;
}

export function RecreateElements({ elementIds, onError }: RecreateElementsProps): JSX.Element {
    return (
        <>
            {elementIds.map(elementId => (
                <RecreateElement
                    key={elementId}
                    elementId={elementId}
                    onError={(error) => onError?.(elementId, error)}
                />
            ))}
        </>
    );
}

/**
 * Recreate all elements from a saved project
 */
interface RecreateProjectProps {
    elements: SavedElement[];
    onError?: (elementId: string, error: string) => void;
}

export function RecreateProject({ elements, onError }: RecreateProjectProps): JSX.Element {
    return (
        <>
            {elements.map(element => (
                <RecreateElementFromData
                    key={element.id}
                    element={element}
                    onError={(error) => onError?.(element.id, error)}
                />
            ))}
        </>
    );
}

/**
 * Recreate element directly from SavedElement data
 */
interface RecreateElementFromDataProps {
    element: SavedElement;
    onError?: (error: string) => void;
}

export function RecreateElementFromData({ element, onError }: RecreateElementFromDataProps): JSX.Element | null {
    const Component = componentRegistry[element.name];
    
    if (!Component) {
        const errorMsg = `Component not found in registry: ${element.name}`;
        console.error('❌', errorMsg);
        onError?.(errorMsg);
        return null;
    }

    // Deserialize props and restore handlers
    const props = deserializeProps(element.props);
    
    // Apply position and styles
    const elementStyle: React.CSSProperties = {
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.position.width,
        height: element.position.height,
        transform: buildTransform(element.position),
        ...element.styles,
    };

    console.log('🔄 Recreating component:', element.name, element.id);

    return (
        <div
            id={element.id}
            style={elementStyle}
            data-react-component={element.name}
            data-component-version={element.version}
            className="moveable-element"
        >
            <Component {...props} />
        </div>
    );
}

/**
 * Deserialize props and restore event handlers
 */
function deserializeProps(savedProps: Record<string, any>): Record<string, any> {
    const props: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(savedProps)) {
        if (typeof value === 'string' && value.startsWith('handler:')) {
            // Restore handler from registry
            const handlerName = value.replace('handler:', '') as keyof typeof handlerRegistry;
            const handler = handlerRegistry[handlerName];
            
            if (handler) {
                props[key] = handler;
            } else {
                console.warn(`⚠️ Handler not found in registry: ${handlerName}`);
            }
        } else {
            props[key] = value;
        }
    }
    
    return props;
}

/**
 * Build CSS transform string from position data
 */
function buildTransform(position: SavedElement['position']): string {
    const transforms: string[] = [];
    
    if (position.rotation) {
        transforms.push(`rotate(${position.rotation}deg)`);
    }
    
    if (position.scale && position.scale !== 1) {
        transforms.push(`scale(${position.scale})`);
    }
    
    return transforms.length > 0 ? transforms.join(' ') : '';
}

export default RecreateElement;
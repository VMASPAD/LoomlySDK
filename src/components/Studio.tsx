import { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { 
    ResizablePanelGroup, 
    ResizablePanel, 
    ResizableHandle 
} from './ui/resizable';

// Component imports
import CanvasDialog from './CanvasDialog';
import ElementsPanel from './Elements';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import Properties from './Properties';

// New registry system imports
import { 
    saveElement, 
    saveProject, 
    loadAllElements,
    clearAllSavedData,
    type SavedElement,
    type SavedProject,
    componentRegistry,
    isComponentInRegistry
} from '../services/ComponentRegistry.v2';

// Legacy services import (for backward compatibility)
import { ComponentRegistry } from '../services/ComponentRegistry';
import { getComponentConfig, getComponentImportPath, getDefaultSize, getDefaultProps } from '../config/ComponentsConfig'; 

// Interfaces for the editor
interface ElementData {
    id: string;
    type: 'rectangle' | 'circle' | 'text' | 'div' | 'p' | 'h1' | 'react-component';
    element: HTMLElement;
    isLocked: boolean;
    isVisible: boolean;
    zIndex: number;
    name: string;
}

interface MoveableSettings {
    draggable: boolean;
    resizable: boolean;
    scalable: boolean;
    rotatable: boolean;
    warpable: boolean;
    pinchable: boolean;
    originDraggable: boolean;
    clippable: boolean;
    roundable: boolean;
    snappable: boolean;
    keepRatio: boolean;
    renderDirections: string[];
    edge: boolean;
    throttleDrag: number;
    throttleResize: number;
    throttleScale: number;
    throttleRotate: number;
}

export default function Studio({ getData, setGetData, styles, setStyles }: {
    getData?: any,
    setGetData?: (data: any) => void,
    styles?: string[],
    setStyles?: (styles: string[]) => void
}) {
    // Canvas and elements state
    const [createdCanvas, setCreatedCanvas] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(800);
    const [canvasHeight, setCanvasHeight] = useState(600);
    const [elements, setElements] = useState<ElementData[]>([]);
    
    // Moveable target and settings
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Moveable settings state
    const [moveableSettings, setMoveableSettings] = useState<MoveableSettings>({
        draggable: true,
        resizable: true,
        scalable: true,
        rotatable: true,
        warpable: false,
        pinchable: true,
        originDraggable: true,
        clippable: false,
        roundable: false,
        snappable: true,
        keepRatio: false,
        renderDirections: ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
        edge: true,
        throttleDrag: 0,
        throttleResize: 0,
        throttleScale: 0,
        throttleRotate: 0,
    });

    // Viewport settings
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(false);

    // Multi-selection state
    const [selectedTargets, setSelectedTargets] = useState<HTMLElement[]>([]);
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    
    // Current styles for properties panel
    const [currentStyles, setCurrentStyles] = useState({
        width: '',
        height: '',
        transform: '',
        backgroundColor: '',
        color: '',
        borderRadius: '',
        fontSize: '',
        fontFamily: '',
        fontWeight: '',
        fontStyle: '',
        textAlign: '',
        lineHeight: '',
        letterSpacing: '',
        textDecoration: '',
        opacity: '1'
    });

    // Layer management
    const [nextZIndex, setNextZIndex] = useState(1);

    // Función para sincronizar elementos con otras partes de la aplicación
    const syncElements = useCallback(() => {
        if (!canvasRef.current) return;
        
        const canvasElement = canvasRef.current;
        const canvasElements = canvasElement.querySelectorAll('.moveable-element') as NodeListOf<HTMLElement>;
        const rect = canvasElement.getBoundingClientRect();
        
        const syncData = {
            elements: Array.from(canvasElements).map((htmlElement, index) => {
                const computedStyle = window.getComputedStyle(htmlElement);
                const elementRect = htmlElement.getBoundingClientRect();
                const canvasRect = canvasElement.getBoundingClientRect();
                
                const x = (elementRect.left - canvasRect.left) / zoom;
                const y = (elementRect.top - canvasRect.top) / zoom;
                const width = elementRect.width / zoom;
                const height = elementRect.height / zoom;
                
                const elementData = elements.find(el => el.element === htmlElement);
                const elementType = elementData?.type || 'div';
                const zIndex = parseInt(computedStyle.zIndex) || elementData?.zIndex || index;
                
                return {
                    id: elementData?.id || `element-${index}`,
                    type: elementType,
                    x,
                    y,
                    width,
                    height,
                    transform: htmlElement.style.transform || 'translate3d(0px, 0px, 0px) rotateZ(0deg) scale(1, 1)',
                    zIndex,
                    isVisible: elementData?.isVisible !== false,
                    isLocked: elementData?.isLocked || false,
                    name: elementData?.name || `Element ${index + 1}`,
                    ...(elementType === 'text' && {
                        content: htmlElement.textContent || htmlElement.innerText || '',
                        fontFamily: computedStyle.fontFamily,
                        fontSize: parseInt(computedStyle.fontSize),
                        fontWeight: computedStyle.fontWeight,
                        color: computedStyle.color,
                        textAlign: computedStyle.textAlign
                    }),
                    backgroundColor: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ? computedStyle.backgroundColor : undefined,
                    borderRadius: computedStyle.borderRadius !== '0px' ? computedStyle.borderRadius : undefined,
                    border: computedStyle.border !== 'none' ? computedStyle.border : undefined,
                    boxShadow: computedStyle.boxShadow !== 'none' ? computedStyle.boxShadow : undefined,
                    opacity: computedStyle.opacity !== '1' ? computedStyle.opacity : undefined
                };
            }),
            canvasSize: {
                width: Math.max(rect.width / zoom, 800),
                height: Math.max(rect.height / zoom, 600)
            },
            zoom: zoom,
            backgroundColor: 'transparent'
        };
        
        // Almacenar en localStorage para que RenderPage pueda accederlo
        localStorage.setItem('studioCanvasData', JSON.stringify(syncData));
        
        // Disparar evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('studioElementsChange', { 
            detail: syncData 
        }));
        
        console.log('📡 [STUDIO] Elements synced:', syncData.elements.length, 'elements');
    }, [elements, canvasWidth, canvasHeight, zoom]);

    // Enhanced save project function using new registry system
    const saveProjectToRegistry = useCallback(() => {
        try {
            const canvas = canvasRef.current;
            if (!canvas) {
                console.error('Canvas not found');
                return;
            }

            const canvasElements = canvas.querySelectorAll('.moveable-element') as NodeListOf<HTMLElement>;
            const savedElements: SavedElement[] = [];

            canvasElements.forEach((htmlElement) => {
                const elementData = elements.find(el => el.element === htmlElement);
                if (!elementData) return;

                const computedStyle = window.getComputedStyle(htmlElement);
                const elementRect = htmlElement.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                
                const x = (elementRect.left - canvasRect.left) / zoom;
                const y = (elementRect.top - canvasRect.top) / zoom;
                const width = elementRect.width / zoom;
                const height = elementRect.height / zoom;

                // Handle different element types
                if (htmlElement.hasAttribute('data-image-element')) {
                    // Image elements - save base64 data
                    const img = htmlElement.querySelector('img');
                    const savedElement: SavedElement = {
                        id: elementData.id,
                        name: 'Prism', // Default component for images
                        props: {
                            imageData: img?.src || '',
                            fileName: elementData.name.replace('Image: ', ''),
                            isImageElement: true
                        },
                        position: { x, y, width, height },
                        styles: {
                            cursor: 'move',
                            userSelect: 'none',
                            zIndex: elementData.zIndex
                        },
                        version: 1,
                        timestamp: Date.now()
                    };
                    savedElements.push(savedElement);
                    saveElement(savedElement);
                } else if (htmlElement.hasAttribute('data-react-component')) {
                    // React components
                    const componentName = htmlElement.getAttribute('data-react-component');
                    if (componentName) {
                        if (isComponentInRegistry(componentName)) {
                            const savedElement: SavedElement = {
                                id: elementData.id,
                                name: componentName as keyof typeof componentRegistry,
                                props: getDefaultProps(componentName), // Could be enhanced to get actual props
                                position: { x, y, width, height },
                                styles: {
                                    cursor: 'move',
                                    userSelect: 'none',
                                    overflow: 'hidden',
                                    zIndex: elementData.zIndex
                                },
                                version: 1,
                                timestamp: Date.now()
                            };
                            savedElements.push(savedElement);
                            saveElement(savedElement);
                            console.log('💾 React component saved to registry:', componentName);
                        } else {
                            console.warn('⚠️ React component not in registry, skipping:', componentName);
                        }
                    }
                } else {
                    // Regular HTML elements - save to BOTH localStorage AND registry
                    console.log('📝 Regular HTML element detected:', elementData.type);
                    
                    // First, create SavedElement for the registry system
                    const savedElement: SavedElement = {
                        id: elementData.id,
                        name: 'Prism', // Use Prism as generic component for basic elements
                        props: {
                            elementType: elementData.type,
                            content: htmlElement.textContent || '',
                            isBasicElement: true,
                            styles: {
                                backgroundColor: computedStyle.backgroundColor,
                                borderRadius: computedStyle.borderRadius,
                                color: computedStyle.color,
                                fontSize: computedStyle.fontSize,
                                fontFamily: computedStyle.fontFamily,
                                fontWeight: computedStyle.fontWeight,
                                textAlign: computedStyle.textAlign,
                                opacity: computedStyle.opacity,
                                transform: computedStyle.transform
                            }
                        },
                        position: { x, y, width, height },
                        styles: {
                            cursor: 'move',
                            userSelect: 'none',
                            zIndex: elementData.zIndex
                        },
                        version: 1,
                        timestamp: Date.now()
                    };
                    
                    // Save to registry system
                    savedElements.push(savedElement);
                    saveElement(savedElement);
                    
                    // Also save to localStorage for backward compatibility
                    const elementForLocalStorage = {
                        id: elementData.id,
                        type: elementData.type,
                        name: elementData.name,
                        x, y, width, height,
                        zIndex: elementData.zIndex,
                        isLocked: elementData.isLocked,
                        isVisible: elementData.isVisible,
                        content: htmlElement.textContent || '',
                        backgroundColor: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ? computedStyle.backgroundColor : undefined,
                        borderRadius: computedStyle.borderRadius !== '0px' ? computedStyle.borderRadius : undefined,
                        color: computedStyle.color,
                        fontSize: computedStyle.fontSize,
                        fontFamily: computedStyle.fontFamily,
                        fontWeight: computedStyle.fontWeight,
                        textAlign: computedStyle.textAlign,
                        opacity: computedStyle.opacity !== '1' ? computedStyle.opacity : undefined,
                        transform: computedStyle.transform
                    };
                    
                    // Get current localStorage data
                    const existingData = localStorage.getItem('studioCanvasData');
                    let localStorageProject = existingData ? JSON.parse(existingData) : { elements: [] };
                    
                    // Add or update element
                    const existingIndex = localStorageProject.elements.findIndex((el: any) => el.id === elementData.id);
                    if (existingIndex >= 0) {
                        localStorageProject.elements[existingIndex] = elementForLocalStorage;
                    } else {
                        localStorageProject.elements.push(elementForLocalStorage);
                    }
                    
                    // Update localStorage
                    localStorage.setItem('studioCanvasData', JSON.stringify({
                        ...localStorageProject,
                        canvasSize: { width: canvasWidth, height: canvasHeight },
                        zoom: zoom,
                        timestamp: Date.now()
                    }));
                    
                    console.log('💾 Basic element saved to BOTH registry and localStorage:', elementData.type, elementData.name);
                }
            });

            // Save complete project
            const project: SavedProject = {
                id: `project_${Date.now()}`,
                name: `Project ${new Date().toISOString().split('T')[0]}`,
                elements: savedElements,
                canvas: {
                    width: canvasWidth,
                    height: canvasHeight
                },
                version: 1,
                timestamp: Date.now()
            };

            saveProject(project);
            console.log('💾 Project saved to new registry system:', project.name, savedElements.length, 'elements');

        } catch (error) {
            console.error('❌ Error saving project to registry:', error);
        }
    }, [elements, canvasWidth, canvasHeight, zoom]);

    // Clear all saved data function
    const clearSavedData = useCallback(() => {
        try {
            clearAllSavedData();
            localStorage.removeItem('studioCanvasData');
            console.log('🧹 All saved data cleared');
            alert('All saved data has been cleared');
        } catch (error) {
            console.error('❌ Error clearing saved data:', error);
            alert('Error clearing saved data');
        }
    }, []);

    // Sincronizar elementos cuando cambien
    useEffect(() => {
        const syncTimer = setTimeout(() => {
            syncElements();
        }, 500);
        
        return () => clearTimeout(syncTimer);
    }, [elements, canvasWidth, canvasHeight, zoom]);

    useEffect(() => {
        // Event delegation for elements
        const canvas = canvasRef.current;
        if (canvas) {
            const handleCanvasClick = (e: Event) => {
                const target = e.target as HTMLElement;
                const isCtrlPressed = (e as MouseEvent).ctrlKey;
                
                // Find the closest moveable element (in case we clicked on a child)
                let moveableElement = target;
                while (moveableElement && moveableElement !== canvas) {
                    if (moveableElement.classList.contains('moveable-element') || moveableElement.classList.contains('target')) {
                        break;
                    }
                    moveableElement = moveableElement.parentElement as HTMLElement;
                }
                
                if (moveableElement && moveableElement !== canvas && (moveableElement.classList.contains('moveable-element') || moveableElement.classList.contains('target'))) {
                    const elementId = moveableElement.getAttribute('data-element-id') || moveableElement.id;
                    const element = elements.find(el => el.id === elementId);
                    
                    if (element && !element.isLocked) {
                        if (isCtrlPressed && isMultiSelect) {
                            // Multi-selection mode
                            if (selectedTargets.includes(moveableElement)) {
                                setSelectedTargets(prev => prev.filter(t => t !== moveableElement));
                                if (selectedTargets.length === 1) {
                                    setTarget(null);
                                    setSelectedElement(null);
                                }
                            } else {
                                setSelectedTargets(prev => [...prev, moveableElement]);
                                setTarget(moveableElement);
                            }
                        } else {
                            // Single selection
                            setTarget(moveableElement);
                            setSelectedTargets([moveableElement]);
                            setSelectedElement(element);
                            updateCurrentStyles(moveableElement);
                            setGetData?.(element);
                        }
                    }
                } else if (target === canvas) {
                    // Clicked on empty canvas
                    setTarget(null);
                    setSelectedTargets([]);
                    setSelectedElement(null);
                    setGetData?.(null);
                }
            };
            
            canvas.addEventListener('click', handleCanvasClick);
            
            return () => {
                canvas.removeEventListener('click', handleCanvasClick);
            };
        }
    }, [elements, isMultiSelect, selectedTargets, setGetData]);

    // Function to update element in registry when it's modified
    const updateElementInRegistry = useCallback((element: HTMLElement) => {
        const elementId = element.getAttribute('data-element-id') || element.id;
        const elementData = elements.find(el => el.id === elementId);
        
        if (!elementData) return;
        
        // Only update registry elements (React components and images)
        if (element.hasAttribute('data-react-component') || element.hasAttribute('data-image-element')) {
            const computedStyle = window.getComputedStyle(element);
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const elementRect = element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            const x = (elementRect.left - canvasRect.left) / zoom;
            const y = (elementRect.top - canvasRect.top) / zoom;
            const width = elementRect.width / zoom;
            const height = elementRect.height / zoom;
            
            // Parse transform for rotation and scale
            const transform = computedStyle.transform;
            let rotation = 0;
            let scale = 1;
            
            if (transform && transform !== 'none') {
                const matrix = transform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    if (values.length >= 6) {
                        rotation = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
                        scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
                    }
                }
            }
            
            if (element.hasAttribute('data-image-element')) {
                // Update image element
                const img = element.querySelector('img');
                const savedElement: SavedElement = {
                    id: elementData.id,
                    name: 'Prism',
                    props: {
                        imageData: img?.src || '',
                        fileName: elementData.name.replace('Image: ', ''),
                        isImageElement: true
                    },
                    position: { 
                        x, y, width, height, 
                        rotation: rotation !== 0 ? rotation : undefined,
                        scale: scale !== 1 ? scale : undefined
                    },
                    styles: {
                        cursor: 'move',
                        userSelect: 'none',
                        zIndex: elementData.zIndex
                    },
                    version: 1,
                    timestamp: Date.now()
                };
                saveElement(savedElement);
            } else if (element.hasAttribute('data-react-component')) {
                // Update React component
                const componentName = element.getAttribute('data-react-component');
                if (componentName && isComponentInRegistry(componentName)) {
                    const savedElement: SavedElement = {
                        id: elementData.id,
                        name: componentName as keyof typeof componentRegistry,
                        props: getDefaultProps(componentName),
                        position: { 
                            x, y, width, height,
                            rotation: rotation !== 0 ? rotation : undefined,
                            scale: scale !== 1 ? scale : undefined
                        },
                        styles: {
                            cursor: 'move',
                            userSelect: 'none',
                            overflow: 'hidden',
                            zIndex: elementData.zIndex
                        },
                        version: 1,
                        timestamp: Date.now()
                    };
                    saveElement(savedElement);
                }
            }
        }
    }, [elements, zoom]);

    const handleGetTargetStyles = (element: HTMLElement | SVGElement) => {
        if (element instanceof HTMLElement) {
            // Update registry when element is modified
            updateElementInRegistry(element);
            
            const computedStyles = window.getComputedStyle(element);
            setStyles?.([
                computedStyles.width, 
                computedStyles.height, 
                computedStyles.transform
            ]);
        }
    };

    // Update current styles for properties panel
    const updateCurrentStyles = (element: HTMLElement) => {
        // Update registry when styles change
        updateElementInRegistry(element);
        
        const computedStyles = window.getComputedStyle(element);
        setCurrentStyles({
            width: computedStyles.width,
            height: computedStyles.height,
            transform: computedStyles.transform,
            backgroundColor: computedStyles.backgroundColor,
            color: computedStyles.color,
            borderRadius: computedStyles.borderRadius,
            fontSize: computedStyles.fontSize,
            fontFamily: computedStyles.fontFamily,
            fontWeight: computedStyles.fontWeight,
            fontStyle: computedStyles.fontStyle,
            textAlign: computedStyles.textAlign,
            lineHeight: computedStyles.lineHeight,
            letterSpacing: computedStyles.letterSpacing,
            textDecoration: computedStyles.textDecoration,
            opacity: computedStyles.opacity
        });
    };

    const handleCreateCanvas = () => {
        setCreatedCanvas(true);
    };

    // Element creation functions
    const addElement = (elementType: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const id = `element_${Date.now()}`;
        const element = document.createElement('div');
        element.id = id;
        element.className = 'moveable-element target absolute';
        element.setAttribute('data-element-id', id);
        
        // Base styles
        let baseStyles = 'position: absolute; cursor: move; user-select: none; ';
        let elementName = '';
        
        switch (elementType) {
            case 'div':
                baseStyles += 'width: 100px; height: 100px; background: rgba(59, 130, 246, 0.3); display: flex; align-items: center; justify-content: center;';
                element.textContent = 'DIV';
                elementName = 'Div Container';
                break;
            case 'p': 
                element.textContent = 'Edit this paragraph text';
                element.contentEditable = 'true';
                elementName = 'Paragraph';
                break;
            case 'h1': 
                element.textContent = 'Edit this heading';
                element.contentEditable = 'true';
                elementName = 'Heading 1';
                break;
            case 'rectangle':
                baseStyles += 'width: 100px; height: 60px; background: #3b82f6; border-radius: 4px;';
                elementName = 'Rectangle';
                break;
            case 'circle':
                baseStyles += 'width: 80px; height: 80px; background: #ef4444; border-radius: 50%;';
                elementName = 'Circle';
                break;
            case 'text':
                baseStyles += 'width: 180px; height: 45px; background: transparent; border: 2px dashed #6b7280; display: flex; align-items: center; justify-content: center; font-family: "Inter", sans-serif; font-size: 16px; color: #374151; text-align: center;';
                element.textContent = 'Click to edit text';
                element.contentEditable = 'true';
                elementName = 'Text';
                break;
        }
        
        const currentZIndex = nextZIndex;
        baseStyles += `z-index: ${currentZIndex};`;
        element.style.cssText = baseStyles + `left: ${50 + Math.random() * 200}px; top: ${50 + Math.random() * 200}px;`;
        
        canvas.appendChild(element);

        const elementData: ElementData = {
            id,
            type: elementType as any,
            element,
            isLocked: false,
            isVisible: true,
            zIndex: currentZIndex,
            name: elementName
        };

        setElements(prev => [...prev, elementData]);
        setTarget(element);
        setSelectedElement(elementData);
        setSelectedTargets([element]);
        setNextZIndex(prev => prev + 1);
        updateCurrentStyles(element);
    };
    // Updated React component addition function with new registry system
    const addReactElement = async (Component: React.ComponentType<any>, componentName?: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get component configuration
        const config = getComponentConfig(componentName || 'Unknown');
        const finalComponentName = componentName || Component.displayName || Component.name || 'UnknownComponent';
        
        // Check if component exists in new registry
        if (!isComponentInRegistry(finalComponentName)) {
            console.warn(`⚠️ Component ${finalComponentName} not found in new registry, falling back to legacy system`);
            // Continue with legacy behavior for backward compatibility
        }
        
        const defaultSize = getDefaultSize(finalComponentName);
        const defaultProps = getDefaultProps(finalComponentName);
        const importPath = getComponentImportPath(finalComponentName);

        const id = `react_${Date.now()}`;
        const element = document.createElement('div');
        element.id = id;
        element.className = 'moveable-element target absolute';
        element.setAttribute('data-element-id', id);
        element.setAttribute('data-react-component', finalComponentName);
        element.setAttribute('componentName', finalComponentName);
        
        // Base styles with size from configuration
        let baseStyles = 'position: absolute; cursor: move; user-select: none; ';
        let elementName = config?.displayName || finalComponentName;
        
        baseStyles += `width: ${defaultSize.width}px; height: ${defaultSize.height}px; overflow: hidden;`;
        
        const currentZIndex = nextZIndex;
        baseStyles += `z-index: ${currentZIndex};`;
        
        const x = 50 + Math.random() * 200;
        const y = 50 + Math.random() * 200;
        element.style.cssText = baseStyles + `left: ${x}px; top: ${y}px;`;
        
        // Create a wrapper div for the React component
        const reactWrapper = document.createElement('div');
        reactWrapper.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
        element.appendChild(reactWrapper);
        
        // Create React root and render component with default props
        const root = ReactDOM.createRoot(reactWrapper);
        root.render(<Component {...defaultProps} />);
        
        canvas.appendChild(element);

        // Save to new registry system (only if component exists in registry)
        if (isComponentInRegistry(finalComponentName)) {
            const savedElement: SavedElement = {
                id: id,
                name: finalComponentName as keyof typeof componentRegistry,
                props: defaultProps,
                position: {
                    x: x,
                    y: y,
                    width: defaultSize.width,
                    height: defaultSize.height,
                },
                styles: {
                    cursor: 'move',
                    userSelect: 'none',
                    zIndex: currentZIndex,
                    overflow: 'hidden'
                },
                version: 1,
                timestamp: Date.now()
            };

            try {
                saveElement(savedElement);
                console.log(`💾 React component saved to new registry: ${elementName}`, savedElement);
            } catch (error) {
                console.error('❌ Error saving React component to registry:', error);
            }
        } else {
            console.log(`ℹ️ Component ${finalComponentName} not in registry, skipping registry save`);
        }

        // Register component in legacy system for backward compatibility
        try {
            ComponentRegistry.registerComponent({
                id: id,
                name: finalComponentName,
                importPath: importPath,
                element: element,
                props: defaultProps
            });
            
            console.log(`✅ [STUDIO] React component registered: ${elementName}`, { 
                id, 
                position: { x, y },
                size: defaultSize,
                props: defaultProps
            });
        } catch (error) {
            console.error('❌ [STUDIO] Error registering React component:', error);
        }

        const elementData: ElementData = {
            id,
            type: 'react-component',
            element,
            isLocked: false,
            isVisible: true,
            zIndex: currentZIndex,
            name: elementName
        };

        setElements(prev => [...prev, elementData]);
        setTarget(element);
        setSelectedElement(elementData);
        setSelectedTargets([element]);
        setNextZIndex(prev => prev + 1);
        updateCurrentStyles(element);
    };

    // Image element creation function with new registry system
    const addImageElement = useCallback((imageData: string, fileName: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const elementId = `image_element_${Date.now()}`;
        
        // Create image element
        const element = document.createElement('div');
        element.id = elementId;
        element.className = 'moveable-element target absolute';
        element.setAttribute('data-element-id', elementId);
        element.setAttribute('data-image-element', 'true');
        
        const img = document.createElement('img');
        img.src = imageData;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: contain; pointer-events: none;';
        element.appendChild(img);
        
        const currentZIndex = nextZIndex;
        const baseStyles = `position: absolute; cursor: move; user-select: none; width: 200px; height: 200px; z-index: ${currentZIndex}; left: ${50 + Math.random() * 200}px; top: ${50 + Math.random() * 200}px;`;
        element.style.cssText = baseStyles;
        
        canvas.appendChild(element);

        // Create saved element data for the new registry system
        const savedElement: SavedElement = {
            id: elementId,
            name: 'Prism', // Using a default component for images, could be extended
            props: {
                imageData: imageData,
                fileName: fileName,
                isImageElement: true
            },
            position: {
                x: 50 + Math.random() * 200,
                y: 50 + Math.random() * 200,
                width: 200,
                height: 200,
            },
            styles: {
                cursor: 'move',
                userSelect: 'none',
                zIndex: currentZIndex
            },
            version: 1,
            timestamp: Date.now()
        };

        // Save to localStorage using new system
        saveElement(savedElement);

        const elementData: ElementData = {
            id: elementId,
            type: 'div' as any,
            element,
            isLocked: false,
            isVisible: true,
            zIndex: currentZIndex,
            name: `Image: ${fileName}`
        };

        setElements(prev => [...prev, elementData]);
        setTarget(element);
        setSelectedElement(elementData);
        setSelectedTargets([element]);
        setNextZIndex(prev => prev + 1);
        updateCurrentStyles(element);
        
        console.log('🖼️ Image element added and saved to registry:', fileName);
    }, [nextZIndex, updateCurrentStyles]);
    
    // Multi-selection actions
    const deleteSelectedElements = () => {
        if (selectedTargets.length === 0) return;
        
        selectedTargets.forEach(target => target.remove());
        
        const elementIds = selectedTargets.map(target => target.getAttribute('data-element-id') || target.id);
        setElements(prev => prev.filter(el => !elementIds.includes(el.id)));
        
        setTarget(null);
        setSelectedElement(null);
        setSelectedTargets([]);
    };

    const duplicateSelectedElements = () => {
        if (selectedTargets.length === 0) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const newElements: ElementData[] = [];

        selectedTargets.forEach(originalTarget => {
            const originalElementId = originalTarget.getAttribute('data-element-id') || originalTarget.id;
            const originalElementData = elements.find(el => el.id === originalElementId);
            if (!originalElementData) return;

            const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const element = originalTarget.cloneNode(true) as HTMLElement;
            element.id = id;
            element.setAttribute('data-element-id', id);
            
            // Offset the position and update z-index
            const currentLeft = parseInt(element.style.left) || 0;
            const currentTop = parseInt(element.style.top) || 0;
            const newZIndex = nextZIndex + newElements.length;
            element.style.left = `${currentLeft + 20}px`;
            element.style.top = `${currentTop + 20}px`;
            element.style.zIndex = `${newZIndex}`;
            
            canvas.appendChild(element);

            const elementData: ElementData = {
                id,
                type: originalElementData.type,
                element,
                isLocked: false,
                isVisible: true,
                zIndex: newZIndex,
                name: `${originalElementData.name} Copy`
            };

            newElements.push(elementData);
        });

        setElements(prev => [...prev, ...newElements]);
        setNextZIndex(prev => prev + newElements.length);
    };

    // Layer management functions
    const changeElementLayer = (elementId: string, newZIndex: number) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        // Update DOM element
        element.element.style.zIndex = `${newZIndex}`;
        
        // Update state
        setElements(prev => prev.map(el => 
            el.id === elementId ? { ...el, zIndex: newZIndex } : el
        ));

        // Update nextZIndex if necessary (solo para valores positivos)
        if (newZIndex >= nextZIndex) {
            setNextZIndex(newZIndex + 1);
        }
    };

    const moveLayerUp = (elementId: string) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;
        changeElementLayer(elementId, element.zIndex + 1);
    };

    const moveLayerDown = (elementId: string) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;
        changeElementLayer(elementId, element.zIndex - 1);
    };

    // Element manipulation functions
    const duplicateElement = () => {
        if (!selectedElement) return;
        
        const originalElement = selectedElement.element;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const id = `element_${Date.now()}`;
        const element = originalElement.cloneNode(true) as HTMLElement;
        element.id = id;
        element.setAttribute('data-element-id', id);
        
        // Offset the position and update z-index
        const currentLeft = parseInt(element.style.left) || 0;
        const currentTop = parseInt(element.style.top) || 0;
        const newZIndex = nextZIndex;
        element.style.left = `${currentLeft + 20}px`;
        element.style.top = `${currentTop + 20}px`;
        element.style.zIndex = `${newZIndex}`;
        
        canvas.appendChild(element);

        const elementData: ElementData = {
            id,
            type: selectedElement.type,
            element,
            isLocked: false,
            isVisible: true,
            zIndex: newZIndex,
            name: `${selectedElement.name} Copy`
        };

        setElements(prev => [...prev, elementData]);
        setTarget(element);
        setSelectedElement(elementData);
        setSelectedTargets([element]);
        setNextZIndex(prev => prev + 1);
        updateCurrentStyles(element);
    };

    const deleteElement = () => {
        if (!selectedElement) return;
        
        selectedElement.element.remove();
        setElements(prev => prev.filter(el => el.id !== selectedElement.id));
        setTarget(null);
        setSelectedElement(null);
        setSelectedTargets([]);
    };

    const toggleElementLock = () => {
        if (!selectedElement) return;
        
        const updatedElement = { ...selectedElement, isLocked: !selectedElement.isLocked };
        setElements(prev => prev.map(el => el.id === selectedElement.id ? updatedElement : el));
        setSelectedElement(updatedElement);
        
        if (updatedElement.isLocked) {
            setTarget(null);
            setSelectedTargets([]);
        }
    };

    const toggleElementVisibility = () => {
        if (!selectedElement) return;
        
        const newVisibility = !selectedElement.isVisible;
        selectedElement.element.style.display = newVisibility ? 'block' : 'none';
        
        const updatedElement = { ...selectedElement, isVisible: newVisibility };
        setElements(prev => prev.map(el => el.id === selectedElement.id ? updatedElement : el));
        setSelectedElement(updatedElement);
    };

    // Toggle visibility for any element by ID (for layers panel)
    const toggleElementVisibilityById = (elementId: string) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;
        
        const newVisibility = !element.isVisible;
        element.element.style.display = newVisibility ? 'block' : 'none';
        
        const updatedElement = { ...element, isVisible: newVisibility };
        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        
        // Update selected element if it's the one being toggled
        if (selectedElement?.id === elementId) {
            setSelectedElement(updatedElement);
        }
    };

    // Deselect all elements
    const deselectAll = () => {
        setTarget(null);
        setSelectedTargets([]);
        setSelectedElement(null);
        setGetData?.(null);
        
        // Also clear any text selection or focus
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        window.getSelection()?.removeAllRanges();
    };

    const exportToPNG = async () => {
        try {
            console.log('🚀 Starting automated export system...');
            
            // Preparar canvas
            const canvasElement = canvasRef.current;
            if (!canvasElement) {
                throw new Error('Canvas not found');
            }

            // Temporarily deselect all elements for clean export
            const wasTarget = target;
            const wasSelectedTargets = [...selectedTargets];
            setTarget(null);
            setSelectedTargets([]);

            // Wait for render to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Paso 1: Extraer HTML literal del canvas
            console.log('📄 Step 1: Extracting HTML from canvas...');
            const { CanvasExtractor } = await import('../services/CanvasExtractor');
            const canvasExtractor = new CanvasExtractor('canvas');
            const snapshot = canvasExtractor.createSnapshot();
            
            console.log('✅ HTML extracted:', {
                htmlLength: snapshot.htmlContent.length,
                componentsCount: snapshot.reactComponents.length,
                stylesLength: snapshot.styles.length
            });

            // Paso 2: Generar componente React automáticamente
            console.log('⚛️ Step 2: Generating React component...');
            const { ComponentGenerator } = await import('../services/ComponentGenerator');
            await ComponentGenerator.saveComponent(snapshot);
            
            console.log('✅ Component generated at: render/ComponentRendered.tsx');

            // Paso 3: Capturar screenshot real del navegador Chrome
            console.log('📸 Step 3: Capturing screenshot with Chrome...');
            const screenshotResponse = await fetch('http://localhost:3001/api/capture-screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    componentPath: 'render/ComponentRendered.tsx',
                    canvasId: 'render-canvas',
                    viewport: {
                        width: Math.max(canvasElement.offsetWidth, 800),
                        height: Math.max(canvasElement.offsetHeight, 600)
                    }
                })
            });

            if (!screenshotResponse.ok) {
                const errorData = await screenshotResponse.json().catch(() => ({}));
                throw new Error(errorData.details || `Screenshot failed: ${screenshotResponse.status}`);
            }

            // Descargar la imagen capturada
            const blob = await screenshotResponse.blob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `loomly-canvas-automated-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('🎉 Automated export completed successfully!');
            console.log('📁 Component saved at: render/ComponentRendered.tsx');
            console.log('🖼️ Screenshot downloaded from real Chrome');

            // Restore selection state
            setTimeout(() => {
                if (wasTarget) {
                    setTarget(wasTarget);
                    setSelectedTargets(wasSelectedTargets);
                }
            }, 200);
            
        } catch (error) {
            console.error('❌ Error in automated export:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}\n\nAsegúrate de que el servidor backend esté corriendo en puerto 3001`);
        }
    };

    // Load data from localStorage function with new registry system
    const loadFromLocalStorage = useCallback(() => {
        try {
            // Try to load from new registry system first
            const savedElements = loadAllElements();
            
            if (savedElements.length > 0) {
                console.log('📂 Loading data from new registry system:', savedElements);
                
                // Clear current canvas
                const canvas = canvasRef.current;
                if (!canvas) {
                    console.error('Canvas not found');
                    return;
                }

                // Clear existing elements
                canvas.innerHTML = '';
                setElements([]);
                setTarget(null);
                setSelectedElement(null);
                setSelectedTargets([]);

                // Recreate elements using the new system
                const newElements: ElementData[] = [];
                let maxZIndex = 0;

                savedElements.forEach((savedElement) => {
                    // Check if this is an image element (special handling)
                    if (savedElement.props.isImageElement && savedElement.props.imageData) {
                        const element = document.createElement('div');
                        element.id = savedElement.id;
                        element.className = 'moveable-element target absolute';
                        element.setAttribute('data-element-id', savedElement.id);
                        element.setAttribute('data-image-element', 'true');
                        
                        // Recreate image
                        const img = document.createElement('img');
                        img.src = savedElement.props.imageData;
                        img.style.cssText = 'width: 100%; height: 100%; object-fit: contain; pointer-events: none;';
                        element.appendChild(img);
                        
                        // Apply saved position and styles
                        element.style.cssText = `
                            position: absolute;
                            left: ${savedElement.position.x}px;
                            top: ${savedElement.position.y}px;
                            width: ${savedElement.position.width}px;
                            height: ${savedElement.position.height}px;
                            cursor: move;
                            user-select: none;
                            z-index: ${savedElement.styles?.zIndex || 1};
                            ${savedElement.position.rotation ? `transform: rotate(${savedElement.position.rotation}deg);` : ''}
                            ${savedElement.position.scale ? `transform: ${savedElement.position.rotation ? `rotate(${savedElement.position.rotation}deg) ` : ''}scale(${savedElement.position.scale});` : ''}
                        `;
                        
                        canvas.appendChild(element);
                        
                        const elementData: ElementData = {
                            id: savedElement.id,
                            type: 'div' as any,
                            element,
                            isLocked: false,
                            isVisible: true,
                            zIndex: savedElement.styles?.zIndex || 1,
                            name: `Image: ${savedElement.props.fileName || 'Restored Image'}`
                        };
                        
                        newElements.push(elementData);
                        maxZIndex = Math.max(maxZIndex, elementData.zIndex);
                    } else if (savedElement.props.isBasicElement) {
                        // Basic HTML elements (rectangle, circle, text, etc.)
                        const element = document.createElement('div');
                        element.id = savedElement.id;
                        element.className = 'moveable-element target absolute';
                        element.setAttribute('data-element-id', savedElement.id);
                        
                        // Apply saved position
                        element.style.cssText = `
                            position: absolute;
                            left: ${savedElement.position.x}px;
                            top: ${savedElement.position.y}px;
                            width: ${savedElement.position.width}px;
                            height: ${savedElement.position.height}px;
                            cursor: move;
                            user-select: none;
                            z-index: ${savedElement.styles?.zIndex || 1};
                        `;
                        
                        // Apply element-specific styles and content
                        const elementType = savedElement.props.elementType;
                        const elementStyles = savedElement.props.styles || {};
                        
                        if (elementType === 'text' || elementType === 'p' || elementType === 'h1') {
                            element.textContent = savedElement.props.content || 'Text Element';
                            element.contentEditable = 'true';
                            
                            if (elementStyles.fontFamily) element.style.fontFamily = elementStyles.fontFamily;
                            if (elementStyles.fontSize) element.style.fontSize = elementStyles.fontSize;
                            if (elementStyles.fontWeight) element.style.fontWeight = elementStyles.fontWeight;
                            if (elementStyles.color) element.style.color = elementStyles.color;
                            if (elementStyles.textAlign) element.style.textAlign = elementStyles.textAlign;
                        } else if (elementType === 'rectangle') {
                            if (elementStyles.backgroundColor) element.style.backgroundColor = elementStyles.backgroundColor;
                            if (elementStyles.borderRadius) element.style.borderRadius = elementStyles.borderRadius;
                        } else if (elementType === 'circle') {
                            if (elementStyles.backgroundColor) element.style.backgroundColor = elementStyles.backgroundColor;
                            element.style.borderRadius = '50%';
                        }
                        
                        // Apply common styles
                        if (elementStyles.opacity && elementStyles.opacity !== '1') {
                            element.style.opacity = elementStyles.opacity;
                        }
                        
                        canvas.appendChild(element);
                        
                        const elementData: ElementData = {
                            id: savedElement.id,
                            type: elementType as any,
                            element,
                            isLocked: false,
                            isVisible: true,
                            zIndex: savedElement.styles?.zIndex || 1,
                            name: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} Element`
                        };
                        
                        newElements.push(elementData);
                        maxZIndex = Math.max(maxZIndex, elementData.zIndex);
                        
                        console.log('✅ Basic element recreated:', elementType, savedElement.id);
                    } else {
                        // For React components, use the RecreateProject system
                        // This will be handled by rendering the RecreateProject component
                        console.log('🔄 Found React component to recreate:', savedElement.name);
                    }
                });

                setElements(newElements);
                setNextZIndex(maxZIndex + 1);
                console.log(`✅ ${newElements.length} elements loaded from new registry system`);
                
                // If we have React components, we need to recreate them as moveable elements
                const reactComponents = savedElements.filter(el => !el.props.isImageElement && !el.props.isBasicElement);
                if (reactComponents.length > 0) {
                    console.log('🔄 Recreating React components as moveable elements:', reactComponents.length);
                    
                    for (const savedComponent of reactComponents) {
                        if (isComponentInRegistry(savedComponent.name)) {
                            const Component = componentRegistry[savedComponent.name];
                            
                            // Create moveable wrapper element
                            const element = document.createElement('div');
                            element.id = savedComponent.id;
                            element.className = 'moveable-element target absolute';
                            element.setAttribute('data-element-id', savedComponent.id);
                            element.setAttribute('data-react-component', savedComponent.name);
                            element.setAttribute('componentName', savedComponent.name);
                            
                            // Apply saved position and styles
                            element.style.cssText = `
                                position: absolute;
                                left: ${savedComponent.position.x}px;
                                top: ${savedComponent.position.y}px;
                                width: ${savedComponent.position.width}px;
                                height: ${savedComponent.position.height}px;
                                cursor: move;
                                user-select: none;
                                overflow: hidden;
                                z-index: ${savedComponent.styles?.zIndex || 1};
                                ${savedComponent.position.rotation ? `transform: rotate(${savedComponent.position.rotation}deg);` : ''}
                                ${savedComponent.position.scale ? `transform: ${savedComponent.position.rotation ? `rotate(${savedComponent.position.rotation}deg) ` : ''}scale(${savedComponent.position.scale});` : ''}
                            `;
                            
                            // Create React wrapper inside the moveable element
                            const reactWrapper = document.createElement('div');
                            reactWrapper.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
                            element.appendChild(reactWrapper);
                            
                            // Render React component
                            const root = ReactDOM.createRoot(reactWrapper);
                            root.render(<Component {...savedComponent.props} />);
                            
                            canvas.appendChild(element);
                            
                            // Register in legacy system for backward compatibility
                            try {
                                ComponentRegistry.registerComponent({
                                    id: savedComponent.id,
                                    name: savedComponent.name,
                                    importPath: `@/components/${savedComponent.name}`,
                                    element: element,
                                    props: savedComponent.props
                                });
                            } catch (error) {
                                console.error('❌ Error registering recreated component:', error);
                            }
                            
                            // Add to elements array so it appears in layers and is selectable
                            const elementData: ElementData = {
                                id: savedComponent.id,
                                type: 'react-component',
                                element,
                                isLocked: false,
                                isVisible: true,
                                zIndex: savedComponent.styles?.zIndex || 1,
                                name: savedComponent.name
                            };
                            
                            newElements.push(elementData);
                            maxZIndex = Math.max(maxZIndex, elementData.zIndex);
                            
                            console.log('✅ React component recreated as moveable element:', savedComponent.name);
                        } else {
                            console.warn('⚠️ Component not found in registry:', savedComponent.name);
                        }
                    }
                }
                
            } else {
                // Fallback to old localStorage system
                console.log('📂 No new registry data found, trying legacy localStorage...');
                
                const savedData = localStorage.getItem('studioCanvasData');
                if (!savedData) {
                    alert('No saved data found in localStorage');
                    return;
                }

                const data = JSON.parse(savedData);
                console.log('📂 Loading data from legacy localStorage:', data);

                // Clear current canvas
                const canvas = canvasRef.current;
                if (!canvas) {
                    console.error('Canvas not found');
                    return;
                }

                // Clear existing elements
                canvas.innerHTML = '';
                setElements([]);
                setTarget(null);
                setSelectedElement(null);
                setSelectedTargets([]);

                // Restore canvas settings
                if (data.canvasSize) {
                    setCanvasWidth(data.canvasSize.width);
                    setCanvasHeight(data.canvasSize.height);
                }
                if (data.zoom) {
                    setZoom(data.zoom);
                }

                // Legacy element recreation (keeping existing code)
                if (data.elements && Array.isArray(data.elements)) {
                    const newElements: ElementData[] = [];
                    let maxZIndex = 0;

                    data.elements.forEach((elementData: any, index: number) => {
                        const element = document.createElement('div');
                        element.id = elementData.id || `element_${Date.now()}_${index}`;
                        element.className = 'moveable-element target absolute';
                        element.setAttribute('data-element-id', element.id);

                        // Apply position and transform
                        element.style.position = 'absolute';
                        element.style.cursor = 'move';
                        element.style.userSelect = 'none';
                        element.style.left = `${elementData.x || 0}px`;
                        element.style.top = `${elementData.y || 0}px`;
                        element.style.width = `${elementData.width || 100}px`;
                        element.style.height = `${elementData.height || 100}px`;
                        element.style.transform = elementData.transform || '';
                        element.style.zIndex = elementData.zIndex?.toString() || '1';

                        // Apply styles
                        if (elementData.backgroundColor) element.style.backgroundColor = elementData.backgroundColor;
                        if (elementData.borderRadius) element.style.borderRadius = elementData.borderRadius;
                        if (elementData.border) element.style.border = elementData.border;
                        if (elementData.boxShadow) element.style.boxShadow = elementData.boxShadow;
                        if (elementData.opacity) element.style.opacity = elementData.opacity;

                        // Set content based on type
                        if (elementData.type === 'text' || elementData.type === 'p' || elementData.type === 'h1') {
                            element.textContent = elementData.content || 'Text Element';
                            element.contentEditable = 'true';
                            
                            if (elementData.fontFamily) element.style.fontFamily = elementData.fontFamily;
                            if (elementData.fontSize) element.style.fontSize = `${elementData.fontSize}px`;
                            if (elementData.fontWeight) element.style.fontWeight = elementData.fontWeight;
                            if (elementData.color) element.style.color = elementData.color;
                            if (elementData.textAlign) element.style.textAlign = elementData.textAlign;
                        } else if (elementData.type === 'rectangle') {
                            element.style.backgroundColor = elementData.backgroundColor || '#3b82f6';
                            element.style.borderRadius = elementData.borderRadius || '4px';
                        } else if (elementData.type === 'circle') {
                            element.style.backgroundColor = elementData.backgroundColor || '#ef4444';
                            element.style.borderRadius = '50%';
                        } else if (elementData.type === 'div') {
                            if (elementData.name && elementData.name.startsWith('Image:')) {
                                const img = document.createElement('img');
                                img.style.cssText = 'width: 100%; height: 100%; object-fit: contain; pointer-events: none;';
                                img.alt = 'Restored Image';
                                element.appendChild(img);
                            } else {
                                element.textContent = 'DIV';
                                element.style.backgroundColor = elementData.backgroundColor || 'rgba(59, 130, 246, 0.3)';
                                element.style.display = 'flex';
                                element.style.alignItems = 'center';
                                element.style.justifyContent = 'center';
                            }
                        }

                        canvas.appendChild(element);

                        const elementInfo: ElementData = {
                            id: element.id,
                            type: elementData.type || 'div',
                            element: element,
                            isLocked: elementData.isLocked || false,
                            isVisible: elementData.isVisible !== false,
                            zIndex: elementData.zIndex || (index + 1),
                            name: elementData.name || `Element ${index + 1}`
                        };

                        newElements.push(elementInfo);
                        maxZIndex = Math.max(maxZIndex, elementInfo.zIndex);
                    });

                    setElements(newElements);
                    setNextZIndex(maxZIndex + 1);
                    console.log(`✅ ${newElements.length} elements loaded from legacy localStorage`);
                }
            }

            console.log('🎉 Data loaded successfully from localStorage');
            
        } catch (error) {
            console.error('❌ Error loading data from localStorage:', error);
            alert('Error loading saved data');
        }
    }, []);

    // Helper function to render individual elements to canvas (simulating headless Chrome behavior)
    // Moveable setting toggles
    const updateMoveableSetting = <K extends keyof MoveableSettings>(
        key: K, 
        value: MoveableSettings[K]
    ) => {
        setMoveableSettings(prev => ({ ...prev, [key]: value }));
    };

    // Zoom controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.1));
    };

    const resetZoom = () => {
        setZoom(1);
    };

    return (
        <section ref={containerRef} className='w-full h-screen bg-gray-50 overflow-hidden'>
            {!createdCanvas ? (
                <CanvasDialog
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    onCanvasWidthChange={setCanvasWidth}
                    onCanvasHeightChange={setCanvasHeight}
                    onCreateCanvas={handleCreateCanvas}
                />
            ) : (
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Elements Panel */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
                            <ElementsPanel
                                onAddElement={addElement}
                                elements={elements}
                                selectedElement={selectedElement}
                                onMoveLayerUp={moveLayerUp}
                                onMoveLayerDown={moveLayerDown}
                                addReactElement={addReactElement}
                                onToggleVisibility={toggleElementVisibilityById}
                                onImageAdd={addImageElement}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Main Canvas Area */}
                    <ResizablePanel defaultSize={60} minSize={40}>
                        <div className="h-full flex flex-col">
                            <Toolbar
                                zoom={zoom}
                                onZoomIn={handleZoomIn}
                                onZoomOut={handleZoomOut}
                                onResetZoom={resetZoom}
                                onDuplicate={selectedTargets.length > 1 ? duplicateSelectedElements : duplicateElement}
                                onDelete={selectedTargets.length > 1 ? deleteSelectedElements : deleteElement}
                                onDeselect={deselectAll}
                                onExportJPG={exportToPNG}
                                onToggleLock={toggleElementLock}
                                onToggleVisibility={toggleElementVisibility}
                                moveableSettings={moveableSettings}
                                onUpdateMoveableSetting={updateMoveableSetting}
                                showGrid={showGrid}
                                onToggleGrid={setShowGrid}
                                isMultiSelect={isMultiSelect}
                                onToggleMultiSelect={setIsMultiSelect}
                                selectedElement={selectedElement}
                                hasSelection={!!selectedElement || selectedTargets.length > 0}
                                selectedTargets={selectedTargets}
                                onLoadData={loadFromLocalStorage}
                                onSaveProject={saveProjectToRegistry}
                                onClearData={clearSavedData}
                            />

                            <Canvas
                                ref={canvasRef}
                                canvasWidth={canvasWidth}
                                canvasHeight={canvasHeight}
                                zoom={zoom}
                                showGrid={showGrid}
                                target={target}
                                selectedTargets={selectedTargets}
                                isMultiSelect={isMultiSelect}
                                moveableSettings={moveableSettings}
                                elements={elements}
                                onTargetStylesChange={handleGetTargetStyles}
                                onCurrentStylesUpdate={updateCurrentStyles}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Properties Panel */}
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
                            <Properties
                                selectedElement={selectedElement}
                                currentStyles={currentStyles}
                                onChangeElementLayer={changeElementLayer}
                                onMoveLayerUp={moveLayerUp}
                                onMoveLayerDown={moveLayerDown}
                                onUpdateCurrentStyles={updateCurrentStyles}
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            )}
        </section>
    )
}

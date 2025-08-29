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

// Services import
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

    const handleGetTargetStyles = (element: HTMLElement | SVGElement) => {
        if (element) {
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
    const addReactElement = async (Component: React.ComponentType<any>, componentName?: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Obtener configuración del componente
        const config = getComponentConfig(componentName || 'Unknown');
        const finalComponentName = componentName || Component.displayName || Component.name || 'UnknownComponent';
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
        
        // Base styles con tamaño desde la configuración
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

        // Registrar el componente en el sistema
        try {
            ComponentRegistry.registerComponent({
                id: id,
                name: finalComponentName,
                importPath: importPath,
                element: element,
                props: defaultProps
            });
            
            console.log(`✅ [STUDIO] Componente React registrado: ${elementName}`, { 
                id, 
                position: { x, y },
                size: defaultSize,
                props: defaultProps
            });
        } catch (error) {
            console.error('❌ [STUDIO] Error registrando componente React:', error);
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
            console.log('🚀 Iniciando sistema automatizado de exportación...');
            
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
            console.log('📄 Paso 1: Extrayendo HTML del canvas...');
            const { CanvasExtractor } = await import('../services/CanvasExtractor');
            const canvasExtractor = new CanvasExtractor('canvas');
            const snapshot = canvasExtractor.createSnapshot();
            
            console.log('✅ HTML extraído:', {
                htmlLength: snapshot.htmlContent.length,
                componentsCount: snapshot.reactComponents.length,
                stylesLength: snapshot.styles.length
            });

            // Paso 2: Generar componente React automáticamente
            console.log('⚛️ Paso 2: Generando componente React...');
            const { ComponentGenerator } = await import('../services/ComponentGenerator');
            await ComponentGenerator.saveComponent(snapshot);
            
            console.log('✅ Componente generado en: render/ComponentRendered.tsx');

            // Paso 3: Capturar screenshot real del navegador Chrome
            console.log('📸 Paso 3: Capturando screenshot con Chrome...');
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
            
            console.log('🎉 Exportación automatizada completada exitosamente!');
            console.log('📁 Componente guardado en: render/ComponentRendered.tsx');
            console.log('🖼️ Screenshot descargado desde Chrome real');

            // Restore selection state
            setTimeout(() => {
                if (wasTarget) {
                    setTarget(wasTarget);
                    setSelectedTargets(wasSelectedTargets);
                }
            }, 200);
            
        } catch (error) {
            console.error('❌ Error en exportación automatizada:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}\n\nAsegúrate de que el servidor backend esté corriendo en puerto 3001`);
        }
    };

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

import { ComponentRegistry, registerPrismComponent, registerCustomComponent } from '../services/ComponentRegistry';

/**
 * Utilidades para agregar componentes React al canvas
 */
export class CanvasComponentUtils {
    
    /**
     * Agregar componente Prism al canvas
     */
    static addPrismToCanvas(canvasRef: React.RefObject<HTMLElement>, props: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        className?: string;
    } = {}) {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('Canvas no encontrado');
            return null;
        }
        
        // Crear elemento div que representará el componente Prism
        const prismElement = document.createElement('div');
        prismElement.className = `moveable-element prism-background ${props.className || ''}`;
        prismElement.style.position = 'absolute';
        prismElement.style.left = `${props.x || 100}px`;
        prismElement.style.top = `${props.y || 100}px`;
        prismElement.style.width = `${props.width || 200}px`;
        prismElement.style.height = `${props.height || 200}px`;
        prismElement.style.border = '1px solid #3b82f6';
        prismElement.style.borderRadius = '4px';
        prismElement.style.overflow = 'hidden';
        
        // Agregar contenido visual temporal (será reemplazado por el componente real)
        prismElement.innerHTML = `
            <div style="width: 100%; height: 100%; position: relative; pointer-events: none;">
                <div style="
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff);
                    opacity: 0.3;
                    animation: prism-animation 3s ease-in-out infinite alternate;
                "></div>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #333;
                    font-size: 12px;
                    font-weight: bold;
                    pointer-events: none;
                    text-align: center;
                ">Prism Background</div>
            </div>
            <style>
                @keyframes prism-animation {
                    0% { background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff); }
                    100% { background: linear-gradient(45deg, #3a86ff, #ff006e, #8338ec); }
                }
            </style>
        `;
        
        // Agregar al canvas
        canvas.appendChild(prismElement);
        
        // Registrar el componente
        const componentId = registerPrismComponent(prismElement);
        
        console.log(`✅ Prism agregado al canvas con ID: ${componentId}`);
        
        return {
            id: componentId,
            element: prismElement,
            remove: () => {
                ComponentRegistry.removeComponent(componentId);
                prismElement.remove();
            }
        };
    }
    
    /**
     * Agregar componente personalizado al canvas
     */
    static addCustomComponentToCanvas(
        canvasRef: React.RefObject<HTMLElement>,
        componentData: {
            name: string;
            importPath: string;
            props?: Record<string, any>;
            style: {
                x: number;
                y: number;
                width: number;
                height: number;
                className?: string;
            };
            content?: string;
        }
    ) {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('Canvas no encontrado');
            return null;
        }
        
        // Crear elemento que representará el componente
        const element = document.createElement('div');
        element.className = `moveable-element ${componentData.style.className || ''}`;
        element.style.position = 'absolute';
        element.style.left = `${componentData.style.x}px`;
        element.style.top = `${componentData.style.y}px`;
        element.style.width = `${componentData.style.width}px`;
        element.style.height = `${componentData.style.height}px`;
        element.style.border = '1px solid #6b7280';
        element.style.borderRadius = '4px';
        
        // Agregar contenido si se proporciona
        if (componentData.content) {
            element.innerHTML = componentData.content;
        } else {
            element.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                    padding: 8px;
                ">${componentData.name}</div>
            `;
        }
        
        // Agregar al canvas
        canvas.appendChild(element);
        
        // Registrar el componente
        const componentId = registerCustomComponent(
            element,
            componentData.name,
            componentData.importPath,
            componentData.props
        );
        
        console.log(`✅ ${componentData.name} agregado al canvas con ID: ${componentId}`);
        
        return {
            id: componentId,
            element,
            remove: () => {
                ComponentRegistry.removeComponent(componentId);
                element.remove();
            }
        };
    }
    
    /**
     * Obtener todos los componentes en el canvas
     */
    static getCanvasComponents() {
        return ComponentRegistry.getAllComponents();
    }
    
    /**
     * Actualizar posiciones de todos los componentes registrados
     */
    static updateAllComponentPositions() {
        const components = ComponentRegistry.getAllComponents();
        components.forEach(comp => {
            ComponentRegistry.updateComponentPosition(comp.id);
        });
        console.log(`📍 Positions updated for ${components.length} components`);
    }
    
    /**
     * Limpiar todos los componentes del canvas
     */
    static clearCanvas(canvasRef: React.RefObject<HTMLElement>) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const components = ComponentRegistry.getAllComponents();
        components.forEach(comp => {
            comp.element.remove();
        });
        
        ComponentRegistry.clearAll();
        console.log('🧹 Canvas limpiado');
    }
}

export default CanvasComponentUtils;
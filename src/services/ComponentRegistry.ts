interface ComponentData {
    id: string;
    name: string;
    importPath: string;
    element: HTMLElement;
    props: Record<string, any>;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
        transform?: string;
        zIndex?: number;
    };
}

/**
 * Servicio para registrar y gestionar componentes React en el canvas
 */
export class ComponentRegistry {
    private static components: Map<string, ComponentData> = new Map();
    
    /**
     * Registrar un nuevo componente React en el canvas
     */
    static registerComponent(data: {
        id: string;
        name: string;
        importPath: string;
        element: HTMLElement;
        props?: Record<string, any>;
    }): void {
        const rect = data.element.getBoundingClientRect();
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas?.getBoundingClientRect();
        
        if (!canvasRect) {
            console.warn('Canvas not found, cannot register component position');
            return;
        }
        
        const position = {
            x: rect.left - canvasRect.left,
            y: rect.top - canvasRect.top,
            width: rect.width,
            height: rect.height,
            transform: data.element.style.transform || undefined,
            zIndex: data.element.style.zIndex ? parseInt(data.element.style.zIndex) : undefined
        };
        
        const componentData: ComponentData = {
            id: data.id,
            name: data.name,
            importPath: data.importPath,
            element: data.element,
            props: data.props || {},
            position
        };
        
        this.components.set(data.id, componentData);
        
        // Marcar el elemento en el DOM
        data.element.setAttribute('data-react-component', data.name);
        data.element.setAttribute('data-component-id', data.id);
        
        console.log(`✅ Component registered: ${data.name} (${data.id})`, componentData);
    }
    
    /**
     * Actualizar la posición de un componente existente
     */
    static updateComponentPosition(id: string): void {
        const componentData = this.components.get(id);
        if (!componentData) return;
        
        const rect = componentData.element.getBoundingClientRect();
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas?.getBoundingClientRect();
        
        if (canvasRect) {
            componentData.position = {
                x: rect.left - canvasRect.left,
                y: rect.top - canvasRect.top,
                width: rect.width,
                height: rect.height,
                transform: componentData.element.style.transform || undefined,
                zIndex: componentData.element.style.zIndex ? parseInt(componentData.element.style.zIndex) : undefined
            };
            
            console.log(`📍 Posición actualizada: ${componentData.name} (${id})`);
        }
    }
    
    /**
     * Obtener todos los componentes registrados
     */
    static getAllComponents(): ComponentData[] {
        return Array.from(this.components.values());
    }
    
    /**
     * Obtener un componente por ID
     */
    static getComponent(id: string): ComponentData | undefined {
        return this.components.get(id);
    }
    
    /**
     * Eliminar un componente del registro
     */
    static removeComponent(id: string): void {
        const componentData = this.components.get(id);
        if (componentData) {
            componentData.element.removeAttribute('data-react-component');
            componentData.element.removeAttribute('data-component-id');
            this.components.delete(id);
            console.log(`🗑️ Component removed: ${componentData.name} (${id})`);
        }
    }
    
    /**
     * Limpiar todos los componentes registrados
     */
    static clearAll(): void {
        this.components.forEach((data) => {
            data.element.removeAttribute('data-react-component');
            data.element.removeAttribute('data-component-id');
        });
        this.components.clear();
        console.log('🧹 All components removed from registry');
    }
    
    /**
     * Generar datos para el snapshot del canvas
     */
    static generateSnapshotData() {
        return this.getAllComponents().map(comp => ({
            id: comp.id,
            name: comp.name,
            type: 'react-component',
            props: {
                ...comp.props,
                style: {
                    position: 'absolute',
                    left: `${comp.position.x}px`,
                    top: `${comp.position.y}px`,
                    width: `${comp.position.width}px`,
                    height: `${comp.position.height}px`,
                    transform: comp.position.transform,
                    zIndex: comp.position.zIndex
                }
            },
            route: '/render',
            importPath: comp.importPath
        }));
    }
}

// Función auxiliar para registrar componentes comunes
export const registerPrismComponent = (element: HTMLElement, id?: string) => {
    const componentId = id || `prism-${Date.now()}`;
    ComponentRegistry.registerComponent({
        id: componentId,
        name: 'Prism',
        importPath: '@/components/Backgrounds/Prism/Prism',
        element,
        props: {} // Aquí puedes agregar props específicos del Prism
    });
    return componentId;
};

export const registerCustomComponent = (
    element: HTMLElement, 
    name: string, 
    importPath: string, 
    props: Record<string, any> = {},
    id?: string
) => {
    const componentId = id || `${name.toLowerCase()}-${Date.now()}`;
    ComponentRegistry.registerComponent({
        id: componentId,
        name,
        importPath,
        element,
        props
    });
    return componentId;
};

export default ComponentRegistry;
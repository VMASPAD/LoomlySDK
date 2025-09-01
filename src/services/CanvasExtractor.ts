import { ComponentRegistry } from './ComponentRegistry';
import { REACT_COMPONENTS_CONFIG } from '../config/ComponentsConfig';

interface ReactComponentInfo {
    id: string;
    name: string;
    type: string;
    props: Record<string, any>;
    route: string;
}

interface CanvasSnapshot {
    htmlContent: string;
    reactComponents: ReactComponentInfo[];
    styles: string;
    canvasSize: {
        width: number;
        height: number;
    };
    zoom: number;
}

export class CanvasExtractor {
    private canvasElement: HTMLElement | null = null;
    
    constructor(canvasId: string = 'canvas') {
        this.canvasElement = document.getElementById(canvasId);
    }
    
    /**
     * Extrae todo el contenido HTML literal del canvas
     */
    extractHTML(): string {
        if (!this.canvasElement) {
            throw new Error('Canvas element not found');
        }
        
        // Clonar el elemento para no afectar el original
        const clone = this.canvasElement.cloneNode(true) as HTMLElement;
        
        // Remover elementos de Moveable y controles para limpiar el HTML
        const elementsToRemove = [
            '.moveable-control-box', 
            '.moveable-line', 
            '.moveable-control',
            '.moveable-direction',
            '.moveable-rotation',
            '[data-moveable="true"]',
            '.canvas-boundary',
            '.canvas-ruler',
            '.canvas-grid'
        ];
        
        elementsToRemove.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
        // Limpiar atributos de moveable de los elementos
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            const element = el as HTMLElement;
            // Remover atributos relacionados con moveable
            element.removeAttribute('data-moveable');
            element.removeAttribute('data-target');
            
            // Limpiar clases relacionadas con moveable
            const classes = Array.from(element.classList);
            classes.forEach(className => {
                if (className.startsWith('moveable-') || className === 'target') {
                    element.classList.remove(className);
                }
            });
        });
        
        return clone.innerHTML;
    }
    
    /**
     * Extrae información de componentes React
     */
    extractReactComponents(): ReactComponentInfo[] {
        if (!this.canvasElement) return [];
        
        // Usar el registro de componentes primero
        const registeredComponents = ComponentRegistry.generateSnapshotData();
        
        if (registeredComponents.length > 0) {
            console.log('🎯 Using registered components:', registeredComponents);
            return registeredComponents.map(comp => ({
                id: comp.id,
                name: comp.name,
                type: comp.type,
                props: comp.props,
                route: comp.route
            }));
        }
        
        // Fallback: detección automática
        console.log('🔍 No registered components, auto-detecting...');
        const components: ReactComponentInfo[] = [];
        const canvasElement = this.canvasElement;

        // Detectar por atributos data-react-component o componentName
        const componentElements = canvasElement.querySelectorAll('[data-react-component], [componentName]');
        componentElements.forEach((element, index) => {
            const el = element as HTMLElement;
            // Priorizar el atributo componentName si existe
            const componentName = el.getAttribute('componentName') || el.dataset.reactComponent || 'UnknownComponent';
            const componentId = el.dataset.componentId || el.id || `component-${index}`;
            
            console.log(`🔍 Detected component: ${componentName} (ID: ${componentId})`);
            
            components.push({
                id: componentId,
                name: componentName,
                type: 'react-component',
                props: this.extractPropsFromElement(el),
                route: `/render`
            });
        });

        // Detectar componentes conocidos por clases CSS (usando configuración centralizada)
        const knownComponentSelectors: Record<string, string> = {};
        
        // Generar selectores desde la configuración
        Object.entries(REACT_COMPONENTS_CONFIG).forEach(([name, _config]) => {
            // Crear selectores CSS basados en el nombre del componente
            const selector = name.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1);
            knownComponentSelectors[selector] = name;
            knownComponentSelectors[`${selector}-background`] = name;
            knownComponentSelectors[`${selector}-component`] = name;
        });

        Object.entries(knownComponentSelectors).forEach(([selector, componentName]) => {
            const elements = canvasElement.querySelectorAll(`.${selector}`);
            elements.forEach((element, index) => {
                const el = element as HTMLElement;
                const componentId = el.id || `${selector}-${index}`;
                
                if (!components.find(comp => comp.id === componentId)) {
                    components.push({
                        id: componentId,
                        name: componentName,
                        type: 'react-component',
                        props: this.extractPropsFromElement(el),
                        route: `/render`
                    });
                }
            });
        });

        console.log('🔍 React components auto-detected:', components);
        return components;
    }

    /**
     * Extrae props de un elemento HTML
     */
    private extractPropsFromElement(element: HTMLElement): Record<string, any> {
        const props: Record<string, any> = {};
        
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-prop-')) {
                const propName = attr.name.replace('data-prop-', '');
                try {
                    props[propName] = JSON.parse(attr.value);
                } catch {
                    props[propName] = attr.value;
                }
            }
        });

        // Extraer texto si existe
        if (element.textContent && element.textContent.trim()) {
            props.children = element.textContent.trim();
        }

        // Extraer posición y estilos del elemento
        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const canvasRect = this.canvasElement!.getBoundingClientRect();
        
        // Calcular posición relativa al canvas
        const style = {
            position: 'absolute',
            left: `${rect.left - canvasRect.left}px`,
            top: `${rect.top - canvasRect.top}px`,
            width: element.style.width || `${rect.width}px`,
            height: element.style.height || `${rect.height}px`,
            transform: element.style.transform || 'none',
            zIndex: computedStyle.zIndex !== 'auto' ? computedStyle.zIndex : undefined
        };

        props.style = style;

        return props;
    }
    
    /**
     * Extrae todos los estilos CSS aplicados
     */
    extractStyles(): string {
        if (!this.canvasElement) return '';
        
        let styles = '';
        const elements = this.canvasElement.querySelectorAll('*');
        
        elements.forEach((element) => {
            const el = element as HTMLElement;
            const computedStyle = window.getComputedStyle(el);
            const id = el.id;
            const classes = Array.from(el.classList).join('.');
            
            if (id) {
                styles += `#${id} {\n`;
            } else if (classes) {
                styles += `.${classes} {\n`;
            } else {
                return; // Skip elementos sin identificadores
            }
            
            // Propiedades importantes para el renderizado
            const importantProps = [
                'position', 'top', 'left', 'width', 'height', 'transform',
                'background-color', 'color', 'font-family', 'font-size',
                'font-weight', 'text-align', 'border', 'border-radius',
                'box-shadow', 'opacity', 'z-index', 'display', 'flex-direction',
                'align-items', 'justify-content'
            ];
            
            importantProps.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== 'initial' && value !== 'normal') {
                    styles += `  ${prop}: ${value};\n`;
                }
            });
            
            styles += '}\n\n';
        });
        
        return styles;
    }
    
    /**
     * Crear snapshot completo del canvas
     */
    createSnapshot(): CanvasSnapshot {
        if (!this.canvasElement) {
            throw new Error('Canvas element not found');
        }
        
        const rect = this.canvasElement.getBoundingClientRect();
        const style = window.getComputedStyle(this.canvasElement);
        const transform = style.transform;
        
        // Extraer zoom del transform
        let zoom = 1;
        if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                const values = matrix[1].split(',');
                zoom = parseFloat(values[0]) || 1;
            }
        }
        
        return {
            htmlContent: this.extractHTML(),
            reactComponents: this.extractReactComponents(),
            styles: this.extractStyles(),
            canvasSize: {
                width: Math.floor(rect.width / zoom),
                height: Math.floor(rect.height / zoom)
            },
            zoom
        };
    }
}

export default CanvasExtractor;
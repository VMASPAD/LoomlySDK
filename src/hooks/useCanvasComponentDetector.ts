import { useEffect, useState } from 'react';
import { getComponentImportPath, REACT_COMPONENTS_CONFIG } from '../config/ComponentsConfig';

interface ReactComponentInfo {
    id: string;
    name: string;
    importPath: string;
    props: Record<string, any>;
}

/**
 * Hook para detectar componentes React en el canvas
 */
export const useCanvasComponentDetector = (canvasRef: React.RefObject<HTMLElement>) => {
    const [detectedComponents, setDetectedComponents] = useState<ReactComponentInfo[]>([]);

    const detectComponents = () => {
        if (!canvasRef.current) return [];

        const components: ReactComponentInfo[] = [];
        const canvasElement = canvasRef.current;

        // Detectar componentes Prism
        const prismElements = canvasElement.querySelectorAll('.prism-background, [class*="prism"], [data-component="prism"]');
        prismElements.forEach((element, index) => {
            const el = element as HTMLElement;
            components.push({
                id: el.id || `prism-${index}`,
                name: 'Prism',
                importPath: '@/components/Backgrounds/Prism/Prism',
                props: extractPropsFromElement(el)
            });
        });

        // Detectar otros componentes por data attributes
        const componentElements = canvasElement.querySelectorAll('[data-react-component], [componentName]');
        componentElements.forEach((element, index) => {
            const el = element as HTMLElement;
            const componentName = el.getAttribute('componentName') || el.dataset.reactComponent || 'UnknownComponent';
            
            if (!components.find(comp => comp.id === el.id)) {
                components.push({
                    id: el.id || `component-${index}`,
                    name: componentName,
                    importPath: getComponentImportPath(componentName),
                    props: extractPropsFromElement(el)
                });
            }
        });

        // Detectar componentes por clases CSS conocidas (usando configuración centralizada)
        const knownComponentSelectors: Record<string, { name: string, path: string }> = {};
        
        // Generar selectores desde la configuración
        Object.entries(REACT_COMPONENTS_CONFIG).forEach(([name, config]) => {
            const selector = name.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1);
            knownComponentSelectors[selector] = { name, path: config.importPath };
            knownComponentSelectors[`${selector}-background`] = { name, path: config.importPath };
        });

        Object.entries(knownComponentSelectors).forEach(([selector, info]) => {
            const elements = canvasElement.querySelectorAll(`.${selector}`);
            elements.forEach((element, index) => {
                const el = element as HTMLElement;
                if (!components.find(comp => comp.id === el.id)) {
                    components.push({
                        id: el.id || `${selector}-${index}`,
                        name: info.name,
                        importPath: info.path,
                        props: extractPropsFromElement(el)
                    });
                }
            });
        });

        return components;
    };

    const extractPropsFromElement = (element: HTMLElement): Record<string, any> => {
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

        // Extraer props comunes de estilos
        if (element.textContent) {
            props.children = element.textContent;
        }

        return props;
    };

    useEffect(() => {
        const components = detectComponents();
        setDetectedComponents(components);
    }, [canvasRef.current]);

    return {
        detectedComponents,
        refreshDetection: () => {
            const components = detectComponents();
            setDetectedComponents(components);
        }
    };
};

export default useCanvasComponentDetector;
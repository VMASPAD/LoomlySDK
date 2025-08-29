type CanvasSnapshot = {
    htmlContent: string;
    reactComponents: Array<{
        id: string;
        name: string;
        type: string;
        props: Record<string, any>;
        route: string;
    }>;
    styles: string;
    canvasSize: {
        width: number;
        height: number;
    };
    zoom: number;
};

// Importar la función directamente
import { getComponentImportPath } from '../config/ComponentsConfig';

export class ComponentGenerator {
    
    /**
     * Genera el archivo ComponentRendered.tsx
     */
    static generateComponentFile(snapshot: CanvasSnapshot): string {
        const { htmlContent, reactComponents, styles, canvasSize, zoom } = snapshot;
        
        // Generar imports únicos para los componentes detectados
        const uniqueComponents = [...new Set(reactComponents.map(comp => comp.name))];
        const componentImports = uniqueComponents.map(componentName => 
            `import ${componentName} from '${getComponentImportPath(componentName)}';`
        ).join('\n');
        
        const componentCode = `import React from 'react';
${componentImports}

// Estilos extraídos del canvas
const canvasStyles = \`
${styles}

/* Canvas base styles */
.render-canvas {
    width: ${canvasSize.width}px;
    height: ${canvasSize.height}px;
    transform: scale(${zoom});
    transform-origin: top left;
    position: relative;
    background: transparent;
    overflow: visible;
}

/* Elementos moveables */
.moveable-element {
    position: absolute;
    pointer-events: none;
}
\`;

interface ComponentRenderedProps {
    route?: string;
}

const ComponentRendered: React.FC<ComponentRenderedProps> = ({ route }) => {
    // Inyectar estilos
    React.useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = canvasStyles;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);
    
    return (
        <div className="w-full h-screen bg-transparent overflow-hidden">
            {/* Canvas con HTML y componentes React integrados */}
            <div 
                className="render-canvas"
                id="render-canvas"
            >
                {/* HTML literal del canvas */}
                <div dangerouslySetInnerHTML={{ __html: \`${htmlContent.replace(/`/g, '\\`')}\` }} />
                
                {/* Componentes React registrados y posicionados */}
${reactComponents.map(comp => {
    const styleProps = comp.props.style || {};
    const otherProps = Object.entries(comp.props).filter(([key]) => key !== 'style');
    const propsString = otherProps
        .map(([key, value]) => {
            if (typeof value === 'string') {
                return `${key}="${value}"`;
            }
            return `${key}={${JSON.stringify(value)}}`;
        })
        .join(' ');
        
    return `                <${comp.name} 
                    key="${comp.id}" 
                    ${propsString}
                    style={${JSON.stringify(styleProps)}}
                />`;
}).join('\n')}
            </div>
            
            {/* Indicador de listo para screenshot */}
            <div 
                id="render-ready" 
                style={{ 
                    position: 'absolute', 
                    top: '-9999px', 
                    left: '-9999px',
                    opacity: 0,
                    fontSize: '1px'
                }}
                data-timestamp={Date.now()}
            >
                ready
            </div>
        </div>
    );
};

export default ComponentRendered;

// Metadata para el sistema de renderizado
export const renderMetadata = {
    canvasSize: {
        width: ${canvasSize.width},
        height: ${canvasSize.height}
    },
    zoom: ${zoom},
    componentRoutes: ['/render'],
    detectedComponents: ${JSON.stringify(reactComponents.map(comp => comp.name))},
    lastGenerated: '${new Date().toISOString()}'
};`;

        return componentCode;
    }
    
    /**
     * Genera el componente y lo guarda en archivo
     */
    static async saveComponent(snapshot: CanvasSnapshot): Promise<void> {
        const componentCode = this.generateComponentFile(snapshot);
        
        // Enviar al backend para guardar el archivo
        const response = await fetch('http://localhost:3001/api/generate-component', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: componentCode,
                filename: 'ComponentRendered.tsx'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save component file');
        }
        
        console.log('✅ ComponentRendered.tsx generated successfully!');
    }
}

export default ComponentGenerator;
import React from 'react';


// Estilos extraídos del canvas
const canvasStyles = `
#element_1756953836462 {
  position: absolute;
  top: 187.214px;
  left: 182.701px;
  width: 346px;
  height: 638px;
  transform: matrix(1, 0, 0, 1, 55, -152.9);
  background-color: rgb(59, 130, 246);
  color: rgb(0, 0, 0);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-size: 16px;
  font-weight: 400;
  text-align: start;
  border: 0px solid rgb(0, 0, 0);
  border-radius: 4px;
  box-shadow: rgb(239, 37, 37) 6px 8px 6px 0px;
  opacity: 1;
  z-index: 4;
  display: block;
  flex-direction: row;
}

#element_1756954278631 {
  position: absolute;
  top: 147.284px;
  left: 184.973px;
  width: 180px;
  height: 24px;
  transform: matrix(1, 0, 0, 1, -26, 190);
  background-color: rgba(0, 0, 0, 0);
  color: rgb(55, 65, 81);
  font-family: Inter, sans-serif;
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  border: 2px dashed rgb(107, 114, 128);
  border-radius: 0px;
  box-shadow: none;
  opacity: 1;
  z-index: 5;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

#element_1756954875948 {
  position: absolute;
  top: 157.446px;
  left: 66.5053px;
  width: 523.406px;
  height: 377.453px;
  transform: matrix(1.10047, 0, 0, 1.29062, 85, 64.1562);
  background-color: rgb(59, 130, 246);
  color: rgb(0, 0, 0);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-size: 16px;
  font-weight: 400;
  text-align: start;
  border: 0px solid rgb(0, 0, 0);
  border-radius: 4px;
  box-shadow: none;
  opacity: 1;
  z-index: 3;
  display: block;
  flex-direction: row;
}



/* Canvas base styles */
.render-canvas {
    width: 800px;
    height: 600px;
    transform: scale(1);
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
`;

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
                <div dangerouslySetInnerHTML={{ __html: `<div id="element_1756953836462" class="absolute" data-element-id="element_1756953836462" style="position: absolute; cursor: move; user-select: none; width: 346px; height: 638px; background: linear-gradient(115deg, rgb(154, 66, 66) 50%, rgb(106, 68, 68) 50%) rgb(59, 130, 246); border-radius: 4px; z-index: 4; left: 182.701px; top: 187.214px; transform: translate(55px, -152.9px); box-shadow: rgb(239, 37, 37) 6px 8px 6px 0px;"></div><div id="element_1756954278631" class="absolute" data-element-id="element_1756954278631" contenteditable="true" style="position: absolute; cursor: move; user-select: none; width: 180px; height: 24px; background: transparent; border: 2px dashed rgb(107, 114, 128); display: flex; align-items: center; justify-content: center; font-family: Inter, sans-serif; font-size: 16px; color: rgb(55, 65, 81); text-align: center; z-index: 5; left: 184.973px; top: 147.284px; transform: translate(-26px, 190px);" spellcheck="false" data-ms-editor="true">Click to edit text</div><div id="element_1756954875948" class="absolute" data-element-id="element_1756954875948" style="position: absolute; cursor: move; user-select: none; width: 523.413px; height: 377.459px; background: rgb(59, 130, 246); border-radius: 4px; z-index: 3; left: 66.5053px; top: 157.446px; transform: translate(85px, 64.1562px) scale(1.10047, 1.29062);"></div>` }} />
                
                {/* Componentes React registrados y posicionados */}

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
        width: 800,
        height: 600
    },
    zoom: 1,
    componentRoutes: ['/render'],
    detectedComponents: [],
    lastGenerated: '2025-09-04T03:03:05.197Z'
};
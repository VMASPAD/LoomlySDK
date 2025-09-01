import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button"
import { Circle, Square } from 'lucide-react';
import Layers from './Layers';
import type { ComponentType } from "react";
import { getComponentsByCategory } from '@/config/ComponentsConfig';
import ImageUploader from './ImageUploader';

interface ElementData {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'div' | 'p' | 'h1' | 'react-component';
  element: HTMLElement;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  name: string;
}

interface ElementsPanelProps {
  onAddElement: (elementType: string) => void;
  elements: ElementData[];
  selectedElement: ElementData | null;
  onMoveLayerUp: (elementId: string) => void;
  onMoveLayerDown: (elementId: string) => void;
  addReactElement: (component: ComponentType<any>, componentName?: string) => void;
  onToggleVisibility?: (elementId: string) => void;
  onImageAdd?: (imageData: string, fileName: string) => void;
}

function ElementsPanel({ 
  onAddElement, 
  elements, 
  selectedElement, 
  onMoveLayerUp, 
  onMoveLayerDown,
  addReactElement,
  onToggleVisibility,
  onImageAdd
}: ElementsPanelProps) {
  // Obtener componentes disponibles desde la configuración
  const backgroundComponents = getComponentsByCategory('backgrounds');
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Elements</h3>
      
      {/* Basic Elements */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">HTML Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => onAddElement("div")} variant="outline" size="sm" className="w-full justify-start">
            📦 Div Container
          </Button>
          <Button onClick={() => onAddElement("p")} variant="outline" size="sm" className="w-full justify-start">
            📝 Paragraph
          </Button>
          <Button onClick={() => onAddElement("h1")} variant="outline" size="sm" className="w-full justify-start">
            🏷️ Heading 1
          </Button>
        </CardContent>
      </Card>

      {/* Shapes */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Shapes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => onAddElement("rectangle")} variant="outline" size="sm" className="w-full justify-start">
            <Square className="w-4 h-4 mr-2" />
            Rectangle
          </Button>
          <Button onClick={() => onAddElement("circle")} variant="outline" size="sm" className="w-full justify-start">
            <Circle className="w-4 h-4 mr-2" />
            Circle
          </Button>
          <Button onClick={() => onAddElement("text")} variant="outline" size="sm" className="w-full justify-start">
            📄 Text
          </Button>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Images</CardTitle>
        </CardHeader>
        <CardContent>
          {onImageAdd && <ImageUploader onImageAdd={onImageAdd} />}
        </CardContent>
      </Card>
      
      {/* React Components - Dinámicamente generados desde la configuración */}
      {backgroundComponents.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">React Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {backgroundComponents.map((config) => (
              <Button 
                key={config.name}
                onClick={() => addReactElement(config.component, config.name)} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
              >
                {config.displayName}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Layers Panel */}
      <Layers 
        elements={elements}
        selectedElement={selectedElement}
        onMoveLayerUp={onMoveLayerUp}
        onMoveLayerDown={onMoveLayerDown}
        onToggleVisibility={onToggleVisibility}
      />
    </div>
  )
}

export default ElementsPanel

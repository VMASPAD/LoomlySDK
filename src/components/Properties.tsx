import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { ChevronUp, ChevronDown } from 'lucide-react';
import TextEditor from './TextEditor';

interface ElementData {
    id: string;
    type: 'rectangle' | 'circle' | 'text' | 'div' | 'p' | 'h1' | 'react-component';
    element: HTMLElement;
    isLocked: boolean;
    isVisible: boolean;
    zIndex: number;
    name: string;
}interface CurrentStyles {
  width: string;
  height: string;
  transform: string;
  backgroundColor: string;
  color: string;
  borderRadius: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  lineHeight: string;
  letterSpacing: string;
  textDecoration: string;
  opacity: string;
}

interface PropertiesProps {
  selectedElement: ElementData | null;
  currentStyles: CurrentStyles;
  onChangeElementLayer: (elementId: string, newZIndex: number) => void;
  onMoveLayerUp: (elementId: string) => void;
  onMoveLayerDown: (elementId: string) => void;
  onUpdateCurrentStyles: (element: HTMLElement) => void;
}

function Properties({ 
  selectedElement, 
  currentStyles,
  onChangeElementLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onUpdateCurrentStyles
}: PropertiesProps) {

  // Direct input handlers that apply changes immediately
  const handleStyleChange = (property: string, value: string) => {
    if (selectedElement?.element) {
      (selectedElement.element.style as any)[property] = value;
      onUpdateCurrentStyles(selectedElement.element);
    }
  }

  return (
    <div className="p-4">
      {selectedElement ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Properties</h3>
            <Badge variant="secondary">{selectedElement.type}</Badge>
          </div>
           

          {/* Text Editor for text elements */}
          {(selectedElement.type === 'text' || selectedElement.type === 'p' || selectedElement.type === 'h1') && (
            <TextEditor 
              selectedElement={selectedElement}
              currentStyles={currentStyles}
              onUpdateCurrentStyles={onUpdateCurrentStyles}
            />
          )}

          {/* Style Properties */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Style Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width" className="text-xs">Width</Label>
                  <Input 
                    id="width"
                    placeholder="100px" 
                    type="text" 
                    value={currentStyles.width} 
                    onChange={(e) => handleStyleChange('width', e.target.value)} 
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Height</Label>
                  <Input 
                    id="height"
                    placeholder="100px" 
                    type="text" 
                    value={currentStyles.height} 
                    onChange={(e) => handleStyleChange('height', e.target.value)} 
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Colors */}
              <div>
                <Label htmlFor="backgroundColor" className="text-xs">Background Color</Label>
                <Input 
                  id="backgroundColor"
                  placeholder="#ffffff" 
                  type="text" 
                  value={currentStyles.backgroundColor} 
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="color" className="text-xs">Text Color</Label>
                <Input 
                  id="color"
                  placeholder="#000000" 
                  type="text" 
                  value={currentStyles.color} 
                  onChange={(e) => handleStyleChange('color', e.target.value)} 
                  className="text-xs"
                />
              </div>

              {/* Border */}
              <div>
                <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
                <Input 
                  id="borderRadius"
                  placeholder="4px" 
                  type="text" 
                  value={currentStyles.borderRadius} 
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)} 
                  className="text-xs"
                />
              </div>

              {/* Typography */}
              <div>
                <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                <Input 
                  id="fontSize"
                  placeholder="14px" 
                  type="text" 
                  value={currentStyles.fontSize} 
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)} 
                  className="text-xs"
                />
              </div>

              {/* Opacity */}
              <div>
                <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                <Input 
                  id="opacity"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  value={currentStyles.opacity} 
                  onChange={(e) => handleStyleChange('opacity', e.target.value)} 
                  className="text-xs"
                />
                <span className="text-xs text-gray-500">{currentStyles.opacity}</span>
              </div>

              {/* Transform (Read-only) */}
              <div>
                <Label htmlFor="transform" className="text-xs">Transform (Read-only)</Label>
                <Input 
                  id="transform"
                  type="text" 
                  value={currentStyles.transform} 
                  readOnly
                  className="bg-gray-100 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          <p>Select an element to view its properties</p>
        </div>
      )}
    </div>
  )
}

export default Properties

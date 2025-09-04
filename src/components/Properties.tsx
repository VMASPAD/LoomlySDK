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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import TextEditor from './TextEditor';
import { useState } from 'react';

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

  // State for gradient configuration
  const [gradientType, setGradientType] = useState('linear');
  const [gradientAngle, setGradientAngle] = useState('90');
  const [gradientColors, setGradientColors] = useState([
    { color: '#ff0000', position: '0' },
    { color: '#0000ff', position: '100' }
  ]);

  // State for shadows
  const [boxShadows, setBoxShadows] = useState([
    { x: '0', y: '4', blur: '6', spread: '0', color: 'rgba(0, 0, 0, 0.1)' }
  ]);
  const [textShadows, setTextShadows] = useState([
    { x: '1', y: '1', blur: '2', color: 'rgba(0, 0, 0, 0.5)' }
  ]);

  // Direct input handlers that apply changes immediately
  const handleStyleChange = (property: string, value: string) => {
    if (selectedElement?.element) {
      (selectedElement.element.style as any)[property] = value;
      onUpdateCurrentStyles(selectedElement.element);
    }
  }

  // Gradient functions
  const generateGradient = () => {
    const colorStops = gradientColors.map(c => `${c.color} ${c.position}%`).join(', ');
    let gradientValue = '';

    switch (gradientType) {
      case 'linear':
        gradientValue = `linear-gradient(${gradientAngle}deg, ${colorStops})`;
        break;
      case 'radial':
        gradientValue = `radial-gradient(circle, ${colorStops})`;
        break;
      case 'conic':
        gradientValue = `conic-gradient(from ${gradientAngle}deg, ${colorStops})`;
        break;
    }

    handleStyleChange('backgroundImage', gradientValue);
  }

  const addGradientColor = () => {
    setGradientColors([...gradientColors, { color: '#ffffff', position: '50' }]);
  }

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index));
    }
  }

  const updateGradientColor = (index: number, field: 'color' | 'position', value: string) => {
    const updated = [...gradientColors];
    updated[index][field] = value;
    setGradientColors(updated);
  }

  // Shadow functions
  const generateBoxShadow = () => {
    const shadowValue = boxShadows.map(s => 
      `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
    ).join(', ');
    handleStyleChange('boxShadow', shadowValue);
  }

  const generateTextShadow = () => {
    const shadowValue = textShadows.map(s => 
      `${s.x}px ${s.y}px ${s.blur}px ${s.color}`
    ).join(', ');
    handleStyleChange('textShadow', shadowValue);
  }

  const addBoxShadow = () => {
    setBoxShadows([...boxShadows, { x: '0', y: '2', blur: '4', spread: '0', color: 'rgba(0, 0, 0, 0.1)' }]);
  }

  const removeBoxShadow = (index: number) => {
    if (boxShadows.length > 1) {
      setBoxShadows(boxShadows.filter((_, i) => i !== index));
    }
  }

  const updateBoxShadow = (index: number, field: keyof typeof boxShadows[0], value: string) => {
    const updated = [...boxShadows];
    updated[index][field] = value;
    setBoxShadows(updated);
  }

  const addTextShadow = () => {
    setTextShadows([...textShadows, { x: '1', y: '1', blur: '2', color: 'rgba(0, 0, 0, 0.5)' }]);
  }

  const removeTextShadow = (index: number) => {
    if (textShadows.length > 1) {
      setTextShadows(textShadows.filter((_, i) => i !== index));
    }
  }

  const updateTextShadow = (index: number, field: keyof typeof textShadows[0], value: string) => {
    const updated = [...textShadows];
    updated[index][field] = value;
    setTextShadows(updated);
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
            </CardContent>
          </Card>

          {/* Gradient Generator */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Background Gradient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gradient Type */}
              <div>
                <Label className="text-xs">Gradient Type</Label>
                <Select value={gradientType} onValueChange={setGradientType}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                    <SelectItem value="conic">Conic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gradient Angle (for linear and conic) */}
              {(gradientType === 'linear' || gradientType === 'conic') && (
                <div>
                  <Label htmlFor="gradientAngle" className="text-xs">
                    {gradientType === 'linear' ? 'Direction (deg)' : 'Starting Angle (deg)'}
                  </Label>
                  <Input 
                    id="gradientAngle"
                    type="number"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Gradient Colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Colors</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addGradientColor}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {gradientColors.map((colorStop, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      type="color"
                      value={colorStop.color}
                      onChange={(e) => updateGradientColor(index, 'color', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={colorStop.position}
                      onChange={(e) => updateGradientColor(index, 'position', e.target.value)}
                      className="text-xs flex-1"
                      placeholder="%"
                    />
                    {gradientColors.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeGradientColor(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={generateGradient} size="sm" className="w-full">
                Apply Gradient
              </Button>
            </CardContent>
          </Card>

          {/* Box Shadow */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Box Shadow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Shadows</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addBoxShadow}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {boxShadows.map((shadow, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Shadow {index + 1}</span>
                    {boxShadows.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBoxShadow(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X Offset</Label>
                      <Input
                        type="number"
                        value={shadow.x}
                        onChange={(e) => updateBoxShadow(index, 'x', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y Offset</Label>
                      <Input
                        type="number"
                        value={shadow.y}
                        onChange={(e) => updateBoxShadow(index, 'y', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Blur</Label>
                      <Input
                        type="number"
                        min="0"
                        value={shadow.blur}
                        onChange={(e) => updateBoxShadow(index, 'blur', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Spread</Label>
                      <Input
                        type="number"
                        value={shadow.spread}
                        onChange={(e) => updateBoxShadow(index, 'spread', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={shadow.color.includes('rgba') ? '#000000' : shadow.color}
                        onChange={(e) => updateBoxShadow(index, 'color', e.target.value)}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={shadow.color}
                        onChange={(e) => updateBoxShadow(index, 'color', e.target.value)}
                        className="text-xs flex-1"
                        placeholder="rgba(0,0,0,0.1)"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={generateBoxShadow} size="sm" className="w-full">
                Apply Box Shadow
              </Button>
            </CardContent>
          </Card>

          {/* Text Shadow */}
          {(selectedElement.type === 'text' || selectedElement.type === 'p' || selectedElement.type === 'h1') && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Text Shadow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Shadows</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTextShadow}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {textShadows.map((shadow, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Text Shadow {index + 1}</span>
                      {textShadows.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeTextShadow(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">X Offset</Label>
                        <Input
                          type="number"
                          value={shadow.x}
                          onChange={(e) => updateTextShadow(index, 'x', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Offset</Label>
                        <Input
                          type="number"
                          value={shadow.y}
                          onChange={(e) => updateTextShadow(index, 'y', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Blur</Label>
                        <Input
                          type="number"
                          min="0"
                          value={shadow.blur}
                          onChange={(e) => updateTextShadow(index, 'blur', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={shadow.color.includes('rgba') ? '#000000' : shadow.color}
                          onChange={(e) => updateTextShadow(index, 'color', e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          type="text"
                          value={shadow.color}
                          onChange={(e) => updateTextShadow(index, 'color', e.target.value)}
                          className="text-xs flex-1"
                          placeholder="rgba(0,0,0,0.5)"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button onClick={generateTextShadow} size="sm" className="w-full">
                  Apply Text Shadow
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Style Properties Card */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Basic Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

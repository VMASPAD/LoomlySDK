import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ElementData {
    id: string;
    type: 'rectangle' | 'circle' | 'text' | 'div' | 'p' | 'h1' | 'react-component';
    element: HTMLElement;
    isLocked: boolean;
    isVisible: boolean;
    zIndex: number;
    name: string;
}

interface CurrentStyles {
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

interface TextEditorProps {
    selectedElement: ElementData;
    currentStyles: CurrentStyles;
    onUpdateCurrentStyles: (element: HTMLElement) => void;
}

// Lista de Google Fonts disponibles
const GOOGLE_FONTS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Poppins',
    'Montserrat',
    'Nunito',
    'Playfair Display',
    'Merriweather',
    'Oswald',
    'Geist',
    'Fira Code',
    'Lora',
    'Pacifico',
    'Raleway',
    'Cal Sans'
];

const FONT_WEIGHTS = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
];

const TEXT_ALIGN_OPTIONS = [
    { value: 'left', label: 'Left', icon: '←' },
    { value: 'center', label: 'Center', icon: '↔' },
    { value: 'right', label: 'Right', icon: '→' },
    { value: 'justify', label: 'Justify', icon: '≡' }
];

function TextEditor({ selectedElement, currentStyles, onUpdateCurrentStyles }: TextEditorProps) {
    const [colorInputValue, setColorInputValue] = useState(currentStyles.color);
    const [backgroundInputValue, setBackgroundInputValue] = useState(currentStyles.backgroundColor);

    // Update local state when currentStyles changes
    useEffect(() => {
        setColorInputValue(currentStyles.color || '#000000');
        setBackgroundInputValue(currentStyles.backgroundColor || '#ffffff');
    }, [currentStyles.color, currentStyles.backgroundColor]);

    const updateStyle = (property: keyof CSSStyleDeclaration, value: string) => {
        if (selectedElement?.element) {
            (selectedElement.element.style as any)[property] = value;
            onUpdateCurrentStyles(selectedElement.element);
        }
    };

    // Helper function to get the current font family value
    const getCurrentFontFamily = () => {
        if (!currentStyles.fontFamily || currentStyles.fontFamily === 'initial') return GOOGLE_FONTS[0];
        
        // Remove quotes and get the first font in the stack
        const cleanFont = currentStyles.fontFamily
            .replace(/['"]/g, '')
            .split(',')[0]
            .trim();
        
        // Check if it's in our available fonts, otherwise default to first font
        return GOOGLE_FONTS.includes(cleanFont) ? cleanFont : GOOGLE_FONTS[0];
    };

    // Helper function to get the current font weight
    const getCurrentFontWeight = () => {
        if (!currentStyles.fontWeight || currentStyles.fontWeight === 'initial') return '400';
        return currentStyles.fontWeight;
    };

    const handleColorChange = (value: string, property: 'color' | 'backgroundColor') => {
        if (property === 'color') {
            setColorInputValue(value);
        } else {
            setBackgroundInputValue(value);
        }
        updateStyle(property, value);
    };

    const toggleTextDecoration = (decoration: string) => {
        const currentDecoration = currentStyles.textDecoration;
        const newDecoration = currentDecoration.includes(decoration) 
            ? currentDecoration.replace(decoration, '').replace(/\s+/g, ' ').trim() || 'none'
            : currentDecoration === 'none' 
                ? decoration 
                : `${currentDecoration} ${decoration}`.trim();
        
        updateStyle('textDecoration', newDecoration);
    };

    const toggleFontStyle = () => {
        const newStyle = currentStyles.fontStyle === 'italic' ? 'normal' : 'italic';
        updateStyle('fontStyle', newStyle);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Font Family */}
<div>
    <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
    <Select
        value={getCurrentFontFamily()}
        onValueChange={(value) => updateStyle('fontFamily', `"${value}", sans-serif`)}
    >
        <SelectTrigger className="w-full">
            <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
            {GOOGLE_FONTS.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
</div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                            <Input
                                id="fontSize"
                                placeholder="16px"
                                type="text"
                                value={currentStyles.fontSize}
                                onChange={(e) => updateStyle('fontSize', e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor="fontWeight" className="text-xs">Font Weight</Label>
                            <Select
                                value={getCurrentFontWeight()}
                                onValueChange={(value) => updateStyle('fontWeight', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Weight" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_WEIGHTS.map(weight => (
                                        <SelectItem key={weight.value} value={weight.value}>
                                            {weight.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <Label className="text-xs">Text Align</Label>
                        <div className="flex gap-1 mt-1">
                            {TEXT_ALIGN_OPTIONS.map(option => (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={currentStyles.textAlign === option.value ? "default" : "outline"}
                                    onClick={() => updateStyle('textAlign', option.value)}
                                    className="flex-1 text-xs"
                                >
                                    {option.icon}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <Label htmlFor="textColor" className="text-xs">Text Color</Label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={colorInputValue.startsWith('#') ? colorInputValue : '#000000'}
                                onChange={(e) => handleColorChange(e.target.value, 'color')}
                                className="w-12 h-8 rounded border border-gray-300"
                            />
                            <Input
                                id="textColor"
                                placeholder="#000000"
                                type="text"
                                value={colorInputValue}
                                onChange={(e) => handleColorChange(e.target.value, 'color')}
                                className="flex-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Background Color */}
                    <div>
                        <Label htmlFor="backgroundColor" className="text-xs">Background Color</Label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={backgroundInputValue.startsWith('#') ? backgroundInputValue : '#ffffff'}
                                onChange={(e) => handleColorChange(e.target.value, 'backgroundColor')}
                                className="w-12 h-8 rounded border border-gray-300"
                            />
                            <Input
                                id="backgroundColor"
                                placeholder="#ffffff"
                                type="text"
                                value={backgroundInputValue}
                                onChange={(e) => handleColorChange(e.target.value, 'backgroundColor')}
                                className="flex-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Line Height & Letter Spacing */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="lineHeight" className="text-xs">Line Height</Label>
                            <Input
                                id="lineHeight"
                                placeholder="1.5"
                                type="text"
                                value={currentStyles.lineHeight}
                                onChange={(e) => updateStyle('lineHeight', e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor="letterSpacing" className="text-xs">Letter Spacing</Label>
                            <Input
                                id="letterSpacing"
                                placeholder="0px"
                                type="text"
                                value={currentStyles.letterSpacing}
                                onChange={(e) => updateStyle('letterSpacing', e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>

                    {/* Text Style Toggles */}
                    <div>
                        <Label className="text-xs">Text Style</Label>
                        <div className="flex gap-1 mt-1">
                            <Button
                                size="sm"
                                variant={currentStyles.fontStyle === 'italic' ? "default" : "outline"}
                                onClick={toggleFontStyle}
                                className="flex-1 text-xs"
                            >
                                <em>I</em>
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStyles.textDecoration.includes('underline') ? "default" : "outline"}
                                onClick={() => toggleTextDecoration('underline')}
                                className="flex-1 text-xs"
                            >
                                <u>U</u>
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStyles.textDecoration.includes('line-through') ? "default" : "outline"}
                                onClick={() => toggleTextDecoration('line-through')}
                                className="flex-1 text-xs"
                            >
                                <s>S</s>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default TextEditor;
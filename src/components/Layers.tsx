import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
    Layers as LayersIcon,
    ChevronUp,
    ChevronDown,
    Lock,
    EyeOff,
    Eye
} from 'lucide-react';

interface ElementData {
    id: string;
    type: 'rectangle' | 'circle' | 'text' | 'div' | 'p' | 'h1' | 'react-component';
    element: HTMLElement;
    isLocked: boolean;
    isVisible: boolean;
    zIndex: number;
    name: string;
}

interface LayersProps {
    elements: ElementData[];
    selectedElement: ElementData | null;
    onMoveLayerUp: (elementId: string) => void;
    onMoveLayerDown: (elementId: string) => void;
    onToggleVisibility?: (elementId: string) => void;
}

export default function Layers({ 
    elements, 
    selectedElement, 
    onMoveLayerUp, 
    onMoveLayerDown,
    onToggleVisibility
}: LayersProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                    <LayersIcon className="w-4 h-4 mr-2" />
                    Layers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                    {elements
                        .sort((a, b) => b.zIndex - a.zIndex)
                        .map((element) => (
                            <div
                                key={element.id}
                                className={`flex items-center justify-between p-2 rounded text-xs border ${
                                    selectedElement?.id === element.id 
                                        ? 'bg-blue-50 border-blue-200' 
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                        {element.zIndex}
                                    </Badge>
                                    <span className="truncate">{element.name}</span>
                                    {element.isLocked && <Lock className="w-3 h-3" />}
                                    {!element.isVisible && <EyeOff className="w-3 h-3" />}
                                </div>
                                <div className="flex space-x-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => onToggleVisibility?.(element.id)}
                                        title={element.isVisible ? 'Hide' : 'Show'}
                                    >
                                        {element.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => onMoveLayerUp(element.id)}
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => onMoveLayerDown(element.id)}
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
}
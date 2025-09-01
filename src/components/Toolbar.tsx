import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { 
    Copy,
    Trash2,
    Lock,
    Unlock,
    ZoomIn,
    ZoomOut,
    Eye,
    EyeOff,
    X,
    Download,
    Save,
    RotateCcw,
    FolderOpen
} from 'lucide-react';

interface MoveableSettings {
    draggable: boolean;
    resizable: boolean;
    scalable: boolean;
    rotatable: boolean;
    warpable: boolean;
    pinchable: boolean;
    originDraggable: boolean;
    clippable: boolean;
    roundable: boolean;
    snappable: boolean;
    keepRatio: boolean;
    renderDirections: string[];
    edge: boolean;
    throttleDrag: number;
    throttleResize: number;
    throttleScale: number;
    throttleRotate: number;
}

interface ToolbarProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onDeselect?: () => void;
    onExportJPG?: () => void;
    onToggleLock: () => void;
    onToggleVisibility: () => void;
    moveableSettings: MoveableSettings;
    onUpdateMoveableSetting: <K extends keyof MoveableSettings>(key: K, value: MoveableSettings[K]) => void;
    showGrid: boolean;
    onToggleGrid: (show: boolean) => void;
    isMultiSelect: boolean;
    onSaveProject?: () => void;
    onClearData?: () => void;
    onLoadData?: () => void;
    lastSaveTime?: Date | null;
    hasUnsavedChanges?: boolean;
    onToggleMultiSelect: (enabled: boolean) => void;
    selectedElement: any;
    hasSelection: boolean;
    selectedTargets: HTMLElement[];
}

export default function Toolbar({ 
    zoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onDuplicate,
    onDelete,
    onDeselect,
    onExportJPG,
    onToggleLock,
    onToggleVisibility,
    moveableSettings,
    onUpdateMoveableSetting,
    showGrid,
    onToggleGrid,
    isMultiSelect,
    onToggleMultiSelect,
    selectedElement,
    hasSelection,
    selectedTargets,
    onSaveProject,
    onClearData,
    onLoadData,
    lastSaveTime,
    hasUnsavedChanges
}: ToolbarProps) {
    return (
        <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">LoomlySDK</h2>
                <img src='/icon.png' className="w-8 h-8" />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomOut}
                        disabled={zoom <= 0.1}
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomIn}
                        disabled={zoom >= 3}
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetZoom}
                    >
                        Reset
                    </Button>
                </div>
            </div>

            {/* Element Actions */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Actions:</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDuplicate}
                    disabled={!hasSelection}
                >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    disabled={!hasSelection}
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeselect}
                    disabled={!hasSelection}
                >
                    <X className="w-4 h-4 mr-1" />
                    Deselect
                </Button>
                
                {/* Save System Buttons */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSaveProject}
                    className={`${hasUnsavedChanges ? 'bg-green-50 hover:bg-green-100 border-green-300' : 'bg-gray-50'}`}
                    title={lastSaveTime ? `Last saved: ${lastSaveTime.toLocaleTimeString()}` : 'No saves yet'}
                >
                    <Save className="w-4 h-4 mr-1" />
                    Save {hasUnsavedChanges ? '*' : ''}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearData}
                    className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear Data
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadData}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                >
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Load Data
                </Button>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportJPG}
                    className="bg-purple-50 hover:bg-purple-100 border-purple-300"
                >
                    <Download className="w-4 h-4 mr-1" />
                    Export PNG (Headless)
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleLock}
                    disabled={!selectedElement}
                >
                    {selectedElement?.isLocked ? (
                        <><Unlock className="w-4 h-4 mr-1" />Unlock</>
                    ) : (
                        <><Lock className="w-4 h-4 mr-1" />Lock</>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleVisibility}
                    disabled={!selectedElement}
                >
                    {selectedElement?.isVisible ? (
                        <><EyeOff className="w-4 h-4 mr-1" />Hide</>
                    ) : (
                        <><Eye className="w-4 h-4 mr-1" />Show</>
                    )}
                </Button>
            </div>

            {/* Moveable Settings */}
            <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.draggable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('draggable', checked)}
                    />
                    <span className="text-sm">Draggable</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.resizable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('resizable', checked)}
                    />
                    <span className="text-sm">Resizable</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.scalable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('scalable', checked)}
                    />
                    <span className="text-sm">Scalable</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.rotatable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('rotatable', checked)}
                    />
                    <span className="text-sm">Rotatable</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.snappable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('snappable', checked)}
                    />
                    <span className="text-sm">Snappable</span>
                </label>
                
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.clippable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('clippable', checked)}
                    />
                    <span className="text-sm">Clippable</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={moveableSettings.warpable}
                        onCheckedChange={(checked) => onUpdateMoveableSetting('warpable', checked)}
                    />
                    <span className="text-sm">Warpable</span>
                </label>

                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={showGrid}
                        onCheckedChange={onToggleGrid}
                    />
                    <span className="text-sm">Grid</span>
                </label>
                <label className="flex items-center space-x-2">
                    <Switch 
                        checked={isMultiSelect}
                        onCheckedChange={onToggleMultiSelect}
                    />
                    <span className="text-sm">Multi-Select</span>
                </label>
            </div>
        </div>
    );
}
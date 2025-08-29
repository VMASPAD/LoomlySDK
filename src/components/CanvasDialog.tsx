import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface CanvasDialogProps {
    canvasWidth: number;
    canvasHeight: number;
    onCanvasWidthChange: (width: number) => void;
    onCanvasHeightChange: (height: number) => void;
    onCreateCanvas: () => void;
}

export default function CanvasDialog({
    canvasWidth,
    canvasHeight,
    onCanvasWidthChange,
    onCanvasHeightChange,
    onCreateCanvas
}: CanvasDialogProps) {
    return (
        <div className="flex items-center justify-center h-full">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="lg" className="px-8 py-4">
                        Create New Canvas
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Canvas</DialogTitle>
                        <DialogDescription>
                            Set up your canvas dimensions and start designing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="canvas-width">Width (px)</Label>
                                <Input
                                    id="canvas-width"
                                    type="number"
                                    value={canvasWidth}
                                    onChange={(e) => onCanvasWidthChange(Number(e.target.value))}
                                    min="100"
                                    max="2000"
                                />
                            </div>
                            <div>
                                <Label htmlFor="canvas-height">Height (px)</Label>
                                <Input
                                    id="canvas-height"
                                    type="number"
                                    value={canvasHeight}
                                    onChange={(e) => onCanvasHeightChange(Number(e.target.value))}
                                    min="100"
                                    max="2000"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={onCreateCanvas}>Create Canvas</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
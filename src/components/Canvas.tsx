import { RotateCwIcon } from 'lucide-react';
import { useRef, forwardRef } from 'react';
import Moveable, { 
    type OnDrag, 
    type OnResize, 
    type OnScale, 
    type OnRotate, 
    type OnWarp,
    type OnClip,
    type OnRound,
    makeAble,
    type Renderer,
    type MoveableManagerInterface
} from 'react-moveable';

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

interface CanvasProps {
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
    showGrid: boolean;
    target: HTMLElement | null;
    selectedTargets: HTMLElement[];
    isMultiSelect: boolean;
    moveableSettings: MoveableSettings;
    elements: any[];
    onTargetStylesChange: (element: HTMLElement | SVGElement) => void;
    onCurrentStylesUpdate: (element: HTMLElement) => void;
}
const CustomRotation = makeAble("customRotation", {
   render(moveable: MoveableManagerInterface<any, any>, React: Renderer): any {
       const rect = moveable.getRect();
       const { pos1, pos2 } = moveable.state;
        return <RotateCwIcon  className={"moveable-custom-rotation"} style={{
            position: "absolute",
            transform: `translate(-50%, -100%)`
                + ` translate(${(pos1[0] + pos2[0]) / 2}px, ${(pos1[1] + pos2[1]) / 2}px)`
                + ` rotate(${rect.rotation}deg) translateY(-20px)`,
            width: "20px",
            height: "20px", 
            cursor: "move",
            transformOrigin: "50% 100%",
        }}>
        </RotateCwIcon> ;
    },
});
const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ 
    canvasWidth,
    canvasHeight,
    zoom,
    showGrid,
    target,
    selectedTargets,
    isMultiSelect,
    moveableSettings,
    elements,
    onTargetStylesChange,
    onCurrentStylesUpdate
}, ref) => {
    return (
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-transparent"
             style={{
                 background: 'transparent',
                 backgroundImage: `
                     radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)
                 `,
                 backgroundSize: '20px 20px'
             }}>
            <div 
                ref={ref}
                className="bg-transparent"
                style={{ 
                    width: canvasWidth, 
                    height: canvasHeight,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    position: 'relative',
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid #d1d5dc'
                }}
                id="canvas"
            >
                {/* Moveable Component inside Canvas */}
                {target && (
                    <Moveable
                        target={isMultiSelect && selectedTargets.length > 1 ? selectedTargets : target}
                        origin={true}
                        zoom={zoom}
                        props={{
                             customRotation: true,
                        }}
                                    rotationTarget={".moveable-custom-rotation"}
                        rotationPosition={"none"}
                        ables={[CustomRotation]}
                        /* Core Features */
                        draggable={moveableSettings.draggable}
                        resizable={moveableSettings.resizable}
                        scalable={moveableSettings.scalable}
                        rotatable={moveableSettings.rotatable}
                        warpable={moveableSettings.warpable}
                        pinchable={moveableSettings.pinchable}

                        /* Advanced Features */
                        originDraggable={moveableSettings.originDraggable}
                        clippable={moveableSettings.clippable}
                        roundable={moveableSettings.roundable}
                        snappable={moveableSettings.snappable}

                        /* Options */
                        keepRatio={moveableSettings.keepRatio}
                        edge={moveableSettings.edge}
                        renderDirections={moveableSettings.renderDirections as any}

                        /* Throttling */
                        throttleDrag={moveableSettings.throttleDrag}
                        throttleResize={moveableSettings.throttleResize}
                        throttleScale={moveableSettings.throttleScale}
                        throttleRotate={moveableSettings.throttleRotate}

                        /* Snapping Configuration */
                        elementGuidelines={elements.map(el => el.element)}
                        snapThreshold={5}
                        snapGap={true}
                        snapCenter={true}
                        snapElement={true}
                        bounds={{
                            left: 0,
                            top: 0,
                            right: canvasWidth,
                            bottom: canvasHeight,
                        }}

                        /* Drag Events */
                        onDrag={({ target, transform }: OnDrag) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.transform = transform;
                                onTargetStylesChange(target);
                                onCurrentStylesUpdate(target);
                            }
                        }}

                        /* Resize Events */
                        onResize={({ target, width, height, delta }: OnResize) => {
                            if (target && target instanceof HTMLElement) {
                                delta[0] && (target.style.width = `${width}px`);
                                delta[1] && (target.style.height = `${height}px`);
                                onTargetStylesChange(target);
                                onCurrentStylesUpdate(target);
                            }
                        }}

                        /* Scale Events */
                        onScale={({ target, transform }: OnScale) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.transform = transform;
                                onTargetStylesChange(target);
                                onCurrentStylesUpdate(target);
                            }
                        }}

                        /* Rotate Events */
                        onRotate={({ target, transform }: OnRotate) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.transform = transform;
                                onTargetStylesChange(target);
                                onCurrentStylesUpdate(target);
                            }
                        }}

                        /* Warp Events */
                        onWarp={({ target, transform }: OnWarp) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.transform = transform;
                                onTargetStylesChange(target);
                                onCurrentStylesUpdate(target);
                            }
                        }}

                        /* Clip Events */
                        onClip={({ target, clipStyle }: OnClip) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.clipPath = clipStyle;
                            }
                        }}

                        /* Round Events */
                        onRound={({ target, borderRadius }: OnRound) => {
                            if (target && target instanceof HTMLElement) {
                                target.style.borderRadius = borderRadius;
                            }
                        }}

                        checkInput={false} 
                    />
                )}

                {/* Grid Background */}
                {showGrid && (
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                            `,
                            backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                        }}
                    />
                )}
                
                {/* Canvas content will be added here dynamically */}
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';

export default Canvas;
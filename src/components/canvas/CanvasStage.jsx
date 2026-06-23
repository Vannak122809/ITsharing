import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import DraggableText from './DraggableText';
import DraggableImage from './DraggableImage';

const CanvasStage = forwardRef(({ 
  frameUrl, 
  photoUrl, 
  textLayers, 
  setTextLayers, 
  stickerLayers = [],
  selectedId, 
  setSelectedId,
  checkDeselect,
  canvasBgColor = '#ffffff',
  photoProps,
  setPhotoProps
}, ref) => {
  // Load images
  const [frameImage] = useImage(frameUrl);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = frameImage ? (800 / frameImage.width) * frameImage.height : 800;

  // We want the photo to be behind the frame (which usually has a transparent cutout).
  // So Layer order: Photo -> Frame -> Text

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial width
    setContainerWidth(containerRef.current.offsetWidth);

    const observer = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth / CANVAS_WIDTH;

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Stage 
        width={CANVAS_WIDTH * scale} 
        height={CANVAS_HEIGHT * scale} 
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        ref={ref}
        scaleX={scale}
        scaleY={scale}
      >
      <Layer>
        {/* Background Color */}
        <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={canvasBgColor} listening={false} />

        {/* User Photo */}
        {photoUrl && (
          <DraggableImage 
            imageUrl={photoUrl}
            isSelected={selectedId === 'user_photo'}
            onSelect={() => setSelectedId('user_photo')}
            externalProps={photoProps}
            onExternalChange={setPhotoProps}
            onChange={() => {}}
          />
        )}

        {/* Frame Overlay - Not draggable */}
        {frameImage && (
          <KonvaImage 
            image={frameImage} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            listening={false} // Don't block clicks to the photo behind it
          />
        )}

        {/* Stickers */}
        {stickerLayers.map((layer) => (
          <DraggableImage 
            key={layer.id}
            imageUrl={layer.src}
            isSelected={selectedId === layer.id}
            onSelect={() => setSelectedId(layer.id)}
            onChange={() => {}}
            maxSize={200}
          />
        ))}

        {/* Text Layers */}
        {textLayers.map((layer, i) => (
          <DraggableText
            key={layer.id}
            shapeProps={layer}
            isSelected={layer.id === selectedId}
            onSelect={() => setSelectedId(layer.id)}
            onChange={(newAttrs) => {
              const newTextLayers = textLayers.slice();
              newTextLayers[i] = newAttrs;
              setTextLayers(newTextLayers);
            }}
          />
        ))}
      </Layer>
    </Stage>
    </div>
  );
});

export default CanvasStage;

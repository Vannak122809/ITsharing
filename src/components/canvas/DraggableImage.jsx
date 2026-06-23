import React, { useRef, useEffect, useState } from 'react';
import { Image as KonvaImage, Transformer, Group } from 'react-konva';
import useImage from 'use-image';

const DraggableImage = ({ imageUrl, isSelected, onSelect, onChange, maxSize = 600, externalProps, onExternalChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [image] = useImage(imageUrl);

  const [internalProps, setInternalProps] = useState({
    x: 400,
    y: 400,
    width: 400,
    height: 400,
    rotation: 0
  });

  const shapeProps = externalProps || internalProps;
  const setShapeProps = onExternalChange || setInternalProps;

  // Calculate default size keeping aspect ratio
  useEffect(() => {
    if (image && !externalProps) {
      const scale = Math.min(maxSize / image.width, maxSize / image.height);
      setShapeProps({
        ...shapeProps,
        x: 400 - (image.width * scale) / 2,
        y: 400 - (image.height * scale) / 2,
        width: image.width * scale,
        height: image.height * scale,
      });
    }
  }, [image, maxSize]);

  useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        image={image}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          setShapeProps({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          
          setShapeProps({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default DraggableImage;

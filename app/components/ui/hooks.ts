import { useState, useEffect, useRef } from 'react';

// Hook for draggable behavior
export const useDraggable = (
  id: string,
  initialPos: { x: number; y: number },
  onFocus: ((id: string) => void) | null,
  isLocked = false
) => {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  useEffect(() => { setPos(initialPos); }, [initialPos.x, initialPos.y]);

  const startDrag = (clientX: number, clientY: number) => {
    if (isLocked) return;
    if (onFocus) onFocus(id);
    setIsDragging(true);
    dragStartOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const move = (cx: number, cy: number) => {
      const newX = cx - dragStartOffset.current.x;
      const newY = cy - dragStartOffset.current.y;
      setDragOffset({ x: newX - pos.x, y: newY - pos.y });
    };

    const up = (cx: number, cy: number) => {
      const newX = cx - dragStartOffset.current.x;
      const newY = cy - dragStartOffset.current.y;
      setPos({ x: newX, y: newY });
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY);
    const onMouseUp = (e: MouseEvent) => up(e.clientX, e.clientY);
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0]) {
        up(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, pos.x, pos.y]);

  return { pos, setPos, handleMouseDown, handleTouchStart, isDragging, dragOffset };
};

// Hook for window resizing with position adjustment
export const useResizable = (
  initialSize: { width: number; height: number },
  initialPos: { x: number; y: number },
  onPosChange: (pos: { x: number; y: number }) => void,
  minWidth = 300,
  minHeight = 200
) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState('');
  const startState = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  // Sync size when initialSize prop changes
  useEffect(() => { setSize(initialSize); }, [initialSize.width, initialSize.height]);

  const startResize = (dir: string, clientX: number, clientY: number, currentPos: { x: number; y: number }) => {
    setIsResizing(true);
    setResizeDir(dir);
    startState.current = {
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
      posX: currentPos.x,
      posY: currentPos.y
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startState.current.x;
      const deltaY = e.clientY - startState.current.y;

      let newWidth = startState.current.width;
      let newHeight = startState.current.height;
      let newPosX = startState.current.posX;
      let newPosY = startState.current.posY;

      // East - expand right
      if (resizeDir.includes('e')) {
        newWidth = Math.max(minWidth, startState.current.width + deltaX);
      }

      // West - expand left (need to move window left and increase width)
      if (resizeDir.includes('w')) {
        const attemptedWidth = startState.current.width - deltaX;
        if (attemptedWidth >= minWidth) {
          newWidth = attemptedWidth;
          newPosX = startState.current.posX + deltaX;
        } else {
          newWidth = minWidth;
          newPosX = startState.current.posX + (startState.current.width - minWidth);
        }
      }

      // South - expand down
      if (resizeDir.includes('s')) {
        newHeight = Math.max(minHeight, startState.current.height + deltaY);
      }

      // North - expand up (need to move window up and increase height)
      if (resizeDir.includes('n')) {
        const attemptedHeight = startState.current.height - deltaY;
        if (attemptedHeight >= minHeight) {
          newHeight = attemptedHeight;
          newPosY = startState.current.posY + deltaY;
        } else {
          newHeight = minHeight;
          newPosY = startState.current.posY + (startState.current.height - minHeight);
        }
      }

      setSize({ width: newWidth, height: newHeight });

      // Update position if resizing from north or west
      if (resizeDir.includes('n') || resizeDir.includes('w')) {
        onPosChange({ x: newPosX, y: newPosY });
      }
    };

    const handleUp = () => {
      setIsResizing(false);
      setResizeDir('');
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, resizeDir, minWidth, minHeight, onPosChange]);

  return { size, setSize, startResize, isResizing, resizeDir };
};

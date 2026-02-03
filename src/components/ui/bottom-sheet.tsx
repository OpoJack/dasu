import { useState, useRef, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  peekContent: ReactNode;
  expandedContent: ReactNode;
  peekHeight?: number;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onOpenChange,
  peekContent,
  expandedContent,
  peekHeight = 64,
  className = '',
}: BottomSheetProps) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    offset: number;
  }>({ isDragging: false, offset: 0 });

  const startY = useRef(0);

  // Calculate expanded height (70% of viewport, accounting for bottom nav)
  const expandedHeight = typeof window !== 'undefined'
    ? Math.min(window.innerHeight * 0.7, window.innerHeight - 130)
    : 500;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragState({ isDragging: true, offset: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;

    const currentY = e.touches[0].clientY;
    const delta = startY.current - currentY;

    // Constrain drag offset
    let newOffset: number;
    if (isOpen) {
      // When expanded, allow dragging down (negative delta)
      newOffset = Math.max(-expandedHeight + peekHeight, Math.min(0, -delta));
    } else {
      // When collapsed, allow dragging up (positive delta)
      newOffset = Math.min(expandedHeight - peekHeight, Math.max(0, delta));
    }

    setDragState({ isDragging: true, offset: newOffset });
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging) return;

    const threshold = (expandedHeight - peekHeight) * 0.3;
    const dragOffset = dragState.offset;

    // Reset drag state first
    setDragState({ isDragging: false, offset: 0 });

    if (isOpen) {
      // If dragged down enough, collapse
      if (dragOffset < -threshold) {
        onOpenChange(false);
      }
    } else {
      // If dragged up enough, expand
      if (dragOffset > threshold) {
        onOpenChange(true);
      }
    }
  };

  // Calculate current height
  const baseHeight = isOpen ? expandedHeight : peekHeight;
  const currentHeight = dragState.isDragging
    ? baseHeight + dragState.offset
    : baseHeight;

  return (
    <div
      className={`fixed left-0 right-0 bg-background border-t shadow-lg z-40 transition-all ${
        dragState.isDragging ? 'duration-0' : 'duration-300 ease-out'
      } ${className}`}
      style={{
        bottom: 64, // Account for bottom nav
        height: Math.max(peekHeight, currentHeight),
      }}
    >
      {/* Drag handle area */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !dragState.isDragging && onOpenChange(!isOpen)}
      >
        {/* Visual drag handle */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-1" />

        {/* Chevron indicator */}
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content area */}
      <div className="h-[calc(100%-36px)] overflow-hidden">
        {isOpen ? (
          <div className="h-full overflow-y-auto">
            {expandedContent}
          </div>
        ) : (
          <div className="h-full">
            {peekContent}
          </div>
        )}
      </div>
    </div>
  );
}

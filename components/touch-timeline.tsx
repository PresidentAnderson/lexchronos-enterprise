'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TouchTimelineProps {
  className?: string;
  children: React.ReactNode;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (x: number, y: number) => void;
  minZoom?: number;
  maxZoom?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  enableSwipe?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export function TouchTimeline({
  className,
  children,
  onZoomChange,
  onPanChange,
  minZoom = 0.5,
  maxZoom = 3,
  enablePan = true,
  enableZoom = true,
  enableSwipe = true,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: TouchTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [touches, setTouches] = useState<TouchPoint[]>([]);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number; time: number } | null>(null);

  // Get distance between two touch points
  const getDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint) => {
    return Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    );
  }, []);

  // Get center point between two touches
  const getCenter = useCallback((touch1: TouchPoint, touch2: TouchPoint) => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2,
    };
  }, []);

  // Convert touch event to touch points
  const getTouchPoints = useCallback((e: TouchEvent): TouchPoint[] => {
    return Array.from(e.touches).map((touch) => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
    }));
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touchPoints = getTouchPoints(e);
    setTouches(touchPoints);

    if (touchPoints.length === 1) {
      // Single touch - could be pan start or swipe
      const touch = touchPoints[0];
      setSwipeStart({ x: touch.x, y: touch.y, time: Date.now() });
      
      // Handle double tap for zoom
      const now = Date.now();
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap < 300) {
        // Double tap detected
        if (enableZoom) {
          const newZoom = zoom > 1 ? 1 : 2;
          setZoom(newZoom);
          onZoomChange?.(newZoom);
        }
      }
      setLastTap(now);
    } else if (touchPoints.length === 2 && enableZoom) {
      // Two touches - pinch zoom
      const distance = getDistance(touchPoints[0], touchPoints[1]);
      setInitialDistance(distance);
      setInitialZoom(zoom);
      setInitialPan(pan);
    }
  }, [getTouchPoints, lastTap, zoom, pan, enableZoom, onZoomChange]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touchPoints = getTouchPoints(e);

    if (touchPoints.length === 1 && enablePan) {
      // Single touch - panning
      const touch = touchPoints[0];
      if (touches.length === 1) {
        const deltaX = touch.x - touches[0].x;
        const deltaY = touch.y - touches[0].y;
        const newPan = {
          x: pan.x + deltaX,
          y: pan.y + deltaY,
        };
        setPan(newPan);
        onPanChange?.(newPan.x, newPan.y);
      }
    } else if (touchPoints.length === 2 && enableZoom) {
      // Two touches - pinch zoom
      const distance = getDistance(touchPoints[0], touchPoints[1]);
      const center = getCenter(touchPoints[0], touchPoints[1]);
      
      if (initialDistance > 0) {
        const scale = distance / initialDistance;
        const newZoom = Math.min(Math.max(initialZoom * scale, minZoom), maxZoom);
        setZoom(newZoom);
        onZoomChange?.(newZoom);

        // Zoom around the center point
        const zoomDelta = newZoom - initialZoom;
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const centerX = center.x - containerRect.left - containerRect.width / 2;
          const centerY = center.y - containerRect.top - containerRect.height / 2;
          
          setPan({
            x: initialPan.x - centerX * zoomDelta * 0.1,
            y: initialPan.y - centerY * zoomDelta * 0.1,
          });
        }
      }
    }

    setTouches(touchPoints);
  }, [
    getTouchPoints,
    touches,
    pan,
    enablePan,
    enableZoom,
    initialDistance,
    initialZoom,
    initialPan,
    minZoom,
    maxZoom,
    getDistance,
    getCenter,
    onZoomChange,
    onPanChange,
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touchPoints = getTouchPoints(e);

    // Handle swipe detection
    if (touchPoints.length === 0 && swipeStart && enableSwipe) {
      const swipeEnd = touches[0];
      if (swipeEnd) {
        const deltaX = swipeEnd.x - swipeStart.x;
        const deltaY = swipeEnd.y - swipeStart.y;
        const deltaTime = Date.now() - swipeStart.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime;

        // Swipe thresholds
        if (velocity > 0.3 && distance > 50) {
          const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
          
          if (Math.abs(angle) < 30) {
            // Right swipe
            onSwipeRight?.();
          } else if (Math.abs(angle) > 150) {
            // Left swipe
            onSwipeLeft?.();
          } else if (angle > 60 && angle < 120) {
            // Down swipe
            onSwipeDown?.();
          } else if (angle < -60 && angle > -120) {
            // Up swipe
            onSwipeUp?.();
          }
        }
      }
      setSwipeStart(null);
    }

    setTouches(touchPoints);
    
    if (touchPoints.length < 2) {
      setInitialDistance(0);
    }
  }, [
    getTouchPoints,
    swipeStart,
    touches,
    enableSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Passive listeners for better performance
    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);

    // Prevent default context menu on long press
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Mouse wheel support for desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!enableZoom) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, minZoom), maxZoom);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, enableZoom, minZoom, maxZoom, onZoomChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Reset zoom and pan
  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onZoomChange?.(1);
    onPanChange?.(0, 0);
  }, [onZoomChange, onPanChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-none select-none',
        'cursor-grab active:cursor-grabbing',
        className
      )}
      style={{
        touchAction: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="transform-gpu will-change-transform"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
          transition: touches.length === 0 ? 'transform 0.1s ease-out' : 'none',
        }}
      >
        {children}
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            const newZoom = Math.min(zoom * 1.2, maxZoom);
            setZoom(newZoom);
            onZoomChange?.(newZoom);
          }}
          className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(zoom * 0.8, minZoom);
            setZoom(newZoom);
            onZoomChange?.(newZoom);
          }}
          className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetTransform}
          className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs"
          aria-label="Reset zoom and pan"
        >
          ⌂
        </button>
      </div>

      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
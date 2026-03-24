import { useEffect, useRef, useState, useCallback } from 'react';

export type FabPosition = { right: number; bottom: number };

/**
 * Returns a fixed position (right, bottom) for a draggable FAB.
 * Persists position to localStorage under `key`.
 * Call `onPointerDown` on the button's onPointerDown event to enable dragging.
 * Returns `isDragging` so you can suppress click events while dragging.
 */
export function useDraggableFab(key: string, defaultPos: FabPosition) {
  const [pos, setPos] = useState<FabPosition>(() => {
    if (typeof window === 'undefined') return defaultPos;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultPos;
    } catch {
      return defaultPos;
    }
  });

  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const startPtr   = useRef({ x: 0, y: 0 });
  const startPos   = useRef<FabPosition>(defaultPos);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0) return;
    isDragging.current = true;
    hasMoved.current   = false;
    startPtr.current   = { x: e.clientX, y: e.clientY };
    startPos.current   = pos;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startPtr.current.x;
    const dy = e.clientY - startPtr.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    const newRight  = Math.max(8, Math.min(window.innerWidth  - 64, startPos.current.right  - dx));
    const newBottom = Math.max(8, Math.min(window.innerHeight - 64, startPos.current.bottom - dy));
    setPos({ right: newRight, bottom: newBottom });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    setPos(p => {
      try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* ignore */ }
      return p;
    });
  }, [key]);

  return {
    pos,
    dragging,
    hasMoved,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}

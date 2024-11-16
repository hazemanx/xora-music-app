import { useState, useEffect, useCallback } from 'react';

export function useGestures({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  onLongPress,
  threshold = 50,
  longPressDelay = 500
}) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 });
  const [lastTap, setLastTap] = useState(0);
  const [pressTimer, setPressTimer] = useState(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    // Double tap detection
    if (now - lastTap < 300) {
      onDoubleTap?.();
      setLastTap(0);
    } else {
      setLastTap(now);
    }

    // Long press detection
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
      setPressTimer(timer);
    }

    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: now
    });
  }, [lastTap, longPressDelay, onDoubleTap, onLongPress]);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.time) return;

    // Clear long press timer on move
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const time = Date.now() - touchStart.time;

    // Calculate velocity for smooth animations
    const velocity = {
      x: Math.abs(deltaX) / time,
      y: Math.abs(deltaY) / time
    };

    // Determine primary direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.(velocity.x);
        } else {
          onSwipeLeft?.(velocity.x);
        }
        setTouchStart({ x: 0, y: 0, time: 0 });
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.(velocity.y);
        } else {
          onSwipeUp?.(velocity.y);
        }
        setTouchStart({ x: 0, y: 0, time: 0 });
      }
    }
  }, [touchStart, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, pressTimer]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
} 
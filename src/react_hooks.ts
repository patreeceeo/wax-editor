import {useCallback, useEffect, useRef, useState} from 'react';
import {Vec2} from './vec2';

type EventTypeMap = {
  wheel: WheelEvent;
}

/**
* Return an HTML element ref with an event listener attached.
* Useful for adding passive event listeners to elements.
*/
export function useEventListener<E extends Element, EventName extends keyof EventTypeMap>(
  eventName: EventName,
  handler: (event: EventTypeMap[EventName]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const elementRef = useRef<E | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener(eventName, handler as any, options);

    return () => {
      element.removeEventListener(eventName, handler as any, options);
    };
  }, [eventName, options]);

  return elementRef;
}

export function useResizeObserver<ContainerElement extends Element>(
  elementRef: React.RefObject<ContainerElement | null>,
  callback: ResizeObserverCallback,
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(callback);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [callback]);
}

interface Animation {
  requestFrame: () => void;
  cancelFrameRequest: () => void;
}

/**
* Hook for using requestAnimationFrame in a React component.
* @return {Animation} to control the animation loop.
*/
export function useAnimation(animate: (deltaTime: number, time: number) => void): Animation {
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  const continueAnimation = useCallback(() => {
    requestRef.current = requestAnimationFrame((time => {
      animate(prevTimeRef.current !== null ? time - prevTimeRef.current : 0, time);
      prevTimeRef.current = time;
    }));
  }, [animate]);

  const cancelAnimation = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimation();
  }, []);

  return {
    requestFrame: continueAnimation,
    cancelFrameRequest: cancelAnimation,
  };
}

/**
* Hook for tracking the dimensions of an HTML element.
*/
export function useElementSize<ElementType extends Element>(aspectRatio: number): [React.RefObject<ElementType | null>, {width: number; height: number}] {
  const elementRef = useRef<ElementType | null>(null);
  const [size, setSize] = useState({width: aspectRatio, height: 1});

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      setSize({width: rect.width, height: rect.height});
    }
  }, [setSize]);

  useResizeObserver(elementRef, (entries) => {
    for (let entry of entries) {
      const {width, height} = entry.contentRect;
      setSize({width, height});
    }
  });

  return [elementRef, size];
}


export function usePanning(
  containerRef: React.RefObject<Element | null>,
) {
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const translateRef = useRef(new Vec2(0, 0));

  const onMouseDown = useCallback((event: MouseEvent) => {
    setIsPanning(event.target === containerRef.current);
    setStartX(event.clientX);
    setStartY(event.clientY);
  }, [translateX, translateY, setIsPanning, setStartX, setStartY]);

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (!isPanning) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    translateRef.current.x = translateX + deltaX;
    translateRef.current.y = translateY + deltaY;

    animation.requestFrame();
  }, [isPanning, startX, startY]);

  const onMouseUp = useCallback(() => {
    if (!isPanning) return;

    setTranslateX(translateRef.current.x);
    setTranslateY(translateRef.current.y);
    setIsPanning(false);
  }, [isPanning, setTranslateX, setTranslateY, setIsPanning]);

  const animation = useAnimation(() => {
    setTranslateX(translateRef.current.x);
    setTranslateY(translateRef.current.y);
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', onMouseDown as any, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown as any);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseDown, onMouseMove, onMouseUp]);

  return {translation: new Vec2(translateX, translateY), active: isPanning,
    setActive: setIsPanning,
    updateTranslation: (fn: (vec2: Vec2) => void) => {
      fn(translateRef.current);
      if(!translateRef.current.isZero()) {
        animation.requestFrame();
      }
    }};
}

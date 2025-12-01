import {useCallback, useEffect, useRef} from 'react';

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
export function useAnimation(animate: (time: number) => void): Animation {
  const requestRef = useRef<number | null>(null);

  const continueAnimation = useCallback(() => {
    requestRef.current = requestAnimationFrame((time => {
      animate(time);
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

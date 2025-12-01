import {useEffect, useRef} from 'react';

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

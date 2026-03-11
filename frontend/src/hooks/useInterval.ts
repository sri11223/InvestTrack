import { useEffect, useRef } from 'react';

/**
 * Custom hook for setting up intervals that properly clean up.
 * Follows Dan Abramov's useInterval pattern for React hooks.
 *
 * @param callback - Function to call on each interval tick
 * @param delay - Interval in ms, or null to pause
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback to avoid stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

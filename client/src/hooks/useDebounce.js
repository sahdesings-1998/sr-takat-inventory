import { useEffect, useState } from "react";

/**
 * useDebounce — returns a debounced version of a value.
 * @param {*} value - value to debounce
 * @param {number} delay - ms to wait (default 300ms)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
